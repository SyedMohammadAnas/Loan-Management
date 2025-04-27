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
};

export default nextConfig;
