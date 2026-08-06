import type { MetadataRoute } from "next";
import { getAdminSettings } from "@/lib/admin/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { zodiacSlugs } from "@/lib/horoscopes/daily";
import { localeTags } from "@/lib/i18n/config";
import { localizedAlternates, localizedPublicUrl } from "@/lib/seo";

const publicRoutes = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/weekly-readings", changeFrequency: "weekly", priority: 0.8 },
  { path: "/reports", changeFrequency: "weekly", priority: 0.8 },
  { path: "/membership", changeFrequency: "monthly", priority: 0.75 },
  { path: "/samples", changeFrequency: "monthly", priority: 0.8 },
  {
    path: "/samples/daily-reading",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/samples/career-purpose",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/samples/recovery-reflection",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/samples/weekly-reading",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  { path: "/method", changeFrequency: "monthly", priority: 0.75 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getAdminSettings();
  const base = settings.seo.canonicalBase.replace(/\/$/, "");
  let posts: { slug: string; updated_at: string }[] = [];
  try {
    const result = await createAdminClient()
      .from("blog_posts")
      .select("slug,updated_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString());
    posts = result.data ?? [];
  } catch {
    // Builds without runtime credentials still publish the complete static map.
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const localizedRoutes = [
    "/horoscopes",
    ...zodiacSlugs.map((slug) => `/horoscopes/${slug}`),
  ];

  return [
    ...publicRoutes.map(({ path, changeFrequency, priority }) => ({
      url: `${base}${path}`,
      changeFrequency,
      priority,
      ...(path === ""
        ? { alternates: { languages: localizedAlternates("/") } }
        : {}),
    })),
    ...localizedRoutes.flatMap((path) =>
      localeTags.map((locale) => ({
        url: localizedPublicUrl(path, locale),
        lastModified: today,
        changeFrequency: "daily" as const,
        priority: path === "/horoscopes" ? 0.9 : 0.8,
        alternates: { languages: localizedAlternates(path) },
      })),
    ),
    ...posts.map((post) => ({
      url: `${base}/journal/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
