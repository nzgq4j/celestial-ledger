import { z } from "zod";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";
import { sendContactNotification } from "@/lib/contact-email";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const schema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    reason: z.enum([
      "general",
      "account",
      "billing",
      "privacy",
      "technical",
      "partnership",
      "other",
    ]),
    message: z.string().trim().min(10).max(5000),
    website: z.string().max(0).optional(),
    recaptchaToken: z.string().max(4096).optional(),
  })
  .strict();

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "ORIGIN_REJECTED" }, 403);
  try {
    const parsed = schema.safeParse(await readLimitedJson(request, 8_192));
    if (!parsed.success) return json({ error: "INVALID_MESSAGE" }, 400);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (
      !(await verifyRecaptcha(parsed.data.recaptchaToken, ip, "contact_submit"))
    )
      return json({ error: "CAPTCHA_REJECTED" }, 403);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contact_messages")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        reason: parsed.data.reason,
        message: parsed.data.message,
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("CONTACT_INSERT_FAILED");

    const delivery = await sendContactNotification({
      id: data.id,
      ...parsed.data,
    }).catch(() => ({ status: "failed" as const }));
    await admin
      .from("contact_messages")
      .update({
        notification_status: delivery.status,
        notification_id: "id" in delivery ? delivery.id : null,
        notification_attempted_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return json({ submitted: true }, 201);
  } catch {
    return json({ error: "CONTACT_FAILED" }, 500);
  }
}
