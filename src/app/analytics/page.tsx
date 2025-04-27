'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Loader2, CircleDollarSign, TrendingUp, Landmark } from 'lucide-react';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { LoansList } from '@/components/LoansList';
import { LoanRepaymentChart } from '@/components/LoanRepaymentChart';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Interface for Loan data
 */
interface Loan {
  id: number;
  first_name: string;
  last_name: string;
  amount: number;
  interest_rate: number;
  status: string;
  created_at: string;
}

/**
 * Analytics Card Component
 * Displays a metric with title, value, and icon
 */
interface AnalyticsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}

function AnalyticsCard({ title, value, icon, bgColor }: AnalyticsCardProps) {
  return (
    <div className={`${bgColor} backdrop-blur-xl rounded-xl shadow-xl border border-white/30 p-6 flex flex-col h-full hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="p-2 bg-white/30 rounded-lg shadow-md">
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <div className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md">{value}</div>
      </div>
    </div>
  );
}

/**
 * Analytics Page
 * Displays key metrics about loans in a dashboard format
 * Shows 4 cards with different loan-related metrics
 */
export default function AnalyticsPage() {
  const router = useRouter();

  // State for metrics and selected loan
  const [metrics, setMetrics] = useState({
    activeLoans: 0,
    interestToBePaid: 0,
    totalPrincipal: 0,
    outstandingAmount: 0
  });
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
   * Check user authentication status and fetch metrics on component mount
   */
  useEffect(() => {
    // Get session data from localStorage
    const sessionData = localStorage.getItem('userSession');

    if (sessionData) {
      try {
        // Successfully authenticated, fetch metrics data
        fetchLoanMetrics();
      } catch (error) {
        console.error('Error parsing session data:', error);
        // Invalid session data, redirect to unauthorized
        router.push('/unauthorized');
      }
    } else {
      // No session found, redirect to login
      router.push('/unauthorized');
    }
  }, [router]);

  /**
   * Fetch metrics data from Supabase
   * Calculates all the required loan metrics
   */
  const fetchLoanMetrics = async () => {
    try {
      setIsLoading(true);

      // Fetch all active loans
      const { data: activeLoans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      // Calculate total principal amount
      const totalPrincipal = activeLoans.reduce((sum, loan) => sum + Number(loan.amount), 0);

      // Variables to calculate total interest and outstanding amounts
      let totalInterestToBePaid = 0;
      let totalOutstandingAmount = 0;

      // Fetch repayment data for each loan to calculate interest and outstanding amounts
      if (activeLoans.length > 0) {
        for (const loan of activeLoans) {
          // Calculate the repayment table name
          const sanitizedFirstName = loan.first_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const sanitizedLastName = loan.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const repaymentTableName = `repayment_${sanitizedFirstName}_${sanitizedLastName}_${loan.id}`;

          // Fetch the most recent repayment to get current balance
          const { data: repayments, error: repaymentError } = await supabase
            .from(repaymentTableName)
            .select('*')
            .order('repayment_date', { ascending: false })
            .limit(1);

          if (repaymentError) {
            console.error(`Error fetching repayments for loan ${loan.id}:`, repaymentError);
            continue;
          }

          // Calculate remaining balance and projected interest
          if (repayments && repayments.length > 0) {
            const currentBalance = repayments[0].remaining_balance;

            // Calculate daily interest rate (annual rate / 365)
            const dailyInterestRate = loan.interest_rate / 100 / 365;

            // Estimate interest to be paid (30 days projection)
            const projectedInterest = currentBalance * dailyInterestRate * 30;

            totalInterestToBePaid += projectedInterest;
            totalOutstandingAmount += currentBalance;
          } else {
            // If no repayments yet, use the original loan amount
            // Calculate daily interest rate (annual rate / 365)
            const dailyInterestRate = loan.interest_rate / 100 / 365;

            // Estimate interest to be paid (30 days projection)
            const projectedInterest = loan.amount * dailyInterestRate * 30;

            totalInterestToBePaid += projectedInterest;
            totalOutstandingAmount += loan.amount;
          }
        }
      }

      // Update metrics state
      setMetrics({
        activeLoans: activeLoans.length,
        interestToBePaid: totalInterestToBePaid,
        totalPrincipal: totalPrincipal,
        outstandingAmount: totalOutstandingAmount + totalPrincipal
      });

    } catch (err) {
      console.error('Error fetching loan metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle loan selection
   */
  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  // If sidebar component exists, render it with analytics content
  return (
    <SidebarDemo>
      <div className="w-full h-full rounded-xl backdrop-blur-md bg-gradient-to-b from-white/80 to-white/60 border border-gray-100 shadow-xl flex flex-col p-6 overflow-hidden">
        {/* Header area */}
        <div className="flex flex-row justify-between items-center mb-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800">Analytics</h1>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Active Loans Card */}
            <AnalyticsCard
              title="Active Loans"
              value={metrics.activeLoans.toString()}
              icon={<CreditCard className="h-6 w-6 text-white" />}
              bgColor="bg-gradient-to-br from-blue-500 to-blue-700"
            />

            {/* Interest To Be Paid Card */}
            <AnalyticsCard
              title="Interest To Be Paid"
              value={formatCurrency(metrics.interestToBePaid)}
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              bgColor="bg-gradient-to-br from-purple-500 to-purple-700"
            />

            {/* Total Principal Card */}
            <AnalyticsCard
              title="Total Principal"
              value={formatCurrency(metrics.totalPrincipal)}
              icon={<Landmark className="h-6 w-6 text-white" />}
              bgColor="bg-gradient-to-br from-green-500 to-green-700"
            />

            {/* Outstanding Amount Card */}
            <AnalyticsCard
              title="Outstanding Amount"
              value={formatCurrency(metrics.outstandingAmount)}
              icon={<CircleDollarSign className="h-6 w-6 text-white" />}
              bgColor="bg-gradient-to-br from-red-500 to-red-700"
            />
          </div>
        )}

        {/* Loan Details Section */}
        <div className="flex flex-col flex-1 space-y-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 h-[500px]">
            {/* Loans List */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <LoansList
                onSelectLoan={handleLoanSelect}
                selectedLoanId={selectedLoan?.id || null}
              />
            </div>

            {/* Loan Repayment Chart */}
            <div className="w-full md:w-2/3 lg:w-3/4">
              <LoanRepaymentChart selectedLoan={selectedLoan} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex justify-end items-center">
          <div className="text-gray-500 text-base font-medium">
            {new Date().toLocaleDateString()} • Loan Analytics Dashboard
          </div>
        </div>
      </div>
    </SidebarDemo>
  );
}
