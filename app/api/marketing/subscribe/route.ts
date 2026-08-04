import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin, readLimitedJson } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRecaptcha } from "@/lib/recaptcha";

const subscriptionSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
    consent: z.literal(true),
    consentVersion: z.literal("marketing-v1-2026-08-03"),
    website: z.string().max(0).optional(),
    recaptchaToken: z.string().max(4096).optional(),
  })
  .strict();

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "ORIGIN_REJECTED" }, { status: 403 });

  try {
    const parsed = subscriptionSchema.safeParse(
      await readLimitedJson(request, 4096),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "INVALID_SUBSCRIPTION" },
        { status: 400 },
      );

    const { firstName, email, consentVersion, recaptchaToken } = parsed.data;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!(await verifyRecaptcha(recaptchaToken, ip)))
      return NextResponse.json({ error: "CAPTCHA_REJECTED" }, { status: 403 });
    const { error } = await createAdminClient()
      .from("marketing_subscribers")
      .upsert(
        {
          first_name: firstName,
          email: email.toLowerCase(),
          status: "subscribed",
          consent_version: consentVersion,
          consent_source: "free_birth_chart",
          consented_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: "email" },
      );

    if (error) throw error;
    return NextResponse.json(
      { subscribed: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "SUBSCRIPTION_FAILED" }, { status: 500 });
  }
}
