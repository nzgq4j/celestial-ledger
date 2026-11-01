import { z } from "zod";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
  RequestPayloadError,
} from "@/lib/api-security";
import { localeTags } from "@/lib/i18n/config";
import { isValidTimeZone } from "@/lib/push/schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

// FCM registration tokens are opaque base64url-ish strings (~150–200 chars).
const token = z
  .string()
  .min(32)
  .max(4096)
  .regex(/^[A-Za-z0-9_:.\-]+$/);
const alertTime = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const timezone = z
  .string()
  .min(1)
  .max(64)
  .refine(isValidTimeZone, "Unknown time zone");

const registerSchema = z
  .object({
    token,
    platform: z.literal("android").default("android"),
    locale: z.enum(localeTags).optional(),
    timezone: timezone.optional(),
    morningAlertEnabled: z.boolean().optional(),
    morningAlertLocalTime: alertTime.optional(),
  })
  .strict();
const updateSchema = z
  .object({
    token: token.optional(),
    morningAlertEnabled: z.boolean().optional(),
    morningAlertLocalTime: alertTime.optional(),
    timezone: timezone.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.morningAlertEnabled !== undefined ||
      value.morningAlertLocalTime !== undefined ||
      value.timezone !== undefined,
  );
const deleteSchema = z.object({ token }).strict();

async function currentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return !error && typeof userId === "string" ? userId : null;
}

async function body(request: Request) {
  try {
    return { value: await readLimitedJson(request, MAX_BODY_BYTES) };
  } catch (error) {
    if (error instanceof RequestPayloadError)
      return {
        response: json(
          { error: "Invalid request." },
          error.code === "REQUEST_TOO_LARGE" ? 413 : 400,
        ),
      };
    throw error;
  }
}

function preferences(row: {
  morning_alert_enabled: boolean;
  morning_alert_local_time: string;
}) {
  return {
    morningAlertEnabled: row.morning_alert_enabled,
    morningAlertLocalTime: row.morning_alert_local_time.slice(0, 5),
  };
}

/** The signed-in user's morning alert preference (any registered device). */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return json({ error: "Sign in required." }, 401);
  const { data, error } = await createAdminClient()
    .from("device_push_tokens")
    .select("morning_alert_enabled,morning_alert_local_time")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false })
    .limit(1);
  if (error) return json({ error: "Devices are unavailable." }, 503);
  const row = data?.[0];
  return json(
    row
      ? { registered: true, ...preferences(row) }
      : {
          registered: false,
          morningAlertEnabled: false,
          morningAlertLocalTime: "06:30",
        },
  );
}

/** Registers (or refreshes) this device's FCM token for the signed-in user. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  const userId = await currentUserId();
  if (!userId) return json({ error: "Sign in required." }, 401);
  const read = await body(request);
  if (read.response) return read.response;
  const parsed = registerSchema.safeParse(read.value);
  if (!parsed.success) return json({ error: "Invalid device." }, 422);
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("device_push_tokens")
    .select("id,user_id")
    .eq("token", input.token)
    .maybeSingle();
  if (lookupError) return json({ error: "Devices are unavailable." }, 503);

  const now = new Date().toISOString();
  const fields = {
    user_id: userId,
    platform: input.platform,
    last_seen_at: now,
    ...(input.locale ? { locale: input.locale } : {}),
    ...(input.timezone ? { timezone: input.timezone } : {}),
    ...(input.morningAlertEnabled !== undefined
      ? { morning_alert_enabled: input.morningAlertEnabled }
      : {}),
    ...(input.morningAlertLocalTime
      ? { morning_alert_local_time: input.morningAlertLocalTime }
      : {}),
  };
  const result =
    existing && existing.user_id === userId
      ? await admin
          .from("device_push_tokens")
          .update(fields)
          .eq("id", existing.id)
          .select("morning_alert_enabled,morning_alert_local_time")
          .single()
      : existing
        ? // The device signed in to another account: start fresh for this one.
          await admin
            .from("device_push_tokens")
            .update({
              morning_alert_enabled: true,
              morning_alert_local_time: "06:30",
              last_notified_on: null,
              ...fields,
            })
            .eq("id", existing.id)
            .select("morning_alert_enabled,morning_alert_local_time")
            .single()
        : await admin
            .from("device_push_tokens")
            .insert({ token: input.token, ...fields })
            .select("morning_alert_enabled,morning_alert_local_time")
            .single();
  if (result.error || !result.data)
    return json({ error: "Device could not be registered." }, 500);
  return json({ registered: true, ...preferences(result.data) });
}

/** Turns the morning alert on/off or changes its local time. */
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  const userId = await currentUserId();
  if (!userId) return json({ error: "Sign in required." }, 401);
  const read = await body(request);
  if (read.response) return read.response;
  const parsed = updateSchema.safeParse(read.value);
  if (!parsed.success) return json({ error: "Invalid preference." }, 422);
  const input = parsed.data;

  let query = createAdminClient()
    .from("device_push_tokens")
    .update({
      ...(input.morningAlertEnabled !== undefined
        ? { morning_alert_enabled: input.morningAlertEnabled }
        : {}),
      ...(input.morningAlertLocalTime
        ? { morning_alert_local_time: input.morningAlertLocalTime }
        : {}),
      ...(input.timezone ? { timezone: input.timezone } : {}),
    })
    .eq("user_id", userId);
  if (input.token) query = query.eq("token", input.token);
  const { data, error } = await query.select(
    "morning_alert_enabled,morning_alert_local_time",
  );
  if (error) return json({ error: "Preference could not be saved." }, 500);
  if (!data?.length) return json({ error: "No registered device." }, 404);
  return json({ registered: true, ...preferences(data[0]) });
}

/**
 * Unregisters a device. Signed in: only the user's own token. Signed out
 * (after sign-out on the device): possession of the FCM token, which only
 * that app install holds, is the proof of ownership.
 */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  const read = await body(request);
  if (read.response) return read.response;
  const parsed = deleteSchema.safeParse(read.value);
  if (!parsed.success) return json({ error: "Invalid device." }, 422);
  const userId = await currentUserId();
  let query = createAdminClient()
    .from("device_push_tokens")
    .delete()
    .eq("token", parsed.data.token);
  if (userId) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) return json({ error: "Device could not be removed." }, 500);
  return json({ registered: false });
}
