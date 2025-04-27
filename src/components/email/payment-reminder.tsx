type PaymentData = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  remaining_days: number;
}

type PaymentReminderProps = {
  payments: PaymentData[];
  recipientName?: string;
}

/**
 * Email template for payment reminders
 * Displays a table of pending payments
 *
 * @param payments Array of pending payment data
 * @param recipientName Optional name of the recipient
 * @returns HTML string for the email
 */
export const PaymentReminderEmail = ({
  payments,
  recipientName = 'there'
}: PaymentReminderProps): string => {
  // Format currency in a consistent way
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date in a user-friendly way
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <div style="font-family: 'Overpass Mono', monospace; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5; margin-bottom: 24px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
        Weekly Payment Reminder
      </h2>

      <p style="margin-bottom: 16px;">Hello ${recipientName},</p>

      <p style="margin-bottom: 20px;">
        This is your weekly reminder of upcoming payments that are currently in a pending status.
        Please review these items and take action as needed.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Payment</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Amount</th>
            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">Due Date</th>
            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">Days Left</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(payment => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; text-align: left;">${payment.name}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(payment.amount)}</td>
              <td style="padding: 12px; text-align: center;">${formatDate(payment.due_date)}</td>
              <td style="padding: 12px; text-align: center; ${payment.remaining_days < 3 ? 'color: #ef4444;' : ''}">${payment.remaining_days}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="margin-bottom: 16px;">
        To view full details or update payment statuses, please visit your dashboard.
      </p>

      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 30px;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          This is an automated reminder. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
};

/**
 * Converts the React component to plain HTML string
 * Used for sending emails via nodemailer
 *
 * @param payments Array of pending payment data
 * @param recipientName Optional name of the recipient
 * @returns HTML string for the email
 */
export const renderPaymentReminderEmail = (
  payments: PaymentData[],
  recipientName?: string
): string => {
  return PaymentReminderEmail({ payments, recipientName });
};
