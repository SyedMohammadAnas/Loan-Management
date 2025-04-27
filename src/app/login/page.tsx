/**
 * Login Page Component
 * Contains the login form for the application
 * Uses Overpass Mono font for consistent typography
 */

import { LoginForm } from '@/components/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#030303] p-4 font-overpass">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.15] via-transparent to-rose-500/[0.15] blur-3xl" />

      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
          Personal Loan Management
        </h1>
        <p className="text-white/60 text-center max-w-2xl mb-12">
          Securely manage your personal loans with our state-of-the-art platform.
          Login to access your dashboard and manage your account.
        </p>

        <div className="w-full max-w-md">
          <LoginForm />
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm mb-2">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="#" className="text-indigo-400 hover:text-indigo-300">
              Terms of Service
            </Link>
            <Link href="#" className="text-indigo-400 hover:text-indigo-300">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-white/40 text-sm">
        © 2023 Personal Loan Management. All rights reserved.
      </footer>
    </main>
  );
}
