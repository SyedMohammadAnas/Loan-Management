"use client";

/**
 * Unauthorized Page
 * Displayed when a user is not authorized to access a resource
 * Uses Overpass Mono font for consistent typography
 */

import { useRouter } from 'next/navigation';
import { GradientButton } from '@/components/ui/gradient-button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-4 font-overpass">
      <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-8 max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Access Denied</h1>

        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>

          <p className="text-white/70 mb-6">
            You are not authorized to access this page. This could be because:
          </p>

          <ul className="text-white/70 text-left list-disc pl-6 mb-6">
            <li>Your session has expired</li>
            <li>You haven't completed the verification process</li>
            <li>You're trying to access a restricted resource</li>
          </ul>
        </div>

        <div className="space-y-4">
          <GradientButton
            onClick={() => router.push('/auth/verify')}
            className="w-full"
          >
            Verify Your Identity
          </GradientButton>

          <Link href="/" className="block text-indigo-400 hover:text-indigo-300 text-sm">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
