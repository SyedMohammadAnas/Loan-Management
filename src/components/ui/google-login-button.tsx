"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GradientButton } from './gradient-button';

/**
 * GoogleLoginButton component - Provides UI for Google OAuth login
 *
 * Handles the Google authentication flow using Supabase
 * Displays loading state during authentication process
 */
export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Handle Google sign in process
   * Directly redirects to OTP verification page instead of using OAuth
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // Redirect to OTP verification page instead of OAuth
      router.push('/auth/verify');

      // Alternative method for redirect if router.push doesn't work:
      // window.location.href = '/auth/verify';
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      setIsLoading(false);
    }
  };

  return (
    <GradientButton
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : 'Login with Google'}
    </GradientButton>
  );
}
