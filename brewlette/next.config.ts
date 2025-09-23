import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to avoid blocking deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also ignore TypeScript errors during build if needed
    ignoreBuildErrors: false,
  },
}

export default nextConfig;
