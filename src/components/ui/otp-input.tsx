"use client";

/**
 * OTP Input Component
 * A responsive component for entering OTP codes with individual input fields
 * Uses Overpass Mono font for consistent typography
 */

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * OTP Input component that creates individual input fields for each digit
 */
export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  className,
  inputClassName,
  autoFocus = true,
  disabled = false
}) => {
  // State to track values in each input field
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));

  // Array of refs for each input field
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array based on length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    setOtp(Array(length).fill(''));
  }, [length]);

  // Auto-focus the first input when component mounts
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  /**
   * Handle input change for each digit
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // Only accept single digit numbers
    if (!/^\d*$/.test(value)) return;

    // Update the OTP array with new value
    const newOtp = [...otp];

    // Take only the last character if multiple were pasted/entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move focus to next input if a digit was entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    const otpValue = newOtp.join('');
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  /**
   * Handle key presses for navigation between inputs
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Navigate between inputs with arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle paste event to distribute digits across inputs
   */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();

    // Only proceed if pasted content is all digits
    if (!/^\d+$/.test(pasteData)) return;

    // Distribute pasted digits across inputs
    const newOtp = [...otp];
    for (let i = 0; i < Math.min(pasteData.length, length - index); i++) {
      newOtp[index + i] = pasteData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or the last input
    const nextIndex = Math.min(index + pasteData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Check if OTP is complete
    const otpValue = newOtp.join('');
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 md:gap-4 font-overpass', className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          maxLength={1}
          disabled={disabled}
          className={cn(
            'w-10 h-12 md:w-14 md:h-16 text-center text-xl md:text-2xl font-semibold font-overpass',
            'border-2 rounded-lg focus:outline-none focus:ring-2',
            'bg-black/30 border-white/20',
            'text-white caret-white placeholder-white/50',
            'focus:border-indigo-500 focus:ring-indigo-500/30',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            inputClassName
          )}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
