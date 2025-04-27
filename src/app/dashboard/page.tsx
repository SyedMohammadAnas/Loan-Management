'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TableDemo } from '@/components/ui/table-demo';
import { GradientButton } from '@/components/ui/gradient-button';
import { LogOut, PlusCircle, Search } from 'lucide-react';
import { LoanFormDialog } from '@/components/ui/loan-form';
import { Input } from '@/components/ui/input';
import { SidebarDemo } from '@/components/ui/sidebar-demo';

/**
 * Dashboard Page
 * Main authenticated landing page for users after login
 * Shows user verification status and session information
 * Uses Overpass Mono font throughout for consistent typography
 * Features a dark gradient background and sidebar navigation
 */
export default function DashboardPage() {
  const router = useRouter();

  // State to store user session information
  const [userSession, setUserSession] = useState<{ email?: string; verified?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Check user authentication status on component mount
   * Redirects to unauthorized page if no session is found
   */
  useEffect(() => {
    // Get session data from localStorage
    const sessionData = localStorage.getItem('userSession');

    if (sessionData) {
      try {
        const parsedSession = JSON.parse(sessionData);
        setUserSession(parsedSession);

        // Check cookie as well for double verification
        checkSessionCookie();
      } catch (error) {
        console.error('Error parsing session data:', error);
        // Invalid session data, redirect to unauthorized
        router.push('/unauthorized');
      }
    } else {
      // No session found, redirect to login
      router.push('/unauthorized');
    }

    setIsLoading(false);
  }, [router]);

  /**
   * Check if session cookie exists
   * Uses an API endpoint to verify the session cookie
   */
  const checkSessionCookie = async () => {
    try {
      const response = await fetch('/api/auth/check-session');
      const data = await response.json();

      if (!data.authenticated) {
        console.log('Session cookie not found or invalid');
        // Session cookie missing, clear local storage and redirect
        handleSignOut();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  /**
   * Handle sign out action
   * Clears session data and redirects to home
   */
  const handleSignOut = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear local storage
      localStorage.removeItem('userSession');

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: force redirect even if API fails
      localStorage.removeItem('userSession');
      window.location.href = '/';
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4">
        <div className="text-white font-['Overpass_Mono']">Loading...</div>
      </div>
    );
  }

  // Return the dashboard using the updated SidebarDemo component's default content
  return <SidebarDemo />;
}
