import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from './config';

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims verifies the JWT and refreshes it when needed.
  const { data, error } = await supabase.auth.getClaims();

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const redirectWithRefreshedCookies = (url: URL) => {
      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    };

    if (error || !data?.claims) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return redirectWithRefreshedCookies(loginUrl);
    }

    if (data.claims.app_metadata?.role !== 'admin') {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/';
      forbiddenUrl.search = '';
      forbiddenUrl.searchParams.set('admin', 'forbidden');
      return redirectWithRefreshedCookies(forbiddenUrl);
    }
  }

  return response;
}

