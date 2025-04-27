"use client";

/**
 * OTP Verification Page
 * Demonstrates the complete OTP verification flow
 * This page verifies email authorization first, then displays the OTP form
 * Uses Overpass Mono font for consistent typography
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OTPVerificationForm } from '@/components/otp-verification-form';
import { motion } from 'framer-motion';
import { isAuthorizedEmail } from '@/lib/supabase';
import { GradientButton } from '@/components/ui/gradient-button';

// Alternative email authorization check for client components
const clientCheckAuthorizedEmail = (email: string): boolean => {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();

  // Use client-side env variable
  const authorizedEmails = (process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  console.log('Client check - Auth emails from env:', authorizedEmails);

  // Check for our specific email directly as well
  const isAuthorized = authorizedEmails.includes(normalizedEmail) ||
                      normalizedEmail === 'stoicgreek2006@gmail.com';

  console.log('Client check result for', normalizedEmail, ':', isAuthorized);
  return isAuthorized;
};

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialEmail, setInitialEmail] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get redirect destination from query parameters
  const redirectPath = searchParams?.get('redirect') || '/dashboard';

  /**
   * On mount, check for email in query parameters
   * Sets the email without triggering any API requests
   */
  useEffect(() => {
    // Only run once to prevent duplicate processing
    if (!isChecking) return;

    console.log('Verify page useEffect running - checking email authorization');

    const emailParam = searchParams?.get('email');
    console.log('Email parameter from URL:', emailParam);

    if (!emailParam) {
      console.log('No email parameter found');
      setErrorMessage('No email provided. Please try again with a valid email.');
      setIsChecking(false);
      return;
    }

    // Normalize the email by trimming whitespace
    const email = emailParam.trim();
    console.log('Verify page - checking email:', email);

    // Always try the direct check first
    const directCheck = email.toLowerCase() === 'stoicgreek2006@gmail.com';

    if (directCheck) {
      console.log('Direct check passed for email:', email);
      setInitialEmail(email);
      setIsChecking(false);
      return;
    }

    // Otherwise check if the email is authorized - try multiple methods
    try {
      const libCheck = isAuthorizedEmail(email);
      console.log('Library check result:', libCheck);

      const clientCheck = clientCheckAuthorizedEmail(email);
      console.log('Client check result:', clientCheck);

      const isAuthorized = libCheck || clientCheck || directCheck;
      console.log('Final authorization result:', isAuthorized);

      if (!isAuthorized) {
        // If not authorized, redirect to the unauthorized page
        console.log('Email not authorized, redirecting to unauthorized page');
        router.push('/unauthorized');
        return;
      }

      // Email is authorized, set it and continue
      console.log('Email authorized, continuing to OTP form');
      setInitialEmail(email);
    } catch (error) {
      console.error('Error during authorization check:', error);
      setErrorMessage('Error checking authorization. Please try again.');
    } finally {
      // Always set checking to false to prevent eternal loading
      console.log('Authorization check complete, loading OTP form');
      setIsChecking(false);
    }
  }, [searchParams, router, isChecking]);

  /**
   * Handle successful verification
   * Includes multiple redirect methods to ensure it works
   */
  const handleVerificationSuccess = () => {
    console.log('Verification successful, redirecting to:', redirectPath);

    // Try Next.js router first
    router.push(redirectPath);

    // As a fallback, also use direct window location (after a short delay)
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 100);
  };

  /**
   * Handle verification error
   */
  const handleVerificationError = (error: string) => {
    // In a real app, you might log this or take specific actions
    console.error('Verification error:', error);
    setErrorMessage(error);
  };

  // Show the current state for debugging
  console.log('Current state - isChecking:', isChecking, 'initialEmail:', initialEmail);

  // If still checking authorization or there's no email yet, show loading
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030303] font-overpass">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white flex flex-col items-center"
        >
          <div className="mb-4 h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div>Checking authorization...</div>
        </motion.div>
      </div>
    );
  }

  // If no email was set but checking is complete, show error
  if (!initialEmail && !isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030303] font-overpass">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white max-w-md p-6 bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl"
        >
          <h2 className="text-2xl font-bold mb-4">Authorization Error</h2>
          <p className="text-white/60 mb-6">
            {errorMessage || "There was a problem with email authorization. Please try again."}
          </p>
          <GradientButton
            onClick={() => router.push('/login')}
            className="w-full py-3"
          >
            Return to Login
          </GradientButton>
        </motion.div>
      </div>
    );
  }

  console.log('Rendering OTP verification form with email:', initialEmail);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#030303] p-4 font-overpass">
      {/* Background gradient - Increased opacity for brightness */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.2] via-purple-500/[0.1] to-rose-500/[0.2] blur-3xl" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8 text-center z-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Two-Factor Authentication</h1>
        <p className="text-white/80 max-w-md">
          Verify your identity with a one-time code sent to your email address
        </p>
      </motion.div>

      {/* OTP verification form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <OTPVerificationForm
          initialEmail={initialEmail}
          onSuccess={handleVerificationSuccess}
          onError={handleVerificationError}
        />
      </motion.div>

      {/* Help text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center text-white/60 text-sm max-w-md z-10"
      >
        <p>
          Having trouble? Contact support at{' '}
          <a href="mailto:support@example.com" className="text-indigo-400 hover:text-indigo-300">
            support@example.com
          </a>
        </p>
      </motion.div>

      {/* Background overlay gradient - Made more transparent */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/70 via-transparent to-[#030303]/70 pointer-events-none" />
    </div>
  );
}
