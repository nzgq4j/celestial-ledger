import type { MetadataRoute } from "next";
import { getAdminSettings } from "@/lib/admin/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getAdminSettings();
  return {
    rules: settings.seo.indexingEnabled
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/account", "/admin", "/api", "/reports/"],
        }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${settings.seo.canonicalBase}/sitemap.xml`,
  };
}
