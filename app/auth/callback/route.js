import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Route
 *
 * Supabase redirects here after email confirmation.
 * We exchange the ?code= param for a session, then
 * redirect the user to the dashboard (or a custom `next` path).
 *
 * Configure this URL in Supabase Dashboard:
 *   Authentication → URL Configuration → Redirect URLs
 *   → Add: http://localhost:3000/auth/callback
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If Supabase returned an error in the URL (e.g. expired link)
  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', errorDescription ?? error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Successfully authenticated — send to dashboard (or custom next)
      const redirectUrl = new URL(next, requestUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange failed (expired code, already used, etc.)
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'Confirmation link has expired. Please sign in.');
    return NextResponse.redirect(loginUrl);
  }

  // No code param — shouldn't happen, but handle gracefully
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
