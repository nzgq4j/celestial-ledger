import { randomUUID } from "node:crypto";
import type { BirthInput } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";
import { calculateNatalChart } from "@/lib/chart";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/supabase/config";
import { defaultLocale, isLocaleTag } from "@/lib/i18n/config";
import {
  buildDailyReadingAnalysis,
  dailyReadingCacheKey,
} from "@/lib/daily-readings/calculation";
import { generateDailyReadingContent } from "@/lib/daily-readings/generated";
import {
  DAILY_READING_METHOD_VERSION,
  DAILY_READING_RULE_VERSION,
  generateDailyReadingRequestSchema,
} from "@/lib/daily-readings/domain";
import { resolveRegisteredDailyReadingEntitlement } from "@/lib/daily-readings/entitlement";
import { z } from "zod";
import { loadRecentContentContext } from "@/lib/content-similarity/recent-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return json({ error: "Sign in to view daily readings." }, 401);
  const { data, error } = await supabase
    .from("daily_readings")
    .select(
      "id,birth_profile_id,reading_date,observation_time_zone,locale,status,generated_at,expires_at",
    )
    .order("reading_date", { ascending: false })
    .limit(32);
  if (error) return json({ error: "Daily readings could not be loaded." }, 500);
  return json({ readings: data });
}

export async function POST(request: Request) {
  if (isDemoMode())
    return json(
      { error: "Daily reading generation is disabled in preview demo mode." },
      403,
    );
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string")
    return json({ error: "Sign in to generate your daily reading." }, 401);

  let reservationId: string | undefined;
  try {
    const input = generateDailyReadingRequestSchema.parse(
      await readLimitedJson(request, 1_024),
    );
    const admin = createAdminClient();
    const [{ data: profile }, { data: settings }] = await Promise.all([
      admin
        .from("birth_profiles")
        .select(
          "id,user_id,label,birth_date,birth_time,time_unknown,disambiguation,city,region,country,display_name,latitude,longitude,time_zone,updated_at,expires_at",
        )
        .eq("id", input.birthProfileId)
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("report_locale")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    const entitlement = resolveRegisteredDailyReadingEntitlement({
      userId,
      birthProfile: profile
        ? {
            id: profile.id,
            userId: profile.user_id,
            expiresAt: profile.expires_at,
          }
        : null,
    });
    if (!entitlement)
      return json(
        {
          error:
            "A registered account with an active owned birth profile is required.",
        },
        403,
      );
    const locale =
      input.locale ??
      (settings?.report_locale && isLocaleTag(settings.report_locale)
        ? settings.report_locale
        : defaultLocale);
    const cacheKey = dailyReadingCacheKey({
      userId,
      birthProfileId: profile!.id,
      birthProfileUpdatedAt: profile!.updated_at,
      readingDate: input.readingDate,
      observationTimeZone: profile!.time_zone,
      locale,
    });
    const { data: cached } = await admin
      .from("daily_readings")
      .select("id,status")
      .eq("user_id", userId)
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (cached)
      return json(
        { readingId: cached.id, status: cached.status, cacheStatus: "cached" },
        200,
      );

    const readingId = randomUUID();
    const { data: reservation, error: reservationError } = await admin.rpc(
      "reserve_daily_reading",
      {
        p_user_id: userId,
        p_birth_profile_id: profile!.id,
        p_cache_key: cacheKey,
        p_reading_id: readingId,
      },
    );
    if (reservationError)
      return json(
        {
          error:
            "Your reading allowance could not be checked. Please try again.",
        },
        503,
      );
    const access = z
      .object({
        status: z.string(),
        readingId: z.string().uuid().optional(),
        resetsAt: z.string().optional(),
      })
      .parse(reservation);
    if (access.status === "cached" && access.readingId)
      return json({
        readingId: access.readingId,
        status: "completed",
        cacheStatus: "cached",
      });
    if (access.status === "in_progress")
      return json(
        {
          error:
            "This reading is already being generated. Please wait a moment and try again.",
        },
        409,
      );
    if (access.status !== "reserved")
      return json(
        {
          error:
            access.status === "allowance_exhausted"
              ? "You have used your daily-reading allowance for this period. Your saved readings are still available in My library."
              : "This chart is not eligible for a daily reading on your current membership.",
          code: access.status,
          resetsAt: access.resetsAt,
        },
        403,
      );
    reservationId = readingId;

    const birthInput: BirthInput = {
      date: profile!.birth_date,
      time: profile!.birth_time ?? undefined,
      timeUnknown: profile!.time_unknown,
      disambiguation: profile!.disambiguation as BirthInput["disambiguation"],
      place: {
        id: profile!.id,
        city: profile!.city,
        region: profile!.region ?? undefined,
        country: profile!.country,
        displayName: profile!.display_name,
        latitude: profile!.latitude,
        longitude: profile!.longitude,
        timeZone: profile!.time_zone,
      },
    };
    const natalChart = await calculateNatalChart(birthInput);
    const analysis = buildDailyReadingAnalysis({
      natalChart,
      readingDate: input.readingDate,
      observationTimeZone: profile!.time_zone,
      locale,
    });
    const recentContext = await loadRecentContentContext({
      admin,
      userId,
      birthProfileId: profile!.id,
      currentKind: "daily",
      periodStart: input.readingDate,
      periodEnd: input.readingDate,
      locale,
    });
    const content = await generateDailyReadingContent({
      analysis,
      readingId,
      recentContext,
    });
    const { error: insertError } = await admin.from("daily_readings").insert({
      id: readingId,
      user_id: userId,
      birth_profile_id: profile!.id,
      reading_date: input.readingDate,
      observation_time_zone: profile!.time_zone,
      locale,
      capability: entitlement.capability,
      status: "completed",
      cache_key: cacheKey,
      schema_version: analysis.schemaVersion,
      method_version: DAILY_READING_METHOD_VERSION,
      rule_version: DAILY_READING_RULE_VERSION,
      calculation_version: analysis.method.calculationVersion,
      ephemeris_version: analysis.method.ephemerisVersion,
      analysis: analysis as unknown as Json,
      content: content as unknown as Json,
      evidence: analysis.evidence as unknown as Json,
    });
    if (insertError?.code === "23505") {
      const { data: raced } = await admin
        .from("daily_readings")
        .select("id,status")
        .eq("user_id", userId)
        .eq("cache_key", cacheKey)
        .single();
      if (raced)
        return json(
          { readingId: raced.id, status: raced.status, cacheStatus: "cached" },
          200,
        );
    }
    if (insertError)
      return json({ error: "The daily reading could not be saved." }, 500);
    return json(
      { readingId, status: "completed", cacheStatus: "generated" },
      201,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Daily reading generation failed",
        code:
          error instanceof z.ZodError
            ? "INVALID_REQUEST"
            : error instanceof Error
              ? "GENERATION_FAILED"
              : "UNKNOWN",
      }),
    );
    return json(
      {
        error:
          error instanceof z.ZodError
            ? "Choose a valid birth profile and reading date."
            : "The daily reading could not be generated.",
      },
      error instanceof z.ZodError ? 422 : 500,
    );
  } finally {
    if (reservationId) {
      // Completed reservations are retained; only failed attempts are released.
      // A crashed process also releases its slot automatically after the lease.
      const { error } = await createAdminClient().rpc("release_daily_reading", {
        p_user_id: userId,
        p_reading_id: reservationId,
      });
      if (error) console.error("Daily reading reservation release failed");
    }
  }
}
