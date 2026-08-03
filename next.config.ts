import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Normalize Vercel Marketplace and local Supabase public variable names into
  // application-owned browser-safe aliases. Never map a secret here.
  env: {
    NEXT_PUBLIC_CELESTIAL_SUPABASE_URL:
      process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      "",
    NEXT_PUBLIC_CELESTIAL_SUPABASE_KEY:
      process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      "",
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  headers: async () => [
    {
      source: "/account/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow, noarchive",
        },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
