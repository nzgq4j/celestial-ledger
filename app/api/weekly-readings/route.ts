import { randomUUID } from "node:crypto";
import { z } from "zod";
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
import { weeklyReadingFlags } from "@/lib/commerce/flags";
import { capabilityDecisionForUser } from "@/lib/entitlements/server";
import {
  assertIsoWeekStart,
  buildWeeklyReadingAnalysis,
  isoWeekStart,
  weeklyReadingCacheKey,
} from "@/lib/weekly-readings/calculation";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";
import {
  generateWeeklyReadingRequestSchema,
  WEEKLY_READING_CAPABILITY,
  WEEKLY_READING_CONTENT_VERSION,
  WEEKLY_READING_METHOD_VERSION,
  WEEKLY_READING_PROMPT_VERSION,
  WEEKLY_READING_RULE_VERSION,
} from "@/lib/weekly-readings/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return json({ error: "Sign in to view weekly readings." }, 401);
  const { data, error } = await supabase
    .from("weekly_readings")
    .select(
      "id,birth_profile_id,week_start_date,week_end_date,locale,status,generated_at,expires_at",
    )
    .eq("user_id", auth.claims.sub)
    .order("week_start_date", { ascending: false })
    .limit(24);
  if (error)
    return json({ error: "Weekly readings could not be loaded." }, 500);
  return json({ readings: data });
}

export async function POST(request: Request) {
  if (isDemoMode() || !weeklyReadingFlags().generationEnabled)
    return json(
      { error: "Weekly reading generation is not yet available." },
      503,
    );
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string")
    return json({ error: "Sign in to generate your weekly reading." }, 401);

  try {
    const input = generateWeeklyReadingRequestSchema.parse(
      await readLimitedJson(request, 1_024),
    );
    const admin = createAdminClient();
    const [{ data: primaryProfile }, { data: settings }] = await Promise.all([
      admin
        .from("birth_profiles")
        .select(
          "id,user_id,label,birth_date,birth_time,time_unknown,disambiguation,city,region,country,display_name,latitude,longitude,time_zone,updated_at,expires_at",
        )
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("report_locale")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    if (!primaryProfile || primaryProfile.id !== input.birthProfileId)
      return json(
        {
          error: "Weekly readings are available for your primary birth chart.",
        },
        403,
      );

    const decision = await capabilityDecisionForUser(
      userId,
      WEEKLY_READING_CAPABILITY,
    );
    if (!decision.allowed)
      return json(
        { error: "Weekly reading is included with Personal and Premium." },
        403,
      );
    const locale =
      input.locale ??
      (settings?.report_locale && isLocaleTag(settings.report_locale)
        ? settings.report_locale
        : defaultLocale);
    const weekStartDate = input.weekStartDate
      ? assertIsoWeekStart(input.weekStartDate)
      : isoWeekStart();
    const cacheKey = weeklyReadingCacheKey({
      userId,
      birthProfileId: primaryProfile.id,
      birthProfileUpdatedAt: primaryProfile.updated_at,
      weekStartDate,
      observationTimeZone: primaryProfile.time_zone,
      locale,
    });
    const { data: cached } = await admin
      .from("weekly_readings")
      .select("id,status")
      .eq("user_id", userId)
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (cached)
      return json({
        readingId: cached.id,
        status: cached.status,
        cacheStatus: "cached",
      });

    const birthInput: BirthInput = {
      date: primaryProfile.birth_date,
      time: primaryProfile.birth_time ?? undefined,
      timeUnknown: primaryProfile.time_unknown,
      disambiguation:
        primaryProfile.disambiguation as BirthInput["disambiguation"],
      place: {
        id: primaryProfile.id,
        city: primaryProfile.city,
        region: primaryProfile.region ?? undefined,
        country: primaryProfile.country,
        displayName: primaryProfile.display_name,
        latitude: primaryProfile.latitude,
        longitude: primaryProfile.longitude,
        timeZone: primaryProfile.time_zone,
      },
    };
    const natalChart = await calculateNatalChart(birthInput);
    const analysis = buildWeeklyReadingAnalysis({
      natalChart,
      weekStartDate,
      observationTimeZone: primaryProfile.time_zone,
      locale,
    });
    const readingId = randomUUID();
    const content = buildWeeklyReadingContent(analysis, readingId);
    const { error: insertError } = await admin.from("weekly_readings").insert({
      id: readingId,
      user_id: userId,
      birth_profile_id: primaryProfile.id,
      week_start_date: weekStartDate,
      observation_time_zone: primaryProfile.time_zone,
      locale,
      capability: WEEKLY_READING_CAPABILITY,
      status: "completed",
      cache_key: cacheKey,
      schema_version: analysis.schemaVersion,
      content_schema_version: WEEKLY_READING_CONTENT_VERSION,
      method_version: WEEKLY_READING_METHOD_VERSION,
      rule_version: WEEKLY_READING_RULE_VERSION,
      prompt_version: WEEKLY_READING_PROMPT_VERSION,
      calculation_version: analysis.method.calculationVersion,
      ephemeris_version: analysis.method.ephemerisVersion,
      analysis: analysis as unknown as Json,
      content: content as unknown as Json,
      evidence: analysis.evidence as unknown as Json,
    });
    if (insertError?.code === "23505") {
      const { data: raced } = await admin
        .from("weekly_readings")
        .select("id,status")
        .eq("user_id", userId)
        .eq("cache_key", cacheKey)
        .single();
      if (raced)
        return json({
          readingId: raced.id,
          status: raced.status,
          cacheStatus: "cached",
        });
    }
    if (insertError)
      return json({ error: "The weekly reading could not be saved." }, 500);

    const periodStart = `${weekStartDate}T00:00:00.000Z`;
    const periodEnd = new Date(
      Date.parse(periodStart) + 7 * 86_400_000,
    ).toISOString();
    const { data: consumed, error: consumeError } = await admin.rpc(
      "consume_capability",
      {
        p_user_id: userId,
        p_capability_key: WEEKLY_READING_CAPABILITY,
        p_quantity: 1,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_idempotency_key: `weekly:${cacheKey}`,
        p_source_reference: readingId,
      },
    );
    if (
      consumeError ||
      typeof consumed !== "string" ||
      !["consumed", "duplicate"].includes(consumed)
    ) {
      await admin
        .from("weekly_readings")
        .delete()
        .eq("id", readingId)
        .eq("user_id", userId);
      return json(
        {
          error:
            consumed === "allowance_exhausted"
              ? "Your weekly reading for this week has already been used."
              : "Weekly reading entitlement could not be confirmed.",
        },
        403,
      );
    }
    return json(
      { readingId, status: "completed", cacheStatus: "generated" },
      201,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Weekly reading generation failed",
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
          error instanceof z.ZodError ||
          (error instanceof Error && error.message === "INVALID_WEEK_START")
            ? "Choose a valid primary chart and ISO week."
            : "The weekly reading could not be generated.",
      },
      error instanceof z.ZodError ? 422 : 500,
    );
  }
}
