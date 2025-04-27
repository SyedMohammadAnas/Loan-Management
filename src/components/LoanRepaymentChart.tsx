'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Line } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartType,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
}

/**
 * Interface for Repayment data
 */
interface Repayment {
  id: number;
  repayment_date: string;
  amount_paid: number;
  principal_paid: number;
  interest_paid: number;
  remaining_balance: number;
}

/**
 * Interface for Component Props
 */
interface LoanRepaymentChartProps {
  selectedLoan: Loan | null;
}

/**
 * LoanRepaymentChart Component
 * Displays a line chart showing repayment history of the selected loan
 */
export function LoanRepaymentChart({ selectedLoan }: LoanRepaymentChartProps) {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef<ChartJS<'line'>>(null);

  /**
   * Fetch repayment data when a loan is selected
   */
  useEffect(() => {
    async function fetchRepaymentData() {
      if (!selectedLoan) {
        setRepayments([]);
        return;
      }

      try {
        setIsLoading(true);

        // Calculate the repayment table name based on the loan
        const sanitizedFirstName = selectedLoan.first_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const sanitizedLastName = selectedLoan.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const repaymentTableName = `repayment_${sanitizedFirstName}_${sanitizedLastName}_${selectedLoan.id}`;

        // Fetch repayment data from Supabase
        const { data, error } = await supabase
          .from(repaymentTableName)
          .select('*')
          .order('repayment_date', { ascending: true });

        if (error) {
          console.error('Error fetching repayment data:', error);
          return;
        }

        setRepayments(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRepaymentData();
  }, [selectedLoan]);

  /**
   * Format date strings for chart labels
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  /**
   * Prepare chart data from repayments
   */
  const chartData: ChartData<'line'> = {
    labels: repayments.map(r => formatDate(r.repayment_date)),
    datasets: [
      {
        label: 'Remaining Balance',
        data: repayments.map(r => r.remaining_balance),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  /**
   * Chart options
   */
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
        from: 0.4,
        to: 0.4,
        loop: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)',
          font: {
            family: 'Overpass Mono, monospace',
          }
        },
        ticks: {
          font: {
            family: 'Overpass Mono, monospace',
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month',
          font: {
            family: 'Overpass Mono, monospace',
          }
        },
        ticks: {
          font: {
            family: 'Overpass Mono, monospace',
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Overpass Mono, monospace',
          }
        }
      },
      title: {
        display: true,
        text: selectedLoan
          ? `Repayment History for ${selectedLoan.first_name} ${selectedLoan.last_name}`
          : 'Select a loan to view repayment history',
        font: {
          family: 'Overpass Mono, monospace',
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
              }).format(context.parsed.y);
            }
            return label;
          }
        },
        titleFont: {
          family: 'Overpass Mono, monospace',
        },
        bodyFont: {
          family: 'Overpass Mono, monospace',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Render placeholder if no loan is selected
  if (!selectedLoan) {
    return (
      <div className="h-full flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p className="mb-2 text-lg font-medium">Select a loan to view repayment history</p>
          <p className="text-sm">The chart will display repayment data over time</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Render empty state if no repayments
  if (repayments.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p className="mb-2 text-lg font-medium">No repayment data available</p>
          <p className="text-sm">There are no recorded repayments for this loan yet</p>
        </div>
      </div>
    );
  }

  // Render chart with data
  return (
    <div className="h-full flex flex-col bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
      <div className="flex-1 w-full">
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>
    </div>
  );
}
