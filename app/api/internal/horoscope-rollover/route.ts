import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { dailySkyFor, zodiacSlugs } from "@/lib/horoscopes/daily";
import { horoscopeUtcDateKey } from "@/lib/horoscopes/rollover";
import { localeTags } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const fingerprints = Object.fromEntries(
    localeTags.map((locale) => {
      const sky = dailySkyFor(generatedAt, locale);
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
    timeZone: "UTC",
    signs: zodiacSlugs.length,
    fingerprints,
  });
}

export const POST = GET;
