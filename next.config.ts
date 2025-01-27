import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Hier kannst du weitere Next.js-Konfigurationen hinzufügen
});

export default nextConfig;