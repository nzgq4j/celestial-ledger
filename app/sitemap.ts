import type { MetadataRoute } from "next";

const base = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://celestialatlas.app"
).replace(/\/$/, "");

/** Public screens of the app. Private screens (profile, journal, report) are left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "/", priority: 1, changeFrequency: "daily" as const },
    { path: "/stars", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/numbers", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/tarot", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    priority,
    changeFrequency,
  }));
}
