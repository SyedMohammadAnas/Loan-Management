/**
 * OTP (One-Time Password) Utility Functions
 * This file contains functions for generating, validating, and managing OTPs
 */

import { supabase } from './supabase';

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a random numeric OTP of specified length
 * @returns A string containing the generated OTP
 */
export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

/**
 * Store OTP in Supabase with expiry time
 * @param email Email address associated with the OTP
 * @param otp The generated OTP
 * @returns Result of the storage operation
 */
export const storeOTP = async (email: string, otp: string) => {
  // Calculate expiry time (current time + expiry minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  try {
    // First check if there's an existing OTP for this email
    const hasExisting = await checkExistingValidOTP(email);

    if (hasExisting) {
      console.log('Valid OTP already exists for:', email);
      // Instead of creating a duplicate, return success to prevent multiple emails
      return { success: true, message: 'Using existing OTP' };
    }

    // First delete any existing OTPs for this email to prevent duplicates
    const { error: deleteError } = await supabase
      .from('otps')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('Error deleting existing OTP:', deleteError);
      // Continue anyway since this is just cleanup
    }

    // Store the new OTP
    const { data, error } = await supabase
      .from('otps')
      .insert([
        {
          email,
          otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error inserting OTP:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error storing OTP:', error);
    return { success: false, error };
  }
};

/**
 * Verify if the provided OTP is valid for the email
 * @param email Email address to verify OTP against
 * @param otpAttempt The OTP attempt to verify
 * @returns Boolean indicating whether OTP is valid
 */
export const verifyOTP = async (email: string, otpAttempt: string): Promise<boolean> => {
  try {
    // Get the stored OTP for this email
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;

    if (!data) return false;

    // Check if OTP is expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // OTP has expired, clean it up
      await supabase.from('otps').delete().eq('email', email);
      return false;
    }

    // Check if OTP matches
    const isValid = data.otp === otpAttempt;

    // If valid, delete the used OTP to prevent reuse
    if (isValid) {
      await supabase.from('otps').delete().eq('email', email);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

/**
 * Send OTP via email using Nodemailer
 * @param email Email address to send OTP to
 * @param otp The OTP to send
 */
export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    // Import nodemailer dynamically to avoid SSR issues
    const nodemailer = require('nodemailer');

    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Create email content
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Loan Management App" <noreply@example.com>',
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5; margin-bottom: 24px;">Verification Code</h2>
          <p style="margin-bottom: 16px;">Please use the following code to verify your identity:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</span>
          </div>
          <p style="margin-bottom: 16px;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);

    // For development fallback, log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return { success: true }; // Return success in dev mode
    }

    return { success: false, error };
  }
};

/**
 * Request new OTP generation and delivery
 * @param email Email address to send OTP to
 * @returns Result of the OTP request operation
 */
export const requestOTP = async (email: string) => {
  try {
    const otp = generateOTP();
    const storeResult = await storeOTP(email, otp);

    if (!storeResult.success) {
      throw new Error('Failed to store OTP');
    }

    const sendResult = await sendOTPEmail(email, otp);

    return {
      success: sendResult.success,
      message: sendResult.success
        ? `OTP sent to ${email}`
        : 'Failed to send OTP'
    };
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return {
      success: false,
      message: 'Failed to generate and send OTP'
    };
  }
};

/**
 * Check if a valid (non-expired) OTP already exists for an email
 * This helps prevent duplicate OTPs in the database
 * @param email Email to check for existing valid OTP
 * @returns Boolean indicating if a valid OTP exists
 */
export const checkExistingValidOTP = async (email: string): Promise<boolean> => {
  try {
    // Get any stored OTP for this email
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return false;

    // Check if OTP is still valid (not expired)
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    return now < expiresAt;
  } catch (error) {
    console.error('Error checking existing OTP:', error);
    return false;
  }
};
