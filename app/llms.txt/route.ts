import { getAdminSettings } from "@/lib/admin/settings";

export async function GET() {
  const settings = await getAdminSettings();
  if (!settings.geo.enabled)
    return new Response("Not enabled.\n", { status: 404 });
  const base = settings.seo.canonicalBase.replace(/\/$/, "");
  return new Response(
    `# Celestial Atlas

> ${settings.geo.organizationDescription}

Celestial Atlas maps the sky at the moment of birth and follows the planetary transits moving through it. Natal placements, houses, angles, aspects, and current celestial weather are carried into personal charts and private reflective readings.

## Natal charts and ephemeris

- [Create a natal chart](${base}/#chart): Calculate a personal tropical birth chart from birth date, exact time when known, and a verified birthplace.
- [Ephemeris and chart method](${base}/method): How planetary longitudes, tropical signs, the Ascendant, houses, major aspects, time zones, coordinates, and unknown birth times are handled.

## Current sky

- [Daily horoscopes](${base}/horoscopes): Daily guidance for Aries through Pisces, shaped by planetary transits and the current celestial weather.
- [Weekly astrology readings](${base}/weekly-readings): The larger planetary patterns unfolding through the week and their relationship to the natal chart.

## Personal atlas

- [Personal astrology reports](${base}/reports): Private, evidence-linked natal-chart readings for vocation, purpose, renewal, and reflection.
- [Sample astrology reports](${base}/samples): Complete sample editions showing the structure, evidence references, and interpretive voice of Celestial Atlas readings.
- [Sample daily astrological reading](${base}/samples/daily-reading): A complete daily intelligence brief showing current transits to a natal chart, lunar phase, ranked themes, practical applications, and evidence traceability.
- [My Celestial Atlas](${base}/account): The private account library for saved natal charts, report generation, language preferences, and completed readings.

## Essays and guidance

- [Celestial Journal](${base}/journal): Astrological essays on natal symbolism, planetary cycles, transits, houses, aspects, and practical reflection.

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
