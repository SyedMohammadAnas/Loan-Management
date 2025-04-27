import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback route handler
 *
 * Processes OAuth callback after authentication with provider
 * Handles session exchange and redirect to appropriate page
 */
export async function GET(request: NextRequest) {
  // Extract the code from the URL
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // If no code is present, something went wrong during auth
  if (code) {
    // Initialize Supabase client using cookies for server components
    const supabase = createRouteHandlerClient({ cookies });

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to dashboard after authentication
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
