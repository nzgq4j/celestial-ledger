import type { MetadataRoute } from "next";
import { getAdminSettings } from "@/lib/admin/settings";

const privatePaths = [
  "/account",
  "/admin",
  "/api/",
  "/auth/",
  "/daily-readings/",
  "/reports/",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getAdminSettings();
  const base = settings.seo.canonicalBase.replace(/\/$/, "");
  if (!settings.seo.indexingEnabled)
    return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
        ],
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
