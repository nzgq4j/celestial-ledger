import { z } from "zod";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
  RequestPayloadError,
} from "@/lib/api-security";
import { birthInputSchema } from "@/lib/chart-request";
import { calculateNatalChart } from "@/lib/chart";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { HistoricalTimeError } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    birthInput: birthInputSchema,
  })
  .strict();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (authError || typeof userId !== "string")
    return json({ error: "Sign in to save this birth profile." }, 401);

  try {
    const { label, birthInput } = requestSchema.parse(
      await readLimitedJson(request, 10_240),
    );
    const chart = await calculateNatalChart(birthInput);
    const { data, error } = await supabase
      .from("birth_profiles")
      .insert({
        user_id: userId,
        label,
        birth_date: birthInput.date,
        birth_time: birthInput.time ?? null,
        time_unknown: birthInput.timeUnknown,
        disambiguation: birthInput.disambiguation ?? null,
        city: birthInput.place.city,
        region: birthInput.place.region ?? null,
        country: birthInput.place.country,
        display_name: birthInput.place.displayName,
        latitude: birthInput.place.latitude,
        longitude: birthInput.place.longitude,
        time_zone: birthInput.place.timeZone,
        chart: chart as unknown as Json,
        calculation_version: chart.calculation.calculationVersion,
      })
      .select("id, label, expires_at, created_at")
      .single();
    if (error) return json({ error: "The profile could not be saved." }, 500);
    return json({ birthProfile: data }, 201);
  } catch (error) {
    if (error instanceof RequestPayloadError)
      return json({ error: "The request body is invalid or too large." }, 400);
    if (error instanceof z.ZodError)
      return json({ error: "Invalid birth-profile information." }, 422);
    if (error instanceof HistoricalTimeError)
      return json({ error: error.message, code: error.code }, 422);
    return json({ error: "The profile could not be saved." }, 500);
  }
}
