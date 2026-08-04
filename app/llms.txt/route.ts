import { getAdminSettings } from "@/lib/admin/settings";

export async function GET() {
  const settings = await getAdminSettings();
  if (!settings.geo.enabled)
    return new Response("Not enabled.\n", { status: 404 });
  const base = settings.seo.canonicalBase.replace(/\/$/, "");
  return new Response(
    `# Celestial Atlas

> ${settings.geo.organizationDescription}

Celestial Atlas maps natal placements, houses, aspects, planetary transits, and numerological patterns into personal charts and private reflective readings.

## Astrology and readings

- [Daily horoscopes](${base}/horoscopes): Daily guidance for every zodiac sign, shaped by the current celestial weather.
- [Weekly readings](${base}/weekly-readings): The larger planetary patterns and themes unfolding through the week.
- [Personal reports](${base}/reports): Private natal-chart readings for vocation, purpose, renewal, and reflection.
- [Sample reports](${base}/samples): Complete sample editions showing the structure and voice of Celestial Atlas readings.

## Journal and methodology

- [Celestial Journal](${base}/journal): Astrological essays, celestial patterns, and practical guidance.
- [Our method](${base}/method): How astronomical calculations, evidence references, and interpretive layers are assembled.

## Policies

- [Privacy](${base}/privacy): How account, chart, and report information is protected.
- [Terms](${base}/terms): Terms governing use of Celestial Atlas.
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
