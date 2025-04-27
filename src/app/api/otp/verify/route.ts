/**
 * API Route for OTP Verification
 * This endpoint handles validating OTPs submitted by users
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST handler for OTP verification
 * Accepts email and otp in request body and validates the OTP
 * Returns session information for redirection on success
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validate inputs
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Valid 6-digit OTP is required' },
        { status: 400 }
      );
    }

    // Verify the OTP against the otps table in Supabase
    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // OTP is valid - Create a session for the user
    const cookieStore = await cookies();

    // Set a session cookie that will be used to authenticate the user
    const sessionId = Math.random().toString(36).substring(2, 15);
    await cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Calculate expiration date for the session
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + 1); // 24 hours from now

    // Log successful verification in user_sessions table
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert([{
        email,
        session_id: sessionId,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        verified: true
      }]);

    if (sessionError) {
      console.error('Error creating session record:', sessionError);
      // We continue anyway as this is not critical
    }

    // OTP is valid
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      redirectUrl: '/dashboard',
      session: {
        email,
        verified: true
      }
    });
  } catch (error) {
    console.error('Error in OTP verification endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
