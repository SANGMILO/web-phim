'use client';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface SyncedProfile {
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  favoriteGenres?: string[];
  role: 'user' | 'vip' | 'admin';
  status: 'active' | 'suspended';
}

export type SyncedProfileUpdate = Pick<
  SyncedProfile,
  'displayName' | 'avatarUrl' | 'phone' | 'bio' | 'favoriteGenres'
>;

type ProfileRow = {
  display_name: string;
  avatar_url: string;
  role: SyncedProfile['role'];
  status: SyncedProfile['status'];
};

type ProfileDetailsRow = {
  phone: string;
  bio: string;
  favorite_genres: string[];
};

function mapProfile(row: ProfileRow, details?: ProfileDetailsRow | null): SyncedProfile {
  return {
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    phone: details?.phone || '',
    bio: details?.bio || '',
    favoriteGenres: details?.favorite_genres ?? [],
    role: row.role,
    status: row.status,
  };
}

function validateProfile(input: SyncedProfileUpdate) {
  const displayName = input.displayName.trim();
  const avatarUrl = input.avatarUrl?.trim() ?? '';
  const phone = input.phone?.trim() ?? '';
  const bio = input.bio?.trim() ?? '';
  const favoriteGenres = [...new Set(input.favoriteGenres ?? [])]
    .map((genre) => genre.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!displayName || displayName.length > 100) {
    throw new Error('Tên hiển thị phải có từ 1 đến 100 ký tự.');
  }
  if (phone.length > 30) throw new Error('Số điện thoại không được dài quá 30 ký tự.');
  if (bio.length > 500) throw new Error('Giới thiệu không được dài quá 500 ký tự.');
  if (avatarUrl.length > 500_000) throw new Error('Ảnh đại diện có dung lượng quá lớn.');

  return { displayName, avatarUrl, phone, bio, favoriteGenres };
}

const PROFILE_COLUMNS = 'display_name,avatar_url,role,status';
const PROFILE_DETAILS_COLUMNS = 'phone,bio,favorite_genres';

export const supabaseProfileService = {
  async getMyProfile(userId: string): Promise<SyncedProfile | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData.user?.id !== userId) {
      throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
    }

    const [profileResult, detailsResult] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).single(),
      supabase
        .from('profile_details')
        .select(PROFILE_DETAILS_COLUMNS)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (profileResult.error) throw new Error(profileResult.error.message);
    if (detailsResult.error) throw new Error(detailsResult.error.message);
    return mapProfile(
      profileResult.data as ProfileRow,
      detailsResult.data as ProfileDetailsRow | null,
    );
  },

  async updateMyProfile(
    userId: string,
    input: SyncedProfileUpdate,
  ): Promise<SyncedProfile | null> {
    if (!isSupabaseConfigured()) return null;

    const values = validateProfile(input);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData.user?.id !== userId) {
      throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: values.displayName,
        avatar_url: values.avatarUrl,
      })
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw new Error(error.message);

    const { error: detailsError } = await supabase.from('profile_details').upsert(
      {
        user_id: userId,
        phone: values.phone,
        bio: values.bio,
        favorite_genres: values.favoriteGenres,
      },
      { onConflict: 'user_id' },
    );
    if (detailsError) throw new Error(detailsError.message);

    const metadataAvatar = values.avatarUrl.startsWith('data:')
      ? ''
      : values.avatarUrl.slice(0, 2048);
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        display_name: values.displayName,
        avatar_url: metadataAvatar,
      },
    });
    if (metadataError) throw new Error(metadataError.message);

    return mapProfile(data as ProfileRow, {
      phone: values.phone,
      bio: values.bio,
      favorite_genres: values.favoriteGenres,
    });
  },
};
