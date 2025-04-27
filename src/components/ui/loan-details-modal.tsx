"use client";

import { useState, FormEvent, useEffect } from "react";
import { Calendar, DollarSign, Loader2, BadgeDollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";
import { TableCell } from "@/components/ui/table";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Loan interface for type checking
 */
interface Loan {
  id: string;
  first_name: string;
  last_name: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  status: string;
}

/**
 * Repayment interface for type checking
 */
interface Repayment {
  id: string;
  loan_id: string;
  repayment_date: string;
  amount_paid: number;
  interest_amount: number;
  remaining_balance: number;
  payment_method: string;
  notes?: string;
  created_at: string;
}

/**
 * Payment form data interface
 */
interface PaymentFormData {
  amountPaid: number;
  paymentMethod: string;
  repaymentDate: string;
  notes: string;
}

/**
 * Props for the LoanDetailsModal component
 */
interface LoanDetailsModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * LoanDetailsModal Component
 *
 * Displays detailed information about a selected loan in a modal
 * Shows borrower details, loan amount, terms, and payment information
 * Provides a tabbed interface for loan details and payment history
 */
export function LoanDetailsModal({ loan, isOpen, onClose }: LoanDetailsModalProps) {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  // State for payment history
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [isLoadingRepayments, setIsLoadingRepayments] = useState(false);
  const [daysSinceLastRepayment, setDaysSinceLastRepayment] = useState<number>(0);
  const [projectedInterest, setProjectedInterest] = useState<number>(0);
  const [isMarkingAsFinished, setIsMarkingAsFinished] = useState(false);

  // State for payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [isPrincipalPaid, setIsPrincipalPaid] = useState(false);
  const [totalAmountPaid, setTotalAmountPaid] = useState(0);
  const [remainingPrincipal, setRemainingPrincipal] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [validationErrors, setValidationErrors] = useState({
    amountError: '',
    dateError: ''
  });

  // Form data state
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amountPaid: 0,
    paymentMethod: "Cash",
    repaymentDate: new Date().toISOString().split('T')[0], // Default to today
    notes: ""
  });

  // Format currency amount to INR format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date to local format
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format created date
  const formatCreatedDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `Created: ${date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`;
  };

  // Reset active tab to details when modal is opened with a different loan
  useEffect(() => {
    if (isOpen && loan) {
      // Reset to details tab whenever a new loan is selected
      setActiveTab("details");
      // Clear previous repayments data
      setRepayments([]);
      // Load payment history to calculate days since last payment and projected interest
      fetchRepayments(loan);
    }
  }, [isOpen, loan?.id]);

  // Handle tab change
  const handleTabChange = (tab: "details" | "history") => {
    setActiveTab(tab);
    if (tab === "history" && loan) {
      fetchRepayments(loan);
    }
  };

  /**
   * Fetch repayments for a loan
   */
  const fetchRepayments = async (loanData: Loan) => {
    if (!loanData || !loanData.id) return;

    try {
      setIsLoadingRepayments(true);

      // Calculate the repayment table name
      const sanitizedFirstName = loanData.first_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const sanitizedLastName = loanData.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const repaymentTableName = `repayment_${sanitizedFirstName}_${sanitizedLastName}_${loanData.id}`;

      // Fetch repayments from the table
      const { data, error } = await supabase
        .from(repaymentTableName)
        .select('*')
        .order('repayment_date', { ascending: false });

      if (error) {
        console.error('Error fetching repayments:', error);
        return;
      }

      setRepayments(data || []);

      // Calculate days since last repayment and projected interest
      if (data && data.length > 0) {
        const lastRepayment = data[0]; // Most recent repayment

        // Calculate days since last repayment
        const lastRepaymentDate = new Date(lastRepayment.repayment_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastRepaymentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysSinceLastRepayment(diffDays);

        // Calculate projected interest for next 30 days
        const dailyInterestRate = loanData.interest_rate / 100 / 365;
        const remainingBalance = lastRepayment.remaining_balance;
        const projected = remainingBalance * dailyInterestRate * 30;
        setProjectedInterest(parseFloat(projected.toFixed(2)));

        // Update balance in parent state
        setRemainingBalance(lastRepayment.remaining_balance);
      } else {
        setDaysSinceLastRepayment(0);
        setProjectedInterest(0);
        // If no repayments, balance is the original loan amount
        setRemainingBalance(loanData.amount);
      }
    } catch (err) {
      console.error('Error in fetch repayments:', err);
    } finally {
      setIsLoadingRepayments(false);
    }
  };

  /**
   * Open payment modal
   */
  const openPaymentModal = async () => {
    // Reset form data
    setPaymentFormData({
      amountPaid: 0,
      paymentMethod: "Cash",
      repaymentDate: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setPaymentMethod("Cash");
    setSubmitError(null);
    setSubmitSuccess(false);
    setValidationErrors({
      amountError: '',
      dateError: ''
    });
    setIsPaymentModalOpen(true);

    // Calculate if principal is already paid off
    if (loan) {
      try {
        // Calculate the repayment table name
        const sanitizedFirstName = loan.first_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const sanitizedLastName = loan.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const repaymentTableName = `repayment_${sanitizedFirstName}_${sanitizedLastName}_${loan.id}`;

        // Fetch all repayments
        const { data, error } = await supabase
          .from(repaymentTableName)
          .select('*')
          .order('repayment_date', { ascending: true });

        if (error) {
          console.error('Error fetching repayments:', error);
          return;
        }

        // Calculate total amount paid so far
        let total = 0;
        if (data && data.length > 0) {
          total = data.reduce((sum, repayment) => sum + repayment.amount_paid, 0);
          setTotalAmountPaid(total);

          // Get the most recent repayment to determine current balance
          const latestRepayment = data[data.length - 1];
          setRemainingBalance(latestRepayment.remaining_balance);
        } else {
          // If no repayments yet, balance is the loan amount
          setRemainingBalance(loan.amount);
        }

        // Calculate remaining principal
        const remainingPrincipalAmount = Math.max(0, loan.amount - total);
        setRemainingPrincipal(remainingPrincipalAmount);

        // Check if principal is paid off
        const isPaid = total >= loan.amount;
        setIsPrincipalPaid(isPaid);

        // Update loan status if needed
        if (isPaid && loan.status === 'active') {
          await updateLoanStatus(loan.id, 'principal paid');
        }
      } catch (err) {
        console.error('Error checking principal payment status:', err);
      }
    }
  };

  /**
   * Update loan status in the database
   */
  const updateLoanStatus = async (loanId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('loans')
        .update({ status })
        .eq('id', loanId);

      if (error) {
        console.error('Error updating loan status:', error);
      }
    } catch (err) {
      console.error('Error in updateLoanStatus:', err);
    }
  };

  /**
   * Validate payment amount and date in real-time
   */
  const validatePaymentInput = (
    field: 'amount' | 'date',
    value: string | number
  ): boolean => {
    if (!loan) return false;

    let isValid = true;
    const newErrors = { ...validationErrors };

    if (field === 'amount') {
      const amountValue = typeof value === 'string' ? parseFloat(value) : value;

      if (amountValue <= 0) {
        newErrors.amountError = 'Amount must be greater than zero';
        isValid = false;
      } else if (amountValue > remainingBalance) {
        newErrors.amountError = `Amount cannot exceed remaining balance (₹${remainingBalance.toFixed(2)})`;
        isValid = false;
      } else {
        newErrors.amountError = '';
      }
    }

    if (field === 'date') {
      const selectedDate = new Date(value as string);
      const startDate = new Date(loan.start_date);

      // Get the most recent repayment date if available
      let mostRecentRepaymentDate = startDate;
      if (repayments && repayments.length > 0) {
        // Repayments are already sorted in descending order (newest first)
        mostRecentRepaymentDate = new Date(repayments[0].repayment_date);
      }

      // Calculate loan end date based on term_months
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + loan.term_months);

      if (selectedDate < mostRecentRepaymentDate) {
        newErrors.dateError = `Date must be after the previous repayment (${formatDate(mostRecentRepaymentDate.toISOString())})`;
        isValid = false;
      } else if (selectedDate > endDate) {
        newErrors.dateError = `Date cannot exceed loan term (ends ${formatDate(endDate.toISOString())})`;
        isValid = false;
      } else {
        newErrors.dateError = '';
      }
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  /**
   * Handle form input changes with validation
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;

    // Update form data
    setPaymentFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Validate in real-time
    if (id === 'amountPaid') {
      validatePaymentInput('amount', value);
    } else if (id === 'repaymentDate') {
      validatePaymentInput('date', value);
    }
  };

  /**
   * Handle payment method selection
   */
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setPaymentFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  /**
   * Calculate the interest amount based on days since last payment
   */
  const calculateInterest = (
    previousRepayment: Repayment,
    currentRepaymentDate: string,
    interestRate: number
  ): number => {
    // If principal is paid off, no more interest is calculated
    if (isPrincipalPaid) {
      return 0;
    }

    // Calculate the number of days between the previous repayment and current repayment
    const prevDate = new Date(previousRepayment.repayment_date);
    const currentDate = new Date(currentRepaymentDate);
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate daily interest rate (annual rate / 365)
    const dailyInterestRate = interestRate / 100 / 365;

    // Calculate interest amount: remaining balance * daily rate * days
    const interestAmount = previousRepayment.remaining_balance * dailyInterestRate * diffDays;

    return parseFloat(interestAmount.toFixed(2));
  };

  /**
   * Submit payment form
   */
  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();

    if (!loan) return;

    // Final validation before submission
    const isAmountValid = validatePaymentInput('amount', paymentFormData.amountPaid);
    const isDateValid = validatePaymentInput('date', paymentFormData.repaymentDate);

    if (!isAmountValid || !isDateValid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Calculate the repayment table name
      const sanitizedFirstName = loan.first_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const sanitizedLastName = loan.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const repaymentTableName = `repayment_${sanitizedFirstName}_${sanitizedLastName}_${loan.id}`;

      // Get the most recent repayment record
      const { data: latestRepayment, error: fetchError } = await supabase
        .from(repaymentTableName)
        .select('*')
        .order('repayment_date', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`Error fetching latest repayment: ${fetchError.message}`);
      }

      if (!latestRepayment || latestRepayment.length === 0) {
        throw new Error("No previous repayment record found");
      }

      const previousRepayment = latestRepayment[0];

      // Calculate interest amount based on whether principal is paid off or not
      const interestAmount = calculateInterest(
        previousRepayment,
        paymentFormData.repaymentDate,
        loan.interest_rate
      );

      // Calculate new remaining balance differently based on principal payment status
      const newRemainingBalance = isPrincipalPaid
        ? previousRepayment.remaining_balance - paymentFormData.amountPaid
        : previousRepayment.remaining_balance - paymentFormData.amountPaid + interestAmount;

      // If this payment will complete the principal, update the isPrincipalPaid status
      const newTotalPaid = totalAmountPaid + paymentFormData.amountPaid;
      const willPrincipalBePaid = !isPrincipalPaid && newTotalPaid >= loan.amount;

      if (willPrincipalBePaid) {
        setIsPrincipalPaid(true);
        await updateLoanStatus(loan.id, 'principal paid');
      }

      // Check if loan will be fully paid off
      if (newRemainingBalance <= 0) {
        await updateLoanStatus(loan.id, 'finished');
      }

      // Insert the new repayment record
      const { data, error } = await supabase
        .from(repaymentTableName)
        .insert([
          {
            loan_id: loan.id,
            repayment_date: paymentFormData.repaymentDate,
            amount_paid: paymentFormData.amountPaid,
            interest_amount: interestAmount,
            remaining_balance: Math.max(0, newRemainingBalance), // Ensure balance never goes below 0
            payment_method: paymentFormData.paymentMethod,
            notes: paymentFormData.notes
          }
        ])
        .select();

      if (error) {
        throw new Error(`Error recording payment: ${error.message}`);
      }

      // Success
      setSubmitSuccess(true);

      // Reload repayments data
      await fetchRepayments(loan);

      // Close modal after short delay
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        // Switch to payment history tab
        setActiveTab("history");
      }, 1500);

    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("An unknown error occurred");
      }
      console.error("Error submitting payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Mark loan as finished
   */
  const handleMarkAsFinished = async () => {
    if (!loan) return;

    setIsMarkingAsFinished(true);

    try {
      // Update loan status in database
      await updateLoanStatus(loan.id, 'finished');

      // If there is a remaining balance, add a final zero-amount repayment to clear it
      if (remainingBalance > 0) {
        const sanitizedFirstName = loan.first_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const sanitizedLastName = loan.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const repaymentTableName = `repayment_${sanitizedFirstName}_${sanitizedLastName}_${loan.id}`;

        await supabase
          .from(repaymentTableName)
          .insert([
            {
              loan_id: loan.id,
              repayment_date: new Date().toISOString().split('T')[0],
              amount_paid: remainingBalance,
              interest_amount: 0,
              remaining_balance: 0,
              payment_method: "System",
              notes: "Loan marked as finished (balance less than ₹100)"
            }
          ]);

        // Refresh repayments data
        await fetchRepayments(loan);
      }
    } catch (error) {
      console.error('Error marking loan as finished:', error);
    } finally {
      setIsMarkingAsFinished(false);
    }
  };

  // Early return if no loan is provided
  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border-gray-200 text-gray-800 shadow-xl backdrop-blur-xl p-5 font-['Overpass_Mono']">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold font-['Overpass_Mono'] text-gray-800">Loan Details</DialogTitle>
          <p className="text-gray-600 text-sm font-['Overpass_Mono']">View and manage details for this loan</p>
        </DialogHeader>

        {/* Borrower Card */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Avatar circle with first letter of first name */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-3xl shadow-inner">
              {loan.first_name.charAt(0)}
            </div>

            {/* Borrower name */}
            <div className="flex-1">
              <h3 className="text-xl font-bold font-['Overpass_Mono'] text-gray-800">{loan.first_name} {loan.last_name}</h3>
              <p className="text-gray-500 text-sm truncate font-['Overpass_Mono']">{loan.id.substring(0, 8)}...</p>
            </div>

            {/* Loan Status Badge */}
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-['Overpass_Mono'] ${
                loan.status === "finished"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : loan.status === "principal paid"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-amber-100 text-amber-700 border border-amber-300"
              }`}>
                {loan.status === "active" ? "Active" :
                 loan.status === "principal paid" ? "Principal Paid" :
                 loan.status === "finished" ? "Finished" : loan.status}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500 text-sm font-['Overpass_Mono']">Amount</span>
            </div>
            <h3 className="text-2xl font-bold font-['Overpass_Mono'] tracking-wider text-gray-800">₹{loan.amount.toFixed(2)}</h3>
          </div>

          {/* Date & Term */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500 text-sm font-['Overpass_Mono']">Date & Term</span>
            </div>
            <p className="text-sm font-['Overpass_Mono'] text-gray-700">{formatCreatedDate(loan.created_at)}</p>
          </div>

          {/* Balance Information */}
          <div className="mt-4 grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div>
              <p className="text-gray-500 text-xs font-['Overpass_Mono']">Current Balance</p>
              <p className="text-gray-800 font-bold text-lg font-['Overpass_Mono']">₹{remainingBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-['Overpass_Mono']">Days Since Payment</p>
              <p className="text-gray-800 font-bold text-lg font-['Overpass_Mono']">{daysSinceLastRepayment}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-['Overpass_Mono']">Projected Interest</p>
              <p className="text-amber-600 font-bold text-lg font-['Overpass_Mono']">₹{projectedInterest.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => handleTabChange("details")}
            className={`py-2 px-4 rounded-md font-medium text-sm transition-all font-['Overpass_Mono'] ${
              activeTab === "details"
                ? "bg-gray-200 text-gray-800"
                : "bg-transparent text-gray-500"
            }`}
          >
            Loan Details
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`py-2 px-4 rounded-md font-medium text-sm transition-all font-['Overpass_Mono'] ${
              activeTab === "history"
                ? "bg-gray-200 text-gray-800"
                : "bg-transparent text-gray-500"
            }`}
          >
            Payment History
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[180px]">
          {/* Loan Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-3">
              {/* Mark as Finished Button (only if balance < 100 and status is not finished) */}
              {remainingBalance > 0 && remainingBalance < 100 && loan.status !== 'finished' && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                  <p className="text-gray-700 text-sm mb-2 font-['Overpass_Mono']">
                    The remaining balance is less than ₹100. You can mark this loan as finished.
                  </p>
                  <Button
                    onClick={handleMarkAsFinished}
                    className="w-full bg-green-100 border border-green-300 hover:bg-green-200 text-green-700"
                    disabled={isMarkingAsFinished}
                  >
                    {isMarkingAsFinished ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : "Mark as Finished"}
                  </Button>
                </div>
              )}

              {/* Loan Amount */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-['Overpass_Mono']">Loan Amount</span>
                <span className="font-bold font-['Overpass_Mono']">₹{loan.amount.toFixed(2)}</span>
              </div>

              {/* Interest Rate */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-['Overpass_Mono']">Interest Rate</span>
                <span className="font-bold font-['Overpass_Mono']">{loan.interest_rate}%</span>
              </div>

              {/* Loan Term */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-['Overpass_Mono']">Loan Term</span>
                <span className="font-bold font-['Overpass_Mono']">{loan.term_months} {loan.term_months === 1 ? 'month' : 'months'}</span>
              </div>

              {/* Start Date */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-['Overpass_Mono']">Start Date</span>
                <span className="font-bold font-['Overpass_Mono']">
                  {loan.start_date ? formatDate(loan.start_date).replace(", 2025", " 2025") : "Not specified"}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-['Overpass_Mono']">Payment Method</span>
                <span className={`px-3 py-1 rounded-full text-xs font-['Overpass_Mono'] ${
                  loan.payment_method === "Cash"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : loan.payment_method === "UPI"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-amber-100 text-amber-700 border border-amber-300"
                }`}>
                  {loan.payment_method}
                </span>
              </div>

              {/* Notes */}
              <div className="pt-1">
                <span className="text-gray-500 block mb-1 font-['Overpass_Mono']">Notes</span>
                <p className="bg-gray-50 p-3 rounded border border-gray-200 text-sm min-h-[50px] font-['Overpass_Mono'] overflow-auto">
                  {loan.notes || "No notes"}
                </p>
              </div>
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === "history" && (
            <div className="max-h-[300px] overflow-auto">
              {isLoadingRepayments ? (
                <div className="flex flex-col items-center justify-center h-[180px]">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500 mb-2" />
                  <p className="text-gray-500 text-sm font-['Overpass_Mono']">Loading payment history...</p>
                </div>
              ) : repayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[180px]">
                  <p className="text-gray-500 text-sm font-['Overpass_Mono']">No payment history available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {repayments.map((repayment) => (
                    <div key={repayment.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-800 text-sm font-['Overpass_Mono']">
                          {formatDate(repayment.repayment_date)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-['Overpass_Mono'] ${
                          repayment.payment_method === "Cash"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : repayment.payment_method === "UPI"
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-amber-100 text-amber-700 border border-amber-300"
                        }`}>
                          {repayment.payment_method}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <p className="text-gray-500 text-xs font-['Overpass_Mono']">Paid</p>
                          <p className="font-bold text-green-700 font-['Overpass_Mono']">
                            {repayment.amount_paid > 0 ?
                              formatCurrency(repayment.amount_paid) :
                              '₹0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-['Overpass_Mono']">Interest</p>
                          <p className="font-bold text-amber-600 font-['Overpass_Mono']">
                            {formatCurrency(repayment.interest_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-['Overpass_Mono']">Balance</p>
                          <p className="font-bold text-gray-800 font-['Overpass_Mono']">
                            {formatCurrency(repayment.remaining_balance)}
                          </p>
                        </div>
                      </div>

                      {repayment.notes && (
                        <p className="text-gray-700 text-xs italic font-['Overpass_Mono'] mt-1 border-t border-gray-200 pt-1">
                          {repayment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Close Button */}
        <div className="flex justify-between mt-2">
          {loan.status !== 'finished' ? (
            <Button
              onClick={openPaymentModal}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Record New Payment
            </Button>
          ) : (
            <div className="text-green-400 text-sm bg-green-900/20 border border-green-800/40 px-3 py-2 rounded-md">
              Loan has been fully paid ✅
            </div>
          )}
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors font-['Overpass_Mono'] text-sm"
          >
            Close
          </button>
        </div>
      </DialogContent>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="bg-white border border-gray-200 text-gray-800 shadow-xl backdrop-blur-xl max-w-md font-['Overpass_Mono']">
          <div className="flex flex-col gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white"
              aria-hidden="true"
            >
              <BadgeDollarSign className="text-blue-600" size={16} strokeWidth={2} />
            </div>
            <DialogHeader className="gap-0">
              <DialogTitle className="text-left text-gray-800 font-semibold">Record New Payment</DialogTitle>
              <DialogDescription className="text-left text-gray-600">
                Enter payment details below.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Remaining Balance Info */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md border border-gray-200">
            <div>
              <p className="text-gray-500 text-xs font-['Overpass_Mono']">Remaining Balance</p>
              <p className="text-gray-800 font-bold font-['Overpass_Mono']">₹{remainingBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-['Overpass_Mono']">Remaining Principal</p>
              <p className={`${remainingPrincipal <= 0 ? "text-green-600" : "text-gray-800"} font-bold font-['Overpass_Mono']`}>
                {remainingPrincipal <= 0 ? "PAID" : `₹${remainingPrincipal.toFixed(2)}`}
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmitPayment}>
            <div className="space-y-4">
              {/* Principal Paid Notice */}
              {isPrincipalPaid && (
                <div className="bg-purple-900/30 border border-purple-500/50 p-3 rounded-md text-sm">
                  <p className="text-purple-300 font-medium font-['Overpass_Mono']">
                    Principal amount fully paid! ✅
                  </p>
                  <p className="text-purple-300/70 font-['Overpass_Mono'] text-xs mt-1">
                    This payment will be applied only to the remaining interest balance.
                  </p>
                </div>
              )}

              {/* Amount Paid */}
              <div className="space-y-2">
                <Label htmlFor="amountPaid" className="text-gray-800">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={paymentFormData.amountPaid || ''}
                  onChange={handleChange}
                  placeholder="₹/-"
                  className={`bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-500 ${
                    validationErrors.amountError ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  required
                />
                {validationErrors.amountError && (
                  <p className="text-red-400 text-xs font-['Overpass_Mono'] mt-1">
                    {validationErrors.amountError}
                  </p>
                )}
              </div>

              {/* Repayment Date */}
              <div className="space-y-2">
                <Label htmlFor="repaymentDate" className="text-gray-800">Repayment Date</Label>
                <Input
                  id="repaymentDate"
                  type="date"
                  value={paymentFormData.repaymentDate}
                  onChange={handleChange}
                  className={`bg-gray-50 border-gray-200 text-gray-800 [color-scheme:light] ${
                    validationErrors.dateError ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  required
                />
                {validationErrors.dateError && (
                  <p className="text-red-400 text-xs font-['Overpass_Mono'] mt-1">
                    {validationErrors.dateError}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-gray-800">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    onClick={() => handlePaymentMethodChange("Cash")}
                    className={`${paymentMethod === "Cash"
                      ? "bg-purple-700 border-purple-400"
                      : "bg-gray-50 hover:bg-gray-100"} border border-gray-200`}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handlePaymentMethodChange("UPI")}
                    className={`${paymentMethod === "UPI"
                      ? "bg-purple-700 border-purple-400"
                      : "bg-gray-50 hover:bg-gray-100"} border border-gray-200`}
                  >
                    UPI
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handlePaymentMethodChange("Bank")}
                    className={`${paymentMethod === "Bank"
                      ? "bg-purple-700 border-purple-400"
                      : "bg-gray-50 hover:bg-gray-100"} border border-gray-200`}
                  >
                    Bank
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-800">Notes</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={paymentFormData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional details here..."
                  className="bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-500 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-['Overpass_Mono']"
                />
              </div>
            </div>

            {/* Error message */}
            {submitError && (
              <div className="text-red-400 text-sm bg-red-500/20 p-2 rounded-md border border-red-500/30">
                {submitError}
              </div>
            )}

            {/* Success message */}
            {submitSuccess && (
              <div className="text-green-400 text-sm bg-green-500/20 p-2 rounded-md border border-green-500/30">
                Payment recorded successfully!
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Record Payment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
