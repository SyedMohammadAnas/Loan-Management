"use client";

/**
 * Login Form Component
 * Simple form to collect user email and redirect to OTP verification
 * Uses Overpass Mono font for consistent typography
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GradientButton } from '@/components/ui/gradient-button';
import { isAuthorizedEmail } from '@/lib/supabase';

// Fallback method to check authorized emails directly
// This ensures we have access to env vars in client components
const checkAuthorizedEmail = (email: string): boolean => {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const authorizedEmails = (process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  console.log('Direct check - Authorized emails:', authorizedEmails);
  console.log('Direct check - Email to check:', normalizedEmail);

  return authorizedEmails.includes(normalizedEmail);
};

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   * Checks if email is authorized before redirecting to verification page
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim the email to remove any accidental spaces
    const trimmedEmail = email.trim();

    // Basic validation
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Email entered:', trimmedEmail);
      console.log('Available env vars:', process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS);

      // Try both methods for authorization check
      const isAuthorized = isAuthorizedEmail(trimmedEmail) || checkAuthorizedEmail(trimmedEmail);

      // For emergency bypass - use specific email directly
      const emergencyBypass = trimmedEmail.toLowerCase() === 'stoicgreek2006@gmail.com';

      console.log('Is authorized:', isAuthorized);
      console.log('Emergency bypass:', emergencyBypass);

      if (!isAuthorized && !emergencyBypass) {
        setError('This email is not authorized to access the system');
        setIsLoading(false);
        return;
      }

      // Use the trimmed email for the redirect
      const verifyUrl = `/auth/verify?email=${encodeURIComponent(trimmedEmail)}`;
      console.log('Redirecting to:', verifyUrl);

      // Add a slight delay before redirect to ensure UI updates
      setTimeout(() => {
        // Use multiple redirect methods to ensure it works
        try {
          router.push(verifyUrl);

          // As a fallback, also use direct navigation after a short delay
          setTimeout(() => {
            window.location.href = verifyUrl;
          }, 500);
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          // Final fallback - direct location change
          window.location.href = verifyUrl;
        }
      }, 100);
    } catch (error) {
      console.error('Error in login form:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-xl bg-black/30 backdrop-blur-lg border border-white/10 font-overpass">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Log In to Your Account
      </h2>

      {error && (
        <div className="p-3 mb-4 rounded-lg text-sm bg-red-500/20 text-red-200 border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="loginEmail" className="block text-sm font-medium text-white/80 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="loginEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-overpass"
            placeholder="Enter your email"
            required
          />
        </div>

        <GradientButton
          type="submit"
          disabled={isLoading}
          className="w-full py-3"
        >
          {isLoading ? 'Please wait...' : 'Continue with Email'}
        </GradientButton>

        <p className="text-white/60 text-center text-sm mt-4">
          We'll send a verification code to your email
        </p>
      </form>
    </div>
  );
};
