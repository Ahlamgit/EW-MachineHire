import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA offline is deferred; keep config minimal for Phase 1.
  reactStrictMode: true,
  images: {
    // Official logo is a local static asset under public/brand/
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
