import { redirect } from 'next/navigation';
import { createClient } from './server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) redirect('/login?redirect=/admin');
  if (claims.app_metadata?.role !== 'admin') redirect('/?admin=forbidden');

  return { supabase, claims };
}

