/**
 * Middleware for Authentication and Route Protection
 * Checks if user is authenticated for protected routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard'];

/**
 * Middleware function to handle route protection
 * Redirects unauthenticated users from protected routes
 */
export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname;

  // Check if the path is protected
  const isProtectedPath = PROTECTED_PATHS.some(protectedPath =>
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );

  // If path is not protected, allow the request
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const sessionCookie = request.cookies.get('session_id');
  const hasSession = !!sessionCookie;

  // If no session cookie found, redirect to login
  if (!hasSession) {
    console.log('No session cookie found for protected path:', path);

    // Store the intended destination to redirect back after login
    const redirectUrl = new URL('/auth/verify', request.url);
    redirectUrl.searchParams.set('redirect', path);

    return NextResponse.redirect(redirectUrl);
  }

  // If we have a session cookie, validate it against the user_sessions table
  // This would be done in a real app, but for simplicity we'll just allow the request to proceed
  // In a production app, you'd want to verify the session is still valid in Supabase

  return NextResponse.next();
}

export const config = {
  // Define the paths that will trigger this middleware
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (these handle their own authentication)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
