'use client';

import { useState } from 'react';
import { Search, Mail, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { PaymentFormDialog } from '@/components/ui/payment-form';
import { PaymentsTable } from '@/components/ui/payments-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Payments Page
 *
 * A page for managing personal payments
 * Features a form to add new payments and a table to view existing ones
 * Uses the same layout structure as the dashboard
 * Integrated with Supabase for data persistence
 */
export default function PaymentsPage() {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // State for email sending status
  const [sendingEmail, setSendingEmail] = useState(false);
  // State for error message
  const [emailError, setEmailError] = useState<string | null>(null);

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Send reminder emails for pending payments
   * Uses the API route we created
   */
  const handleSendReminders = async () => {
    try {
      setSendingEmail(true);
      setEmailError(null);
      console.log('Sending reminder emails...');

      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to send reminders');
      }

      // Show success toast directly with sonner
      toast.success('Reminders Sent', {
        description: data.message || `Sent ${data.emailsSent} emails for ${data.pendingPayments} pending payments`,
      });
    } catch (error) {
      console.error('Error sending reminders:', error);

      // Format the error message
      let errorMessage = 'Failed to send reminder emails';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check for specific errors related to the personal_payments table
      if (errorMessage.includes('personal_payments') && errorMessage.includes('does not exist')) {
        errorMessage = 'The payments table does not exist. Please ensure your database is properly set up.';
      }

      setEmailError(errorMessage);

      // Show error toast directly with sonner
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Return the payments page content inside the sidebar layout
  return (
    <SidebarDemo>
      <div className="w-full h-full rounded-xl backdrop-blur-md bg-gradient-to-b from-white/80 to-white/60 border border-gray-100 shadow-xl flex flex-col p-4 overflow-hidden">
        {/* Header area */}
        <div className="flex flex-row justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-black">Payments</h1>

            {/* Search Input */}
            <div className="relative ml-4 md:ml-8 hidden sm:block">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search payments..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-[200px] md:w-[300px] bg-white/70 border-gray-200 text-black placeholder:text-gray-400 rounded-md focus:ring-blue-300 focus:border-blue-300 shadow-sm text-base font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Send Reminders Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminders}
              disabled={sendingEmail}
              className="bg-white/70 border-gray-200 text-black hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Test Email Reminder
                </>
              )}
            </Button>

            {/* Add Payment Button with Dialog */}
            <PaymentFormDialog />
          </div>
        </div>

        {/* Error message for email reminder */}
        {emailError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Email Error:</strong> {emailError}
            </p>
            <p className="text-sm text-red-700 mt-1">
              🛠️ Troubleshooting: Make sure you've set up the personal_payments table in your Supabase database and configured the email settings in .env.local.
            </p>
          </div>
        )}

        {/* Table container - fills available space without overflowing */}
        <div className="flex-grow w-full overflow-auto bg-white/50 backdrop-blur-sm rounded-lg shadow-md p-0">
          <PaymentsTable searchQuery={searchQuery} />
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end items-center">
          <div className="text-black text-base font-medium">
            {new Date().toLocaleDateString()} • Personal Payments Management
          </div>
        </div>
      </div>
    </SidebarDemo>
  );
}
