import type { MetadataRoute } from "next";

const base = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://celestialatlas.app"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  // Previews are demo builds and are never indexed.
  if (process.env.VERCEL_ENV === "preview")
    return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/profile", "/journal", "/report"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
