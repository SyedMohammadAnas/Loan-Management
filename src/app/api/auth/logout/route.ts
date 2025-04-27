/**
 * Logout API Route
 * Handles user logout by clearing cookies and session data
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST handler for logout
 * Clears session cookies and related database records
 */
export async function POST() {
  try {
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_id');

    // If session cookie exists, delete the session from database
    if (sessionCookie) {
      // Clear from database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionCookie.value);

      // Clear the cookie
      await cookieStore.delete('session_id');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    );
  }
}
