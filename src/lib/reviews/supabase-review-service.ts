import { createClient } from '@/lib/supabase/client';
import type { Review, ReviewStatus } from '@/types/review';

type ReviewRow = {
  id: string;
  movie_slug: string;
  movie_title: string;
  user_id: string;
  rating: number;
  content: string;
  has_spoiler: boolean;
  likes_count: number;
  status: ReviewStatus;
  created_at: string;
};

type ReplyRow = {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string;
};

async function requireUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Vui lòng đăng nhập để thực hiện thao tác này.');
  return { supabase, user: data.user };
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const supabaseReviewService = {
  async getAllReviews(movieSlug?: string): Promise<Review[]> {
    const supabase = createClient();
    let query = supabase
      .from('reviews')
      .select('id,movie_slug,movie_title,user_id,rating,content,has_spoiler,likes_count,status,created_at')
      .order('created_at', { ascending: false });

    if (movieSlug) query = query.eq('movie_slug', movieSlug);

    const { data: reviewData, error: reviewError } = await query;
    throwIfError(reviewError);
    const reviews = (reviewData ?? []) as ReviewRow[];
    if (reviews.length === 0) return [];

    const reviewIds = reviews.map((review) => review.id);
    const { data: replyData, error: replyError } = await supabase
      .from('review_replies')
      .select('id,review_id,user_id,content,likes_count,created_at')
      .in('review_id', reviewIds)
      .order('created_at', { ascending: true });
    throwIfError(replyError);
    const replies = (replyData ?? []) as ReplyRow[];

    const profileIds = [...new Set([...reviews.map((review) => review.user_id), ...replies.map((reply) => reply.user_id)])];
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id,display_name,avatar_url')
      .in('id', profileIds);
    throwIfError(profileError);
    const profiles = new Map(
      ((profileData ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
    );

    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;
    const likedReviews = new Set<string>();
    const likedReplies = new Set<string>();

    if (currentUserId) {
      const reviewLikesResult = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', currentUserId)
        .in('review_id', reviewIds);
      (reviewLikesResult.data ?? []).forEach((like) => likedReviews.add(like.review_id));

      if (replies.length > 0) {
        const replyLikesResult = await supabase
          .from('review_reply_likes')
          .select('reply_id')
          .eq('user_id', currentUserId)
          .in('reply_id', replies.map((reply) => reply.id));
        (replyLikesResult.data ?? []).forEach((like) => likedReplies.add(like.reply_id));
      }
    }

    return reviews.map((review) => {
      const profile = profiles.get(review.user_id);
      return {
        id: review.id,
        movieId: review.movie_slug,
        movieTitle: review.movie_title,
        userId: review.user_id,
        userName: profile?.display_name || 'Thành viên CineVerse',
        userAvatar: profile?.avatar_url || undefined,
        rating: review.rating,
        content: review.content,
        hasSpoiler: review.has_spoiler,
        likes: review.likes_count,
        likedBy: currentUserId && likedReviews.has(review.id) ? [currentUserId] : [],
        createdAt: review.created_at,
        status: review.status,
        replies: replies
          .filter((reply) => reply.review_id === review.id)
          .map((reply) => {
            const replyProfile = profiles.get(reply.user_id);
            return {
              id: reply.id,
              reviewId: reply.review_id,
              userId: reply.user_id,
              userName: replyProfile?.display_name || 'Thành viên CineVerse',
              userAvatar: replyProfile?.avatar_url || undefined,
              content: reply.content,
              createdAt: reply.created_at,
              likes: reply.likes_count,
              likedBy: currentUserId && likedReplies.has(reply.id) ? [currentUserId] : [],
            };
          }),
      };
    });
  },

  async addReview(data: {
    movieId: string;
    movieTitle: string;
    rating: number;
    content: string;
    hasSpoiler?: boolean;
  }): Promise<void> {
    const { supabase, user } = await requireUser();
    const payload = {
      rating: Math.max(1, Math.min(10, Math.round(data.rating))),
      content: data.content.trim(),
      has_spoiler: Boolean(data.hasSpoiler),
    };

    const { data: existing, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('movie_slug', data.movieId)
      .eq('user_id', user.id)
      .maybeSingle();
    throwIfError(existingError);

    if (existing) {
      const { error } = await supabase.from('reviews').update(payload).eq('id', existing.id);
      throwIfError(error);
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      movie_slug: data.movieId,
      movie_title: data.movieTitle,
      user_id: user.id,
      ...payload,
    });
    throwIfError(error);
  },

  async toggleLike(reviewId: string): Promise<void> {
    const { supabase, user } = await requireUser();
    const { data: existing, error: lookupError } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .maybeSingle();
    throwIfError(lookupError);

    const result = existing
      ? await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', user.id)
      : await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id });
    throwIfError(result.error);
  },

  async addReply(reviewId: string, data: { content: string }): Promise<void> {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from('review_replies').insert({
      review_id: reviewId,
      user_id: user.id,
      content: data.content.trim(),
    });
    throwIfError(error);
  },

  async toggleReplyLike(_reviewId: string, replyId: string): Promise<void> {
    const { supabase, user } = await requireUser();
    const { data: existing, error: lookupError } = await supabase
      .from('review_reply_likes')
      .select('reply_id')
      .eq('reply_id', replyId)
      .eq('user_id', user.id)
      .maybeSingle();
    throwIfError(lookupError);

    const result = existing
      ? await supabase.from('review_reply_likes').delete().eq('reply_id', replyId).eq('user_id', user.id)
      : await supabase.from('review_reply_likes').insert({ reply_id: replyId, user_id: user.id });
    throwIfError(result.error);
  },

  async updateStatus(reviewId: string, status: ReviewStatus): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.rpc('admin_set_review_status', {
      target_review_id: reviewId,
      new_status: status,
    });
    throwIfError(error);
  },

  async deleteReview(reviewId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    throwIfError(error);
  },
};
