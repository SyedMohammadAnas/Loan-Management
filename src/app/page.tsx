'use client';

/**
 * Home Page Component
 * Landing page for the application using HeroGeometric component
 * Checks for existing user session and redirects to dashboard if user is already logged in
 * Uses Overpass Mono font for consistent typography
 */

import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { GradientButton } from '@/components/ui/gradient-button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check for existing user session on component mount
   * Redirects to dashboard if user is already logged in
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if user has a session in local storage
        const sessionData = localStorage.getItem('userSession');

        if (sessionData) {
          // Also verify with the server that the cookie is valid
          const response = await fetch('/api/auth/check-session');
          const data = await response.json();

          if (data.authenticated) {
            // User is already logged in, redirect to dashboard
            router.push('/dashboard');
            return;
          } else {
            // Session is invalid, clear local storage
            localStorage.removeItem('userSession');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On error, clear localStorage to be safe
        localStorage.removeItem('userSession');
      }

      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  // Show minimal loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center font-overpass">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="font-overpass">
      <HeroGeometric
        badge="Good morning Anas"
        title1="Anas's"
        title2="Personal App"
      />

      {/* Gradient Button Container */}
      <div className="absolute bottom-55 left-0 right-0 z-20 flex justify-center">
        <Link href="/login" passHref>
          <GradientButton>
            Get Started
          </GradientButton>
        </Link>
      </div>
    </div>
  );
}
