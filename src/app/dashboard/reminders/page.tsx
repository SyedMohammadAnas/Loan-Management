'use client';

import { useState, useEffect } from 'react';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Reminders Page under Dashboard
 *
 * Dedicated page to manage reminder preferences and actions
 * Allows users to:
 * - See upcoming payment reminders
 * - Send test reminder emails
 * - Configure reminder preferences
 */
export default function RemindersPage() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Get count of pending payments on page load
  useEffect(() => {
    async function fetchPendingPayments() {
      try {
        setLoading(true);
        setError(null);

        // First check if we can access the table
        const { count, error: countError } = await supabase
          .from('personal_payments')
          .select('id', { count: 'exact' })
          .eq('status', 'pending');

        if (countError) {
          console.error('Error fetching pending payments:', countError);

          if (countError.message?.includes('relation') && countError.message?.includes('does not exist')) {
            setError('The personal_payments table does not exist in your database.');
          } else {
            setError(`Failed to fetch pending payments: ${countError.message}`);
          }
          setPendingPayments(0);
          return;
        }

        setPendingPayments(count || 0);
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        setError('An unexpected error occurred while fetching pending payments.');
        setPendingPayments(0);
      } finally {
        setLoading(false);
      }
    }

    fetchPendingPayments();
  }, [supabase]);

  /**
   * Send reminder emails for pending payments
   * Uses the API route we created
   */
  const handleSendReminders = async () => {
    try {
      setSendingEmail(true);
      setError(null);

      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to send reminders');
      }

      toast.success('Reminders Sent', {
        description: data.message || `Sent ${data.emailsSent} emails for ${data.pendingPayments} pending payments`,
      });
    } catch (error) {
      console.error('Error sending reminders:', error);

      let errorMessage = 'Failed to send reminder emails';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check for specific errors related to the personal_payments table
      if (errorMessage.includes('personal_payments') && errorMessage.includes('does not exist')) {
        errorMessage = 'The payments table does not exist. Please ensure your database is properly set up.';
      }

      setError(errorMessage);
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <SidebarDemo>
      <div className="w-full h-full rounded-xl backdrop-blur-md bg-gradient-to-b from-white/80 to-white/60 border border-gray-100 shadow-xl flex flex-col p-4 overflow-hidden">
        {/* Header area */}
        <div className="flex flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-black">Reminders</h1>
            <p className="text-gray-600 mt-2">Manage payment reminder settings and send test emails</p>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reminder Status Card */}
          <div className="bg-white/70 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Pending Payments</h2>
            <div className="mb-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p>Loading pending payment count...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-blue-600">{pendingPayments}</div>
              )}
              {!error && <p className="text-gray-600 mt-1">Payments requiring reminders</p>}
            </div>

            <Button
              onClick={handleSendReminders}
              disabled={sendingEmail || pendingPayments === 0 || !!error}
              className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Test Reminder Emails
                </>
              )}
            </Button>

            {pendingPayments === 0 && !loading && !error && (
              <p className="text-amber-600 text-sm mt-2">No pending payments to send reminders for.</p>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  🛠️ Troubleshooting: Make sure you've set up the personal_payments table in your Supabase database.
                  Check the migrations folder for SQL scripts to create this table if needed.
                </p>
              </div>
            )}
          </div>

          {/* Reminder Settings Card */}
          <div className="bg-white/70 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Reminder Settings</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Automated Weekly Reminders</h3>
                <p className="text-gray-600 text-sm">
                  Emails are automatically sent every Sunday at 9:00 AM for payments due in the next 7 days.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Recipients</h3>
                <p className="text-gray-600 text-sm">
                  Emails will only be sent to authorized email addresses configured in your account settings.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Testing</h3>
                <p className="text-gray-600 text-sm">
                  Use the "Send Test Reminder Emails" button to manually trigger reminder emails for testing.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Required Tables</h3>
                <p className="text-gray-600 text-sm">
                  This feature requires the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">personal_payments</code> table
                  in your Supabase database. Ensure it's properly set up with the necessary migrations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarDemo>
  );
}
