/**
 * Session Check API Route
 * Validates if user has a valid session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET handler for session check
 * Returns whether the user has a valid session cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_id');

    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session cookie found'
      });
    }

    // Check if session exists in database
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionCookie.value)
      .single();

    if (error || !data) {
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid session'
      });
    }

    // Check if session is expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Session expired, clean up
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionCookie.value);

      return NextResponse.json({
        authenticated: false,
        message: 'Session expired'
      });
    }

    // Session is valid
    return NextResponse.json({
      authenticated: true,
      email: data.email,
      verified: data.verified
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Error checking session' },
      { status: 500 }
    );
  }
}
