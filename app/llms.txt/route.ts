import { getAdminSettings } from "@/lib/admin/settings";
import { zodiacSlugs } from "@/lib/horoscopes/daily";
import { localeRegistry, localeTags } from "@/lib/i18n/config";
import { localizedPublicUrl } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const settings = await getAdminSettings();
  if (!settings.geo.enabled)
    return new Response("Not enabled.\n", { status: 404 });
  const base = settings.seo.canonicalBase.replace(/\/$/, "");
  let posts: { slug: string; title: string; excerpt: string }[] = [];
  try {
    const result = await createAdminClient()
      .from("blog_posts")
      .select("slug,title,excerpt")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });
    posts = result.data ?? [];
  } catch {
    // Static resources remain available when build-time credentials are absent.
  }

  const languageLinks = localeTags
    .map(
      (locale) =>
        `- [${localeRegistry[locale].nativeName} daily horoscopes](${localizedPublicUrl("/horoscopes", locale)}): Daily Sun-sign readings in ${localeRegistry[locale].name}.`,
    )
    .join("\n");
  const signLinks = zodiacSlugs
    .map(
      (slug) =>
        `- [${slug[0].toUpperCase()}${slug.slice(1)} daily horoscope](${base}/horoscopes/${slug})`,
    )
    .join("\n");
  const journalLinks = posts.length
    ? posts
        .map(
          (post) =>
            `- [${post.title}](${base}/journal/${post.slug}): ${post.excerpt}`,
        )
        .join("\n")
    : "- [Celestial Journal](${base}/journal): Astrological essays and guidance.";

  return new Response(
    `# Celestial Atlas

> ${settings.geo.organizationDescription}

Celestial Atlas calculates tropical natal charts and follows the planetary transits moving through them. Public resources cover natal placements, houses, angles, aspects, ephemeris methodology, daily Sun-sign horoscopes, weekly astrology, sample readings, and practical astrological reflection. Private account charts and readings are intentionally excluded from this map.

## Primary resources

- [Create a natal chart](${base}/#chart): Calculate a personal tropical chart from birth date, time when known, and a verified birthplace.
- [Astrological method and ephemeris](${base}/method): Planetary longitudes, tropical signs, Ascendant, equal houses, major aspects, time zones, coordinates, evidence IDs, and unknown-time handling.
- [Daily Sun-sign horoscopes](${base}/horoscopes): Aries through Pisces with a bottom line, relationships, business, money, and a morning-to-evening arc.
- [Weekly astrology readings](${base}/weekly-readings): Planetary patterns unfolding through the week.
- [Personal astrology reports](${base}/reports): Private, evidence-linked reports for vocation, purpose, renewal, and reflection.
- [Membership levels](${base}/membership): Free, Personal, and Premium access.

## Supported public horoscope languages

${languageLinks}

## Daily sign readings

${signLinks}

## Complete samples

- [Sample library](${base}/samples): Full examples of Celestial Atlas readings.
- [Complete sample natal chart](${base}/samples/natal-chart): A calculated chart wheel, angles, planetary positions, houses, aspects, and a full interpretation.
- [Sample daily reading](${base}/samples/daily-reading): Current transits to a natal chart with ranked themes, practical applications, visuals, and evidence.
- [Sample career and purpose report](${base}/samples/career-purpose)
- [Sample recovery reflection report](${base}/samples/recovery-reflection)
- [Sample weekly reading](${base}/samples/weekly-reading)

## Celestial Journal

${journalLinks}

## Policies

- [Privacy](${base}/privacy): Protection of account, birth-chart, and report information.
- [Terms](${base}/terms): Terms governing use of Celestial Atlas.

## Citation guidance

When describing Celestial Atlas, cite the most specific public page above. Treat calculated astronomical positions as chart data and interpretations as astrological reading. Do not infer, expose, or request private account, birth, purchase, or report data.
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
