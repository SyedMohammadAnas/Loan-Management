"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoanDetailsModal } from "@/components/ui/loan-details-modal";

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
 * Props for TableDemo component
 */
interface TableDemoProps {
  searchQuery?: string;
}

/**
 * TableDemo Component
 *
 * Displays a styled table with loan data from Supabase
 * Includes:
 * - Clean, modern design with hover lift effect
 * - Simple non-striped layout for cleaner UI
 * - Dark gradient background with glass effect
 * - Real-time data fetching from Supabase without authentication
 * - Interactive rows that open a details modal on click
 * - Search functionality to filter loans
 */
export function TableDemo({ searchQuery = "" }: TableDemoProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);

  // State for the loan details modal
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Format currency amount to INR format
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format date to local format
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Handles opening the loan details modal
   */
  const handleOpenLoanDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  /**
   * Handles closing the loan details modal
   */
  const handleCloseLoanDetails = () => {
    setIsModalOpen(false);
  };

  /**
   * Filter loans based on search query
   */
  useEffect(() => {
    if (!searchQuery.trim() || loans.length === 0) {
      setFilteredLoans(loans);
      setFilteredTotalAmount(totalAmount);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    const filtered = loans.filter((loan) => {
      const fullName = `${loan.first_name} ${loan.last_name}`.toLowerCase();
      const amount = loan.amount.toString();
      const interestRate = loan.interest_rate.toString();
      const termMonths = loan.term_months.toString();
      const startDate = formatDate(loan.start_date).toLowerCase();
      const paymentMethod = loan.payment_method.toLowerCase();

      return (
        fullName.includes(query) ||
        amount.includes(query) ||
        interestRate.includes(query) ||
        termMonths.includes(query) ||
        startDate.includes(query) ||
        paymentMethod.includes(query)
      );
    });

    setFilteredLoans(filtered);

    // Update filtered total amount
    const filteredTotal = filtered.reduce((sum, loan) => sum + Number(loan.amount), 0);
    setFilteredTotalAmount(filteredTotal);
  }, [searchQuery, loans, totalAmount]);

  /**
   * Fetch all loans from Supabase without filtering by user
   */
  useEffect(() => {
    async function fetchLoans() {
      try {
        setIsLoading(true);

        // Fetch all loans without user_id filter
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setLoans(data as Loan[]);
        setFilteredLoans(data as Loan[]);

        // Calculate total loan amount
        const total = data.reduce((sum, loan) => sum + Number(loan.amount), 0);
        setTotalAmount(total);
        setFilteredTotalAmount(total);

      } catch (err) {
        console.error('Error fetching loans:', err);
        setError('Failed to load loans data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLoans();

    // Set up realtime subscription
    const loansSubscription = supabase
      .channel('loans-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'loans'
      }, payload => {
        // Refetch loans when there's a change
        fetchLoans();
      })
      .subscribe();

    return () => {
      // Clean up subscription
      supabase.removeChannel(loansSubscription);
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 p-10 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 p-10 flex justify-center items-center min-h-[300px]">
        <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200 max-w-md">
          <p>Error: {error}</p>
          <p className="text-sm text-red-500 mt-2">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (loans.length === 0) {
    return (
      <div className="w-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 p-10 flex justify-center items-center min-h-[300px]">
        <div className="text-gray-700 text-center max-w-md">
          <h3 className="text-xl font-medium mb-2">No loans yet</h3>
          <p>Click the "Add Loan" button to create your first loan entry.</p>
        </div>
      </div>
    );
  }

  // Show no search results
  if (filteredLoans.length === 0 && searchQuery) {
    return (
      <div className="w-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 p-10 flex justify-center items-center min-h-[300px]">
        <div className="text-gray-700 text-center max-w-md">
          <h3 className="text-xl font-medium mb-2">No matching loans found</h3>
          <p>Try adjusting your search query or clear it to see all loans.</p>
        </div>
      </div>
    );
  }

  // Show loans table
  return (
    <>
      <div className="w-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200">
        <div className="w-full overflow-x-hidden">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent hover:shadow-none hover:translate-y-0">
                <TableHead className="w-[20%] text-gray-800">Borrower</TableHead>
                <TableHead className="w-[15%] text-gray-800">Amount</TableHead>
                <TableHead className="w-[12%] text-gray-800">Interest</TableHead>
                <TableHead className="w-[15%] text-gray-800">Start Date</TableHead>
                <TableHead className="w-[13%] text-gray-800">Term</TableHead>
                <TableHead className="w-[15%] text-right text-gray-800">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow
                  key={loan.id}
                  className="border-b border-gray-200 backdrop-blur-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleOpenLoanDetails(loan)}
                >
                  <TableCell className="font-medium truncate text-gray-800">
                    {loan.first_name} {loan.last_name}
                  </TableCell>
                  <TableCell className="truncate text-gray-800">
                    {formatCurrency(loan.amount)}
                  </TableCell>
                  <TableCell className="truncate text-gray-800">
                    {loan.interest_rate}%
                  </TableCell>
                  <TableCell className="truncate text-gray-800">
                    {formatDate(loan.start_date)}
                  </TableCell>
                  <TableCell className="truncate text-gray-800">
                    {loan.term_months} {loan.term_months === 1 ? 'month' : 'months'}
                  </TableCell>
                  <TableCell className="text-right flex justify-end items-center gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
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
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      loan.payment_method === "Cash"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : loan.payment_method === "UPI"
                        ? "bg-purple-100 text-purple-700 border border-purple-300"
                        : "bg-amber-100 text-amber-700 border border-amber-300"
                    }`}>
                      {loan.payment_method}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow className="hover:bg-transparent hover:shadow-none hover:translate-y-0">
                <TableCell colSpan={5} className="text-gray-800 font-bold">Total Loan Amount</TableCell>
                <TableCell className="text-right text-gray-800 font-bold">{formatCurrency(filteredTotalAmount)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <p className="mt-4 pb-4 text-center text-sm text-gray-500">
          {searchQuery ? `Showing ${filteredLoans.length} of ${loans.length} loans` : "Loan Management Summary"}
        </p>
      </div>

      {/* Loan Details Modal */}
      <LoanDetailsModal
        loan={selectedLoan}
        isOpen={isModalOpen}
        onClose={handleCloseLoanDetails}
      />
    </>
  );
}
