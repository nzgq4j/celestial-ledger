import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://www.google.com",
  "frame-src https://www.google.com https://recaptcha.google.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

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
  // The website is the Celestial Atlas app (built from celestial-atlas/ into
  // public/ by `npm run build`). Every path that is not an API route or a
  // static file opens the app, which routes on the client.
  rewrites: async () => ({
    beforeFiles: [],
    afterFiles: [],
    fallback: [{ source: "/:path*", destination: "/index.html" }],
  }),
  // Addresses from the retired website.
  redirects: async () => [
    ...[
      "/horoscopes",
      "/horoscopes/:sign",
      "/weekly-readings/:path*",
      "/clock",
    ].map((source) => ({ source, destination: "/stars", permanent: true })),
    ...[
      "/daily-readings/:path*",
      "/method",
      "/samples/:path*",
      "/blog/:path*",
      "/journal/:slug",
      "/contact",
    ].map((source) => ({ source, destination: "/today", permanent: true })),
    ...[
      "/account/:path*",
      "/membership",
      "/reports/:path*",
      "/auth/login",
      "/auth/create-account",
      "/auth/forgot-password",
      "/auth/update-password",
      "/auth/check-email",
      "/auth/claim-subscription",
    ].map((source) => ({ source, destination: "/profile", permanent: false })),
  ],
  headers: async () => [
    {
      // The app shell is revalidated on every load so a release reaches readers at once.
      source: "/index.html",
      headers: [{ key: "Cache-Control", value: "no-cache" }],
    },
    {
      // The service worker must update promptly and only control this site.
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
    {
      source: "/assets/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: contentSecurityPolicy,
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "X-DNS-Prefetch-Control", value: "off" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
