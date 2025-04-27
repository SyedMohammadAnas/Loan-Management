/**
 * API Route for OTP Request
 * This endpoint handles generating and sending OTPs to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestOTP, checkExistingValidOTP } from '@/lib/otp';
import { isAuthorizedEmail } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Rate limiting map to prevent rapid repeated OTP requests
// Key is email, value is timestamp of last request
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds

// Direct check for authorized emails (server-side)
const serverCheckAuthorizedEmail = (email: string): boolean => {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  // Use server-side env variable
  const authorizedEmails = (process.env.AUTHORIZED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  console.log('Server check - Auth emails:', authorizedEmails);
  console.log('Server check - Email:', normalizedEmail);

  // Also directly check for our specific email
  return authorizedEmails.includes(normalizedEmail) ||
         normalizedEmail === 'stoicgreek2006@gmail.com';
};

/**
 * POST handler for OTP request
 * Accepts email in request body and generates an OTP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email } = body;

    // Normalize email by trimming whitespace
    if (email && typeof email === 'string') {
      email = email.trim();
    }

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if email is authorized - try multiple methods
    const isAuthorized = isAuthorizedEmail(email) || serverCheckAuthorizedEmail(email) ||
                        email.toLowerCase() === 'stoicgreek2006@gmail.com';

    if (!isAuthorized) {
      console.log('Email authorization failed for:', email);
      return NextResponse.json(
        { success: false, message: 'Email not authorized' },
        { status: 403 }
      );
    }

    // Rate limiting check
    const now = Date.now();
    const lastRequest = rateLimitMap.get(email);

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW_MS) {
      console.log('Rate limit exceeded for:', email);

      // Check if there's a valid OTP already
      const hasValidOTP = await checkExistingValidOTP(email);

      if (hasValidOTP) {
        return NextResponse.json({
          success: true,
          message: 'OTP was already sent. Please check your email or wait 30 seconds to request a new one.'
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please wait 30 seconds before requesting another OTP.'
        },
        { status: 429 }
      );
    }

    // Update rate limit timestamp
    rateLimitMap.set(email, now);

    // Email is authorized, proceed with OTP generation
    console.log('Email authorized, generating OTP for:', email);
    const result = await requestOTP(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in OTP request endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
