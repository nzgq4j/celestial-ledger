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
import { buildDailyReadingContent } from "@/lib/daily-readings/content";
import {
  DAILY_READING_METHOD_VERSION,
  DAILY_READING_RULE_VERSION,
  generateDailyReadingRequestSchema,
} from "@/lib/daily-readings/domain";
import { resolveRegisteredDailyReadingEntitlement } from "@/lib/daily-readings/entitlement";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const readingId = randomUUID();
    const content = buildDailyReadingContent(analysis, readingId);
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
              ? error.message.slice(0, 80)
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
  }
}
