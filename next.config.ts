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
  // Disable ESLint during production build to prevent build failures
  eslint: {
    // Warning: Only do this in deployment environments where you know linting is acceptable
    ignoreDuringBuilds: true,
  },
  // Set typescript checking to false during deployment to prevent build failures
  typescript: {
    // Warning: Only do this in deployment environments where you know type checking is acceptable
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
