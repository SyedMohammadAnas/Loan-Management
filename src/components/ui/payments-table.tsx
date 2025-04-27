"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, differenceInDays } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Interface for personal payments data
 */
interface PersonalPayment {
  id: number;
  name: string;
  amount: number;
  start_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
  status?: string;
}

/**
 * Props for the payments table component
 */
interface PaymentsTableProps {
  searchQuery?: string;
}

/**
 * PaymentsTable Component
 *
 * Displays a table of personal payments with search functionality
 * Fetches data directly from the personal_payments table in Supabase
 * Includes pagination and search filtering
 */
export function PaymentsTable({ searchQuery = "" }: PaymentsTableProps) {
  const [payments, setPayments] = useState<PersonalPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PersonalPayment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Get the status based on due date and current date
   */
  const getStatus = (dueDate: string, status?: string) => {
    if (status === "finished") return "finished";

    const today = new Date();
    const due = new Date(dueDate);

    if (today > due) {
      return "exceeded";
    }
    return "pending";
  };

  /**
   * Calculate remaining days until due date
   */
  const getRemainingDays = (dueDate: string, status?: string) => {
    if (status === "finished") return 0;

    const today = new Date();
    const due = new Date(dueDate);
    const days = differenceInDays(due, today);

    return days;
  };

  /**
   * Fetch payments data from Supabase
   */
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('personal_payments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      setPayments(data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to load payments data");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark payment as finished
   */
  const markAsFinished = async (id: number) => {
    try {
      const { error } = await supabase
        .from('personal_payments')
        .update({ status: 'finished' })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the data
      fetchPayments();
    } catch (err) {
      console.error("Error updating payment status:", err);
    } finally {
      setIsDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  /**
   * Handle tick button click
   */
  const handleTickClick = (payment: PersonalPayment) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  /**
   * Subscribe to personal_payments table changes
   */
  useEffect(() => {
    fetchPayments();

    // Set up a subscription for real-time updates
    const subscription = supabase
      .channel('personal_payments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_payments' },
        (payload) => {
          // Refresh data when any changes occur
          fetchPayments();
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Filter payments based on search query
   */
  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      payment.name.toLowerCase().includes(query) ||
      payment.notes?.toLowerCase().includes(query) ||
      payment.amount.toString().includes(query)
    );
  });

  /**
   * Format currency display
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Format date display
   */
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  /**
   * Get status badge based on payment status
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return (
          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
            <Check size={14} />
            <span>Finished</span>
          </div>
        );
      case 'exceeded':
        return (
          <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
            <AlertTriangle size={14} />
            <span>Exceeded</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
            <Clock size={14} />
            <span>Pending</span>
          </div>
        );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <p className="text-gray-500 font-['Overpass_Mono']">Loading payments...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <p className="text-red-500 font-['Overpass_Mono']">{error}</p>
      </div>
    );
  }

  // Show empty state
  if (payments.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <p className="text-gray-500 font-['Overpass_Mono']">No payments found. Add your first payment!</p>
      </div>
    );
  }

  // Show filtered empty state
  if (filteredPayments.length === 0 && searchQuery) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <p className="text-gray-500 font-['Overpass_Mono']">No payments match your search.</p>
      </div>
    );
  }

  // Render the table
  return (
    <>
      <div className="rounded-md border w-full">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-black/20">
            <TableRow>
              <TableHead className="w-[20%] font-semibold text-black">Name</TableHead>
              <TableHead className="w-[10%] font-semibold text-black">Amount</TableHead>
              <TableHead className="w-[12%] font-semibold text-black">Start Date</TableHead>
              <TableHead className="w-[12%] font-semibold text-black">Due Date</TableHead>
              <TableHead className="w-[10%] font-semibold text-black">Remaining</TableHead>
              <TableHead className="w-[8%] font-semibold text-black">Status</TableHead>
              <TableHead className="w-[20%] font-semibold text-black">Notes</TableHead>
              <TableHead className="w-[7%] font-semibold text-black">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => {
              const status = getStatus(payment.due_date, payment.status);
              const remainingDays = getRemainingDays(payment.due_date, payment.status);

              return (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-black">{payment.name}</TableCell>
                  <TableCell className="text-black">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="text-black">{formatDate(payment.start_date)}</TableCell>
                  <TableCell className="text-black">{formatDate(payment.due_date)}</TableCell>
                  <TableCell className="text-black">
                    {status === "finished" ? (
                      <span className="text-green-600">Completed</span>
                    ) : status === "exceeded" ? (
                      <span className="text-red-600">Overdue</span>
                    ) : (
                      <span>{remainingDays} days</span>
                    )}
                  </TableCell>
                  <TableCell className="text-black">
                    {getStatusBadge(status)}
                  </TableCell>
                  <TableCell className="text-black truncate max-w-xs">
                    {payment.notes || "—"}
                  </TableCell>
                  <TableCell>
                    {status !== "finished" && (
                      <Button
                        className="p-1 h-8 w-8"
                        variant="ghost"
                        onClick={() => handleTickClick(payment)}
                      >
                        <Check className="h-5 w-5 text-green-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Finished?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this payment as finished?
              This will update the status to "Finished" for payment:
              <span className="font-semibold block mt-2">
                {selectedPayment?.name} - {selectedPayment && formatCurrency(selectedPayment.amount)}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedPayment && markAsFinished(selectedPayment.id)}
            >
              Yes, Mark as Finished
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
