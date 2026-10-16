import type { Review, ReviewStatus, MovieRatingStats } from '@/types/review';

const STORAGE_KEY = 'cineverse_reviews_db';
const CHANGE_EVENT = 'cineverse_reviews_changed';

// Pre-seeded realistic Vietnamese reviews for key movies
const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    movieId: 'dune-2',
    movieTitle: 'Xứ Cát: Phần Hai',
    userId: 'user-demo-1',
    userName: 'Minh Hoàng',
    rating: 10,
    content:
      'Âm thanh và hình ảnh của Denis Villeneuve đúng là đỉnh cao điện ảnh thế giới. Phân cảnh cưỡi sâu cát của Paul Atreides ở rạp IMAX làm mình sởn gai ốc, xứng đáng 10/10!',
    likes: 24,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    status: 'approved',
  },
  {
    id: 'rev-2',
    movieId: 'dune-2',
    movieTitle: 'Xứ Cát: Phần Hai',
    userId: 'user-2',
    userName: 'Thanh Thảo',
    rating: 9,
    content:
      'Diễn xuất của Timothée và Zendaya quá ăn ý. Austin Butler đóng vai phản diện Feyd-Rautha nhìn rợn tóc gáy luôn. Nhạc phim của Hans Zimmer quá hoành tráng.',
    likes: 15,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    status: 'approved',
  },
  {
    id: 'rev-3',
    movieId: 'oppenheimer',
    movieTitle: 'Oppenheimer',
    userId: 'user-3',
    userName: 'Bảo Long',
    rating: 10,
    content:
      'Một kiệt tác tiểu sử kịch tính từ đầu đến cuối dù phần lớn là các cuộc hội thoại trong phòng kín. Cillian Murphy diễn bằng ánh mắt quá đỉnh cao.',
    likes: 38,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'approved',
  },
  {
    id: 'rev-4',
    movieId: 'oppenheimer',
    movieTitle: 'Oppenheimer',
    userId: 'user-4',
    userName: 'Hà Linh',
    rating: 8,
    content:
      'Đoạn thử nghiệm Trinity im lặng tuyệt đối rồi nổ tung làm cả rạp nín thở. Ai thích phim tâm lý chiến tranh sẽ cực kỳ thích.',
    likes: 9,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'approved',
  },
  {
    id: 'rev-5',
    movieId: 'the-batman',
    movieTitle: 'Người Dơi',
    userId: 'user-5',
    userName: 'Văn Đức',
    rating: 9,
    content:
      'Không khí trinh thám noir u ám tuyệt đẹp. Batman của Robert Pattinson gai góc và chân thực hơn hẳn các phần trước.',
    likes: 19,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    status: 'approved',
  },
  {
    id: 'rev-6',
    movieId: 'spider-man-across-the-spider-verse',
    movieTitle: 'Người Nhện: Du Hành Vũ Trụ Nhện 2',
    userId: 'user-6',
    userName: 'Quang Anh',
    rating: 10,
    content:
      'Đồ họa đỉnh cao nhất lịch sử hoạt hình thế giới! Mỗi vũ trụ một phong cách vẽ riêng biệt. Kết phim để lại cliffhanger quá hồi hộp.',
    likes: 42,
    hasSpoiler: true,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'approved',
  },
  {
    id: 'rev-7',
    movieId: 'spirited-away',
    movieTitle: 'Vùng Đất Linh Hồn',
    userId: 'user-7',
    userName: 'Mai Phương',
    rating: 10,
    content:
      'Tuổi thơ của mình. Dù xem lại bao nhiêu lần vẫn xúc động với hành trình của Chihiro và Haku. Nhạc Joe Hisaishi nghe muốn khóc.',
    likes: 31,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: 'approved',
  },
  {
    id: 'rev-8',
    movieId: 'shogun',
    movieTitle: 'Tướng Quân',
    userId: 'user-8',
    userName: 'Tuấn Kiệt',
    rating: 9,
    content:
      'Bối cảnh nước Nhật thời phong kiến được tái hiện chi tiết đến từng bộ kimono và cách cúi chào. Mưu lược chính trị thâm sâu như Game of Thrones thời đỉnh cao.',
    likes: 17,
    hasSpoiler: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'approved',
  },
];

