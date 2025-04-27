"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, BarChart, CreditCard, Bell, Settings, Search, PlusCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TableDemo } from "@/components/ui/table-demo";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { LoanFormDialog } from "@/components/ui/loan-form";
import { useRouter } from "next/navigation";

/**
 * Demo component showcasing the Sidebar functionality
 * Includes navigation links, user profile, and dashboard content
 * Integrated with the original dashboard functionality
 * Uses a white theme with bright gradients and glass effects
 */
export function SidebarDemo({ children }: { children?: React.ReactNode }) {
  const router = useRouter();

  // State to control sidebar open/close
  const [open, setOpen] = useState(false);
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // State to store user session information
  const [userSession, setUserSession] = useState<{ email?: string; verified?: boolean } | null>(null);

  // Navigation links configuration with icons
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="text-gray-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: (
        <BarChart className="text-gray-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Payments",
      href: "/payments",
      icon: (
        <CreditCard className="text-gray-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Notifications",
      href: "#",
      icon: (
        <Bell className="text-gray-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className="text-gray-700 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  /**
   * Get user session on component mount
   */
  useEffect(() => {
    // Get session data from localStorage
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const parsedSession = JSON.parse(sessionData);
        setUserSession(parsedSession);
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    }
  }, []);

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

  /**
   * Custom sign out link component to handle the click event
   * Used to fix the linter error with onClick on SidebarLink
   */
  const SignOutLink = () => {
    const { open } = useSidebar();
    return (
      <Link
        href="#"
        className="flex items-center justify-start gap-2 group/sidebar py-2 text-red-600 hover:text-red-700"
        onClick={(e) => {
          e.preventDefault();
          handleSignOut();
        }}
      >
        <LogOut className="text-red-500 h-6 w-6 flex-shrink-0" />
        <motion.span
          animate={{
            display: open ? "inline-block" : "none",
            opacity: open ? 1 : 0,
          }}
          className="text-red-600 text-base font-semibold group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
        >
          Sign Out
        </motion.span>
      </Link>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 font-['Overpass_Mono']">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-white shadow-md">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} className="text-base font-semibold" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {/* Sign out link - using custom component to avoid linter error */}
            <SignOutLink />

            {/* User profile link */}
            {userSession && (
              <SidebarLink
                link={{
                  label: userSession.email || "User Profile",
                  href: "#",
                  icon: (
                    <Image
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      className="h-8 w-8 flex-shrink-0 rounded-full ring-2 ring-blue-100"
                      width={50}
                      height={50}
                      alt="User Avatar"
                    />
                  ),
                }}
                className="text-base font-semibold"
              />
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content area */}
      <div className="flex-1 p-6 overflow-hidden">
        {/* Render children if provided, otherwise show default dashboard content */}
        {children ? (
          children
        ) : (
          <div className="w-full h-full rounded-xl backdrop-blur-md bg-gradient-to-b from-white/80 to-white/60 border border-gray-100 shadow-xl flex flex-col p-6 overflow-hidden">
            {/* Header area */}
            <div className="flex flex-row justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800">Dashboard</h1>

                {/* Search Input */}
                <div className="relative ml-4 md:ml-8 hidden sm:block">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search loans..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 w-[200px] md:w-[300px] bg-white/70 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-md focus:ring-blue-300 focus:border-blue-300 shadow-sm text-base font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Add Loan Button with Dialog */}
                <LoanFormDialog />

                {userSession && userSession.verified && (
                  <div className="hidden md:block text-gray-700 text-base p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-md font-medium">
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm font-bold">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Table container - fills available space without overflowing */}
            <div className="flex-grow w-full overflow-hidden bg-white/50 backdrop-blur-sm rounded-lg shadow-md">
              <TableDemo searchQuery={searchQuery} />
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end items-center">
              <div className="text-gray-500 text-base font-medium">
                {new Date().toLocaleDateString()} • Personal Loan Management
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Logo component with full text
 * Shown when sidebar is expanded
 */
export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-['Overpass_Mono'] flex space-x-2 items-center text-base text-gray-800 py-1 relative z-20"
    >
      <div className="h-6 w-7 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 shadow-sm" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-gray-800 whitespace-pre text-sm tracking-tight"
      >
        LOAN MANAGEMENT SYSTEM
      </motion.span>
    </Link>
  );
};

/**
 * LogoIcon component - icon only
 * Shown when sidebar is collapsed
 */
export const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-['Overpass_Mono'] flex space-x-2 items-center text-base text-gray-800 py-1 relative z-20"
    >
      <div className="h-6 w-7 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 shadow-sm" />
    </Link>
  );
};
