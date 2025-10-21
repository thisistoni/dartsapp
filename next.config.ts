import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds to succeed even with type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default pwaConfig(nextConfig as any);