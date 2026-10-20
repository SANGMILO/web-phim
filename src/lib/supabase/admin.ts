import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let adminClient: SupabaseClient | null = null;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const { url } = getSupabaseConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error('Thiếu SUPABASE_SECRET_KEY trên máy chủ.');
  }

  adminClient = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}

