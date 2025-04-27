'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Loader2 } from 'lucide-react';

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
 * LoansList Component Props
 */
interface LoansListProps {
  onSelectLoan: (loan: Loan) => void;
  selectedLoanId: number | null;
}

/**
 * LoansList Component
 * Renders a searchable list of loans
 */
export function LoansList({ onSelectLoan, selectedLoanId }: LoansListProps) {
  // State for loans
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch loans from Supabase on component mount
   */
  useEffect(() => {
    async function fetchLoans() {
      try {
        setIsLoading(true);

        // Fetch all loans from Supabase
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setLoans(data || []);
        setFilteredLoans(data || []);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLoans();
  }, []);

  /**
   * Filter loans based on search query
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLoans(loans);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = loans.filter(loan =>
      loan.first_name.toLowerCase().includes(query) ||
      loan.last_name.toLowerCase().includes(query) ||
      loan.amount.toString().includes(query) ||
      loan.interest_rate.toString().includes(query) ||
      loan.status.toLowerCase().includes(query)
    );

    setFilteredLoans(filtered);
  }, [searchQuery, loans]);

  /**
   * Format currency amount
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-white/90 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
          placeholder="Search loans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loans list */}
      <div className="flex-1 overflow-y-auto rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4 text-gray-500">
            No loans found
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredLoans.map((loan) => (
              <li
                key={loan.id}
                className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${
                  selectedLoanId === loan.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onSelectLoan(loan)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{`${loan.first_name} ${loan.last_name}`}</h3>
                    <p className="text-sm text-gray-500">ID: {loan.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      loan.status === 'active' ? 'bg-green-100 text-green-800' :
                      loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {loan.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Interest: {loan.interest_rate}%</p>
                  <p className="text-sm text-gray-500">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
