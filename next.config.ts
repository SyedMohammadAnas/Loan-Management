import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    return config;
  },
  // Configure allowed image domains
  images: {
    domains: ["images.unsplash.com"],
  },
  // Disable ESLint during build to prevent build failures
  eslint: {
    // Only warn on ESLint errors, don't fail the build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
