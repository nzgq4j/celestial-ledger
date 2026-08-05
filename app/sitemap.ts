import type { MetadataRoute } from "next";
import { getAdminSettings } from "@/lib/admin/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { zodiacSlugs } from "@/lib/horoscopes/daily";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getAdminSettings();
  const base = settings.seo.canonicalBase;
  let posts: { slug: string; updated_at: string }[] | null = null;
  try {
    const result = await createAdminClient()
      .from("blog_posts")
      .select("slug,updated_at")
      .eq("status", "published");
    posts = result.data;
  } catch {
    // Build environments without runtime secrets still receive the static map.
  }
  const paths = [
    "",
    "/horoscopes",
    "/weekly-readings",
    "/reports",
    "/samples",
    "/samples/daily-reading",
    "/method",
    "/journal",
    "/privacy",
    "/terms",
  ];
  return [
    ...paths.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency:
        path === "/horoscopes" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.7,
    })),
    ...zodiacSlugs.map((slug) => ({
      url: `${base}/horoscopes/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...(posts ?? []).map((post) => ({
      url: `${base}/journal/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
