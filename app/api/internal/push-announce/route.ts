import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PRIVATE_RESPONSE_HEADERS, readLimitedJson } from "@/lib/api-security";
import { deliver, pool, type PushDevice } from "@/lib/push/deliver";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Locale = "en" | "es" | "fr" | "de";

const perLocale = (max: number) =>
  z
    .object({
      en: z.string().trim().min(1).max(max),
      es: z.string().trim().min(1).max(max).optional(),
      fr: z.string().trim().min(1).max(max).optional(),
      de: z.string().trim().min(1).max(max).optional(),
    })
    .strict();

const schema = z
  .object({
    title: perLocale(120),
    body: perLocale(400),
    url: z
      .string()
      .regex(/^\/[A-Za-z0-9/_-]*$/)
      .max(100)
      .default("/today"),
  })
  .strict();

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

function authorized(request: Request) {
  const expected = process.env.PUSH_ADMIN_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!expected || expected.length < 32) return false;
  const a = Buffer.from(given),
    b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Sends an announcement to every device that has notifications on (owner
 * only: PUSH_ADMIN_SECRET bearer; see scripts/send-announcement.mjs). Each
 * device gets the text in its language, falling back to English.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized." }, 401);
  let body: unknown;
  try {
    body = await readLimitedJson(request, 16_384);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid announcement." }, 422);
  const { title, body: text, url } = parsed.data;

  const admin = createAdminClient();
  let sent = 0,
    failed = 0,
    removed = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("atlas_push_devices")
      .select("id,platform,fcm_token,endpoint,p256dh,auth_secret,locale")
      .eq("announcements", true)
      .order("id")
      .range(from, from + 999);
    if (error) return json({ error: "Could not read devices." }, 500);
    const devices = (data ?? []) as (PushDevice & { locale: Locale })[];
    if (!devices.length) break;
    const results = await pool(devices, 25, (d) =>
      deliver(d, {
        title: title[d.locale] ?? title.en,
        body: text[d.locale] ?? text.en,
        url,
        kind: "announcement",
      }),
    );
    sent += results.filter((r) => r === "sent").length;
    failed += results.filter((r) => r === "failed" || r === "retry").length;
    const gone = devices
      .filter((_, i) => results[i] === "gone")
      .map((d) => d.id);
    if (gone.length) {
      await admin.from("atlas_push_devices").delete().in("id", gone);
      removed += gone.length;
    }
    if (devices.length < 1000) break;
  }

  await admin
    .from("atlas_push_announcements")
    .insert({ title, body: text, url, sent_count: sent, failed_count: failed });
  return json({ sent, failed, removed });
}
