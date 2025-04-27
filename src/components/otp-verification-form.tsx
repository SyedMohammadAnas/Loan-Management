"use client";

/**
 * OTP Verification Form Component
 * Handles the complete OTP verification flow including requesting and verifying OTPs
 * Uses Overpass Mono font for consistent typography
 */

import React, { useState, useEffect, useRef } from 'react';
import { OTPInput } from './ui/otp-input';
import { GradientButton } from './ui/gradient-button';
import { motion } from 'framer-motion';

interface OTPVerificationFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  initialEmail?: string;
}

/**
 * Stateful component that manages the OTP verification flow
 */
export const OTPVerificationForm: React.FC<OTPVerificationFormProps> = ({
  onSuccess,
  onError,
  initialEmail = ''
}) => {
  // Email input state
  const [email, setEmail] = useState(initialEmail);

  // Form step state (request OTP or verify OTP)
  const [step, setStep] = useState<'request' | 'verify'>(initialEmail ? 'verify' : 'request');

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [verified, setVerified] = useState(false);

  // Ref to track if OTP has already been requested to prevent duplicate requests
  const otpRequestedRef = useRef<boolean>(false);

  /**
   * Single effect to handle both setting email and sending OTP
   * This consolidates the previous two effects to prevent duplicate requests
   */
  useEffect(() => {
    // Set email from initialEmail if provided
    if (initialEmail && initialEmail !== email) {
      console.log('Setting email from initialEmail prop:', initialEmail);
      setEmail(initialEmail);
    }

    // Handle automatic OTP sending
    if (initialEmail && step === 'verify' && !isLoading && !verified && !otpRequestedRef.current) {
      console.log('Auto-sending OTP for email:', initialEmail);

      // Set flag to prevent duplicate requests
      otpRequestedRef.current = true;

      // Slight delay to ensure email state is set
      setTimeout(() => {
        handleRequestOTP();
      }, 100);
    }

    // Cleanup function
    return () => {
      // Do not reset the flag here - this causes duplicates
    };
  }, [initialEmail]); // Only depend on initialEmail to prevent multiple triggers

  /**
   * Request OTP for the entered email
   */
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Use the email set in state, which should be populated from initialEmail
    const emailToUse = email.trim();

    // Skip if already requested or loading
    // Allow resend when explicitly clicking the resend button (detected by checking e)
    if (otpRequestedRef.current && !e && step !== 'verify') {
      console.log('OTP already requested, skipping duplicate request');
      return;
    }

    if (!validateEmail(emailToUse)) {
      console.error('Invalid email format:', emailToUse);
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    // Prevent duplicate OTP requests if still loading
    if (isLoading) {
      console.log('Already loading, skipping duplicate request');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log('Sending OTP request to API for email:', emailToUse);
      const response = await fetch('/api/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      // Move to verification step
      setStep('verify');
      setMessage({ text: data.message || 'OTP sent to your email', type: 'success' });

      // Mark as requested
      otpRequestedRef.current = true;
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to send OTP',
        type: 'error'
      });
      if (onError) onError('Failed to send OTP');

      // Reset the request flag so the user can try again
      otpRequestedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify the entered OTP
   */
  const handleVerifyOTP = async (otpValue: string) => {
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Display success message
      setMessage({ text: 'Verification successful!', type: 'success' });
      setVerified(true);

      // Store session info in localStorage if available
      if (data.session) {
        localStorage.setItem('userSession', JSON.stringify(data.session));
      }

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();

          // Use the redirectUrl from the API response if available
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to verify OTP',
        type: 'error'
      });
      if (onError) onError('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Reset form to request step
   */
  const handleGoBack = () => {
    setStep('request');
    setMessage(null);
  };

  // Fade in/out animations for transitions
  const fadeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-xl bg-black/20 backdrop-blur-lg border border-white/20 font-overpass shadow-lg shadow-indigo-500/10">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        {step === 'request' ? 'Verify Your Email' : 'Enter OTP Code'}
      </h2>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 mb-4 rounded-lg text-sm ${
            message.type === 'error'
              ? 'bg-red-500/20 text-red-200 border border-red-500/30'
              : message.type === 'success'
                ? 'bg-green-500/20 text-green-200 border border-green-500/30'
                : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {step === 'request' ? (
        <motion.form
          onSubmit={(e: React.FormEvent) => handleRequestOTP(e)}
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-4"
        >
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
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
            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
          </GradientButton>
        </motion.form>
      ) : (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-white/70 mb-1">
              We've sent a verification code to
            </p>
            <p className="text-white font-medium mb-6">
              {email}
            </p>
          </div>

          <div className="mb-6">
            <OTPInput
              length={6}
              onComplete={handleVerifyOTP}
              autoFocus
              disabled={isLoading || verified}
            />
          </div>

          <div className="space-y-4">
            {!verified && (
              <GradientButton
                onClick={() => {
                  // Reset the flag to allow resending
                  otpRequestedRef.current = false;
                  handleRequestOTP();
                }}
                disabled={isLoading}
                className="w-full py-3"
                variant="variant"
              >
                {isLoading ? 'Please wait...' : 'Resend Code'}
              </GradientButton>
            )}

            <button
              type="button"
              onClick={handleGoBack}
              disabled={isLoading || verified}
              className="block w-full text-center text-indigo-400 hover:text-indigo-300 text-sm py-2"
            >
              ← Change Email
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