let cachedReviews: Review[] | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadFromStorage(): Review[] {
  if (!isBrowser()) return SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
      cachedReviews = SEED_REVIEWS;
      return SEED_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedReviews = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error loading reviews from localStorage:', err);
  }
  cachedReviews = SEED_REVIEWS;
  return SEED_REVIEWS;
}

function saveToStorage(reviews: Review[]): void {
  cachedReviews = reviews;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: reviews }));
  } catch (err) {
    console.error('Error saving reviews to localStorage:', err);
  }
}

export const reviewService = {
  getAllReviews(): Review[] {
    if (cachedReviews) return cachedReviews;
    return loadFromStorage();
  },

  getReviewsByMovie(movieId: string): Review[] {
    const all = this.getAllReviews();
    return all.filter(
      (r) => (r.movieId === movieId || r.movieId.toLowerCase() === movieId.toLowerCase()) && r.status === 'approved'
    );
  },

  getMovieRatingStats(movieId: string): MovieRatingStats {
    const reviews = this.getReviewsByMovie(movieId);
    const totalCount = reviews.length;

    const distribution: Record<number, number> = {
      10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
    };

    if (totalCount === 0) {
      return { avgRating: 8.5, totalCount: 0, distribution };
    }

    let sum = 0;
    reviews.forEach((r) => {
      const score = Math.max(1, Math.min(10, Math.round(r.rating)));
      distribution[score] = (distribution[score] || 0) + 1;
      sum += r.rating;
    });

    const avgRating = parseFloat((sum / totalCount).toFixed(1));
    return { avgRating, totalCount, distribution };
  },

  addReview(data: {
    movieId: string;
    movieTitle: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    content: string;
    hasSpoiler?: boolean;
  }): Review {
    const all = [...this.getAllReviews()];
    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      movieId: data.movieId,
      movieTitle: data.movieTitle,
      userId: data.userId || 'guest',
      userName: data.userName.trim() || 'Khán giả',
      userAvatar: data.userAvatar,
      rating: Math.max(1, Math.min(10, data.rating)),
      content: data.content.trim(),
      hasSpoiler: Boolean(data.hasSpoiler),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      status: 'approved',
    };

    // Prepend to top
    all.unshift(newReview);
    saveToStorage(all);
    return newReview;
  },

  toggleLike(reviewId: string, userId = 'user-current'): boolean {
    const all = [...this.getAllReviews()];
    const index = all.findIndex((r) => r.id === reviewId);
    if (index === -1) return false;

    const review = all[index];
    const likedBy = review.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      all[index] = {
        ...review,
        likes: Math.max(0, review.likes - 1),
        likedBy: likedBy.filter((id) => id !== userId),
      };
    } else {
      all[index] = {
        ...review,
        likes: review.likes + 1,
        likedBy: [...likedBy, userId],
      };
    }

    saveToStorage(all);
    return !isLiked;
  },

  updateStatus(reviewId: string, status: ReviewStatus): boolean {
    const all = [...this.getAllReviews()];
    const index = all.findIndex((r) => r.id === reviewId);
    if (index === -1) return false;

    all[index] = { ...all[index], status };
    saveToStorage(all);
    return true;
  },

  deleteReview(reviewId: string): boolean {
    const all = this.getAllReviews();
    const filtered = all.filter((r) => r.id !== reviewId);
    if (filtered.length === all.length) return false;
    saveToStorage(filtered);
    return true;
  },

  getStats(): { totalReviews: number; avgRating: number; hiddenCount: number } {
    const all = this.getAllReviews();
    const totalReviews = all.length;
    const hiddenCount = all.filter((r) => r.status === 'hidden').length;
    const sum = all.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : 8.5;

    return { totalReviews, avgRating, hiddenCount };
  },

  subscribe(callback: () => void): () => void {
    if (!isBrowser()) return () => {};
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cachedReviews = null;
        callback();
      }
    };
    const handleCustom = () => {
      callback();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CHANGE_EVENT, handleCustom);
    };
  },
};
