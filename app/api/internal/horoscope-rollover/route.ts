import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { zodiacSlugs } from "@/lib/horoscopes/daily";
import { horoscopeUtcDateKey } from "@/lib/horoscopes/rollover";
import { localeTags } from "@/lib/i18n/config";
import {
  publishGeneratedHoroscopes,
  publishedDailySky,
} from "@/lib/horoscopes/generated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const responseHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  ) {
    return json({ error: "Unauthorized." }, 401);
  }

  const generatedAt = new Date();
  const date = horoscopeUtcDateKey(generatedAt);
  const force = new URL(request.url).searchParams.get("force") === "true";
  try {
    await publishGeneratedHoroscopes(generatedAt, { force });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Daily horoscope edition generation failed",
        date,
        code:
          error instanceof Error
            ? error.message.slice(0, 120)
            : "HOROSCOPE_GENERATION_FAILED",
      }),
    );
    return json(
      {
        ok: false,
        date,
        retryScheduled: true,
        error: "The new horoscope edition could not be published.",
      },
      500,
    );
  }
  const fingerprints = Object.fromEntries(
    await Promise.all(
      localeTags.map(async (locale) => {
        const sky = await publishedDailySky(generatedAt, locale);
        const fingerprint = createHash("sha256")
          .update(
            JSON.stringify(
              sky.horoscopes.map((reading) => ({
                slug: reading.slug,
                overview: reading.overview,
                bottomLine: reading.bottomLine,
                relationships: reading.relationships,
                business: reading.business,
                money: reading.money,
                opportunity: reading.opportunity,
                question: reading.question,
              })),
            ),
          )
          .digest("hex")
          .slice(0, 16);
        return [locale, fingerprint];
      }),
    ),
  );

  revalidatePath("/horoscopes");
  for (const slug of zodiacSlugs) {
    revalidatePath(`/horoscopes/${slug}`);
    revalidatePath(`/horoscopes/${slug}/opengraph-image`);
    revalidatePath(`/horoscopes/${slug}/pinterest-image`);
  }

  return json({
    ok: true,
    date,
    generatedAt: generatedAt.toISOString(),
    forced: force,
    timeZone: "UTC",
    signs: zodiacSlugs.length,
    fingerprints,
  });
}

export const POST = GET;
