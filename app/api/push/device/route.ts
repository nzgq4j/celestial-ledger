import { createHash } from "node:crypto";
import { z } from "zod";
import { readLimitedJson } from "@/lib/api-security";
import { isAllowedPushEndpoint } from "@/lib/push/webpush";
import {
  appJson,
  appPreflight,
  authenticateRequest,
  bearerToken,
} from "@/lib/request-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** At most 16 upcoming insights per device (the app sends 14 days). */
const MAX_INSIGHTS = 16;
const DEVICE_KEY = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

const insight = z
  .object({
    at: z.string().datetime({ offset: true }),
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(400),
  })
  .strict();

const register = z
  .object({
    deviceKey: DEVICE_KEY,
    platform: z.enum(["android", "web"]),
    fcmToken: z
      .string()
      .min(32)
      .max(4096)
      .regex(/^[A-Za-z0-9:_-]+$/)
      .optional(),
    subscription: z
      .object({
        endpoint: z.string().url().max(2048),
        keys: z
          .object({
            p256dh: z.string().regex(/^[A-Za-z0-9_-]{80,120}$/),
            auth: z.string().regex(/^[A-Za-z0-9_-]{16,32}$/),
          })
          .strict(),
      })
      .strict()
      .optional(),
    locale: z.enum(["en", "es", "fr", "de"]),
    announcements: z.boolean(),
    insights: z.array(insight).max(MAX_INSIGHTS),
  })
  .strict()
  .refine(
    (v) =>
      v.platform === "android"
        ? !!v.fcmToken && !v.subscription
        : !!v.subscription &&
          !v.fcmToken &&
          isAllowedPushEndpoint(v.subscription.endpoint),
    { message: "Push address does not match the platform." },
  );

const remove = z.object({ deviceKey: DEVICE_KEY }).strict();

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export const OPTIONS = appPreflight;

/**
 * Registers or refreshes a device's push address and replaces its upcoming
 * daily insights (texts composed on the device; no birth data). Signing in is
 * optional; a signed-in device is linked to the account so deleting the
 * account removes it.
 */
export async function POST(request: Request) {
  const fail = (code: string, status: number) =>
    appJson(
      request,
      { code, error: "Notifications could not be set up." },
      status,
    );

  let body: unknown;
  try {
    body = await readLimitedJson(request, 24_576);
  } catch {
    return fail("INVALID_REQUEST", 400);
  }
  const parsed = register.safeParse(body);
  if (!parsed.success) return fail("INVALID_REQUEST", 422);
  const v = parsed.data;

  let userId: string | null = null;
  if (bearerToken(request)) {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return fail("SIGN_IN_REQUIRED", 401);
    userId = auth.user.userId;
  }

  const admin = createAdminClient();
  const now = new Date();
  const { data: device, error } = await admin
    .from("atlas_push_devices")
    .upsert(
      {
        device_key_hash: hashKey(v.deviceKey),
        platform: v.platform,
        fcm_token: v.platform === "android" ? v.fcmToken! : null,
        endpoint: v.platform === "web" ? v.subscription!.endpoint : null,
        p256dh: v.platform === "web" ? v.subscription!.keys.p256dh : null,
        auth_secret: v.platform === "web" ? v.subscription!.keys.auth : null,
        locale: v.locale,
        announcements: v.announcements,
        last_seen_at: now.toISOString(),
        ...(userId ? { user_id: userId } : {}),
      },
      { onConflict: "device_key_hash" },
    )
    .select("id")
    .single();
  if (error || !device) return fail("SAVE_FAILED", 500);

  // Replace the upcoming insights; past or duplicate times are dropped.
  await admin
    .from("atlas_push_messages")
    .delete()
    .eq("device_id", device.id)
    .is("sent_at", null);
  const seen = new Set<string>();
  const rows = v.insights
    .map((i) => ({ ...i, at: new Date(i.at) }))
    .filter(
      (i) => i.at > now && i.at.getTime() < now.getTime() + 20 * 86_400_000,
    )
    .filter(
      (i) => !seen.has(i.at.toISOString()) && seen.add(i.at.toISOString()),
    )
    .map((i) => ({
      device_id: device.id,
      send_at: i.at.toISOString(),
      title: i.title,
      body: i.body,
      url: "/today",
    }));
  if (rows.length) {
    const { error: insertError } = await admin
      .from("atlas_push_messages")
      .insert(rows);
    if (insertError) return fail("SAVE_FAILED", 500);
  }
  return appJson(request, { ok: true, scheduled: rows.length });
}

/** Turns notifications off for a device: removes its address and messages. */
export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await readLimitedJson(request, 1_024);
  } catch {
    return appJson(request, { code: "INVALID_REQUEST" }, 400);
  }
  const parsed = remove.safeParse(body);
  if (!parsed.success)
    return appJson(request, { code: "INVALID_REQUEST" }, 422);
  await createAdminClient()
    .from("atlas_push_devices")
    .delete()
    .eq("device_key_hash", hashKey(parsed.data.deviceKey));
  return appJson(request, { ok: true });
}
