import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { renderPaymentReminderEmail } from '@/components/email/payment-reminder';

/**
 * PaymentData interface to match the component's expectations
 */
interface PaymentData {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  remaining_days: number;
}

/**
 * Calculate days remaining until a due date
 * Fallback function if the database view doesn't provide it
 */
const calculateRemainingDays = (dueDateStr: string): number => {
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * API route to send payment reminders
 * GET /api/reminders/send
 *
 * Fetches pending payments from personal_payments table and
 * sends an email to authorized email addresses
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Starting payment reminder API call');

    // Check if the request is authenticated or from an allowed origin
    // For simplicity, we'll allow all authenticated requests and scheduled tasks

    // Set of authorized emails from .env.local
    const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(',') || [];
    console.log('Authorized emails:', authorizedEmails);

    if (!authorizedEmails.length) {
      console.log('No authorized emails configured');
      return NextResponse.json(
        { error: 'No authorized emails configured' },
        { status: 500 }
      );
    }

    // Instead of checking if the table exists (which requires special permissions),
    // we'll just try to query the table directly and handle any errors
    console.log('Checking if personal_payments table data can be accessed');

    // First try using the view
    console.log('Attempting to fetch from personal_payments_view');
    let pendingPayments: PaymentData[] = [];
    let error;

    try {
      // Try to query the view directly instead of checking if it exists first
      console.log('Querying personal_payments_view');
      const result = await supabase
        .from('personal_payments_view')
        .select('id, name, amount, due_date, remaining_days')
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      pendingPayments = result.data as PaymentData[] || [];
      error = result.error;

      console.log('View query result:', { data: !!pendingPayments, error, count: pendingPayments?.length });

      if (error) {
        // If we get an error like "relation does not exist", that means the view doesn't exist
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.log('View does not exist, falling back to direct table query');
          throw new Error('View does not exist');
        }
        throw error;
      }
    } catch (viewError) {
      console.error('Error querying the view:', viewError);

      // If view fails, fall back to direct table query
      console.log('Falling back to direct table query');
      const result = await supabase
        .from('personal_payments')
        .select('id, name, amount, due_date')
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      const basePayments = result.data || [];
      error = result.error;

      // Calculate remaining days manually
      if (basePayments && !error) {
        pendingPayments = basePayments.map(payment => ({
          id: payment.id,
          name: payment.name,
          amount: payment.amount,
          due_date: payment.due_date,
          remaining_days: calculateRemainingDays(payment.due_date)
        }));
      } else if (error) {
        // If we still get an error, the table might not exist or there's a permission issue
        console.error('Error fetching from personal_payments table:', error);
        return NextResponse.json(
          { error: 'Could not access personal_payments table', details: error },
          { status: 500 }
        );
      }

      console.log('Table query result:', { data: !!pendingPayments, error, count: pendingPayments?.length });
    }

    if (error) {
      console.error('Error fetching pending payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending payments', details: error },
        { status: 500 }
      );
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      console.log('No pending payments found');
      return NextResponse.json(
        { message: 'No pending payments to send reminders for' },
        { status: 200 }
      );
    }

    console.log(`Found ${pendingPayments.length} pending payments`);
    console.log('Sample payment data:', pendingPayments[0]);

    // Ensure all payments have remaining_days (just in case)
    pendingPayments = pendingPayments.map(payment => {
      if (payment.remaining_days === undefined || payment.remaining_days === null) {
        return {
          ...payment,
          remaining_days: calculateRemainingDays(payment.due_date)
        };
      }
      return payment;
    });

    // Import nodemailer dynamically to avoid SSR issues
    console.log('Loading nodemailer');
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (err) {
      console.error('Failed to load nodemailer:', err);
      return NextResponse.json(
        { error: 'Failed to load nodemailer module', details: String(err) },
        { status: 500 }
      );
    }

    console.log('Setting up email transporter');
    // Create transporter using environment variables (reusing same config as OTP)
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } catch (err) {
      console.error('Failed to create email transporter:', err);
      return NextResponse.json(
        { error: 'Failed to create email transporter', details: String(err) },
        { status: 500 }
      );
    }

    // Generate HTML email content
    console.log('Generating email content');
    let emailHtml;
    try {
      emailHtml = renderPaymentReminderEmail(pendingPayments);
    } catch (err) {
      console.error('Failed to render email template:', err);
      return NextResponse.json(
        { error: 'Failed to render email template', details: String(err) },
        { status: 500 }
      );
    }

    // Send email to all authorized recipients
    console.log('Sending emails to recipients');
    const sendResults = await Promise.all(
      authorizedEmails.map(async (email) => {
        try {
          // Create email options
          const mailOptions = {
            from: process.env.PAYMENT_REMINDER_FROM || process.env.SMTP_FROM || '"Payment Reminder System" <noreply@example.com>',
            to: email.trim(),
            subject: process.env.PAYMENT_REMINDER_SUBJECT || `Payment Reminder - ${pendingPayments.length} Pending Payments`,
            html: emailHtml,
          };

          // Send the email
          const info = await transporter.sendMail(mailOptions);
          console.log(`Email sent to ${email}:`, info.messageId);

          return { email, success: true, messageId: info.messageId };
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          return { email, success: false, error: String(error) };
        }
      })
    );

    // Count successful emails
    const successfulEmails = sendResults.filter((result) => result.success).length;
    console.log(`Sent ${successfulEmails} emails successfully`);

    // Return appropriate response
    if (successfulEmails === 0) {
      console.log('Failed to send any emails');
      return NextResponse.json(
        { error: 'Failed to send any reminder emails', details: sendResults },
        { status: 500 }
      );
    }

    console.log('API call completed successfully');
    return NextResponse.json({
      message: `Successfully sent ${successfulEmails} reminder emails`,
      pendingPayments: pendingPayments.length,
      emailsSent: successfulEmails,
      details: sendResults,
    });
  } catch (error) {
    console.error('Error in send-reminders API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for explicit reminder sending
 * Useful for manual triggers or testing
 */
export async function POST(request: NextRequest) {
  // Simply call the GET implementation
  return GET(request);
}
