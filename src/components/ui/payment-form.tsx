"use client";

import { useId, useState, FormEvent, useEffect } from "react";
import { PlusCircle, Wallet, Loader2 } from "lucide-react";
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
 * PaymentFormInterface for type checking form inputs
 */
interface PaymentFormData {
  name: string;
  amount: number;
  startDate: string;
  dueDate: string;
  notes: string;
}

/**
 * PaymentFormDialog Component
 *
 * A modal dialog for adding a new personal payment with specified fields
 * Features form inputs for all required payment details
 * Uses custom styling consistent with the application theme
 * Submits data directly to Supabase personal_payments table
 */
export function PaymentFormDialog() {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<PaymentFormData>({
    name: "",
    amount: 0,
    startDate: new Date().toISOString().split('T')[0], // Default to today
    dueDate: new Date().toISOString().split('T')[0], // Default to today
    notes: ""
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        amount: 0,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
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
   * Handle form submission
   * Directly inserts data into personal_payments table
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate form data
      if (!formData.name) {
        throw new Error("Payment name is required");
      }

      if (formData.amount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }

      if (!formData.startDate) {
        throw new Error("Start date is required");
      }

      if (!formData.dueDate) {
        throw new Error("Due date is required");
      }

      // Submit data to Supabase
      const { error } = await supabase.from('personal_payments').insert({
        name: formData.name,
        amount: formData.amount,
        start_date: formData.startDate,
        due_date: formData.dueDate,
        notes: formData.notes
      });

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
      console.error("Error submitting payment:", error);
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
          <span>Add Payment</span>
        </GradientButton>
      </DialogTrigger>

      <DialogContent className="bg-gradient-to-b from-white/90 to-white/70 border border-gray-200 text-gray-800 backdrop-blur-md max-h-[85vh] overflow-y-auto shadow-lg">
        <div className="flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white"
            aria-hidden="true"
          >
            <Wallet className="text-blue-600" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left text-black font-semibold">Add New Payment</DialogTitle>
            <DialogDescription className="text-left text-gray-800">
              Enter all required payment details below.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Payment Name */}
            <div className="space-y-2">
              <Label htmlFor={`name-${id}`} className="text-black">Payment Name</Label>
              <Input
                id={`name-${id}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Payment name"
                className="bg-white/70 border-gray-300 text-black placeholder:text-gray-500"
                required
              />
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor={`amount-${id}`} className="text-black">Amount</Label>
              <Input
                id={`amount-${id}`}
                type="number"
                value={formData.amount || ''}
                onChange={handleChange}
                placeholder="₹/-"
                className="bg-white/70 border-gray-300 text-black placeholder:text-gray-500"
                required
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor={`startDate-${id}`} className="text-black">Start Date</Label>
              <Input
                id={`startDate-${id}`}
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="bg-white/70 border-gray-300 text-black"
                required
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor={`dueDate-${id}`} className="text-black">Due Date</Label>
              <Input
                id={`dueDate-${id}`}
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className="bg-white/70 border-gray-300 text-black"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor={`notes-${id}`} className="text-black">Notes</Label>
              <textarea
                id={`notes-${id}`}
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional details here..."
                className="bg-white/70 border-gray-300 text-black placeholder:text-gray-500 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-['Overpass_Mono']"
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
              Payment added successfully!
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
            ) : "Add Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
