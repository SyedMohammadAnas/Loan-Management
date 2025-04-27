"use client";

import { useId, useState, FormEvent, useEffect } from "react";
import { PlusCircle, CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui/gradient-button";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * LoanFormInterface for type checking form inputs
 */
interface LoanFormData {
  firstName: string;
  lastName: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  paymentMethod: string;
  notes: string;
}

/**
 * LoanFormDialog Component
 *
 * A modal dialog for adding a new loan with specified fields
 * Features form inputs for all required loan details
 * Uses custom styling consistent with the application theme
 * Submits data directly to Supabase loans table without authentication
 */
export function LoanFormDialog() {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // State for payment method selection
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");

  // Form data state
  const [formData, setFormData] = useState<LoanFormData>({
    firstName: "",
    lastName: "",
    amount: 0,
    interestRate: 0,
    termMonths: 0,
    startDate: new Date().toISOString().split('T')[0], // Default to today
    paymentMethod: "Cash",
    notes: ""
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        amount: 0,
        interestRate: 0,
        termMonths: 0,
        startDate: new Date().toISOString().split('T')[0],
        paymentMethod: "Cash",
        notes: ""
      });
      setPaymentMethod("Cash");
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [isOpen]);

  /**
   * Handle form input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;

    // Extract the field name from the ID (remove the unique ID suffix)
    const fieldName = id.split('-')[0];

    setFormData(prev => ({
      ...prev,
      [fieldName]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  /**
   * Handle payment method selection
   */
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  /**
   * Handle form submission
   * Directly inserts data into loans table without authentication requirements
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate form data
      if (!formData.firstName || !formData.lastName) {
        throw new Error("First name and last name are required");
      }

      if (formData.amount <= 0) {
        throw new Error("Loan amount must be greater than zero");
      }

      if (formData.interestRate < 0) {
        throw new Error("Interest rate cannot be negative");
      }

      if (formData.termMonths <= 0) {
        throw new Error("Loan term must be greater than zero");
      }

      if (!formData.startDate) {
        throw new Error("Start date is required");
      }

      // Submit data to Supabase without user_id requirement
      const { data, error } = await supabase
        .from('loans')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            amount: formData.amount,
            interest_rate: formData.interestRate,
            term_months: formData.termMonths,
            start_date: formData.startDate,
            payment_method: formData.paymentMethod,
            notes: formData.notes
          }
        ])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Success
      setSubmitSuccess(true);

      // Close dialog after short delay
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);

    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("An unknown error occurred");
      }
      console.error("Error submitting loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <GradientButton
          className="flex items-center gap-2 py-2 px-4"
          variant="variant"
        >
          <PlusCircle size={18} />
          <span>Add Loan</span>
        </GradientButton>
      </DialogTrigger>

      <DialogContent className="bg-gradient-to-b from-white/90 to-white/70 border border-gray-200 text-gray-800 backdrop-blur-md max-h-[85vh] overflow-y-auto shadow-lg">
        <div className="flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white"
            aria-hidden="true"
          >
            <CreditCard className="text-blue-600" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left text-gray-800 font-semibold">Add New Loan</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Enter all required loan details below.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Borrower Information */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor={`firstName-${id}`} className="text-gray-700">First Name</Label>
                <Input
                  id={`firstName-${id}`}
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor={`lastName-${id}`} className="text-gray-700">Last Name</Label>
                <Input
                  id={`lastName-${id}`}
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor={`amount-${id}`} className="text-gray-700">Loan Amount</Label>
              <Input
                id={`amount-${id}`}
                type="number"
                value={formData.amount || ''}
                onChange={handleChange}
                placeholder="₹/-"
                className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor={`interestRate-${id}`} className="text-gray-700">Interest Rate (%)</Label>
              <Input
                id={`interestRate-${id}`}
                type="number"
                step="0.01"
                value={formData.interestRate || ''}
                onChange={handleChange}
                placeholder="Rate percentage"
                className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Term */}
            <div className="space-y-2">
              <Label htmlFor={`termMonths-${id}`} className="text-gray-700">Term (months)</Label>
              <Input
                id={`termMonths-${id}`}
                type="number"
                value={formData.termMonths || ''}
                onChange={handleChange}
                placeholder="Number of Months"
                className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor={`startDate-${id}`} className="text-gray-700">Start Date</Label>
              <Input
                id={`startDate-${id}`}
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="bg-white/70 border-gray-300 text-gray-800"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-gray-700">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  onClick={() => handlePaymentMethodChange("Cash")}
                  className={`${paymentMethod === "Cash"
                    ? "bg-blue-600 border-blue-300 text-white"
                    : "bg-white/70 hover:bg-white/90 text-gray-800"} border border-gray-300`}
                >
                  Cash
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePaymentMethodChange("UPI")}
                  className={`${paymentMethod === "UPI"
                    ? "bg-blue-600 border-blue-300 text-white"
                    : "bg-white/70 hover:bg-white/90 text-gray-800"} border border-gray-300`}
                >
                  UPI
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePaymentMethodChange("Bank")}
                  className={`${paymentMethod === "Bank"
                    ? "bg-blue-600 border-blue-300 text-white"
                    : "bg-white/70 hover:bg-white/90 text-gray-800"} border border-gray-300`}
                >
                  Bank
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor={`notes-${id}`} className="text-gray-700">Notes</Label>
              <textarea
                id={`notes-${id}`}
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional details here..."
                className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-400 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-['Overpass_Mono']"
              />
            </div>
          </div>

          {/* Error message */}
          {submitError && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200">
              {submitError}
            </div>
          )}

          {/* Success message */}
          {submitSuccess && (
            <div className="text-green-600 text-sm bg-green-50 p-2 rounded-md border border-green-200">
              Loan added successfully!
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : "Add Loan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
