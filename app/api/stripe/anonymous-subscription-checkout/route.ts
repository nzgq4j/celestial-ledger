import { z } from "zod";
import { calculateNatalChart } from "@/lib/chart";
import { birthInputSchema, natalChartSchema } from "@/lib/chart-request";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
  RequestPayloadError,
} from "@/lib/api-security";
import { commerceFlags } from "@/lib/commerce/flags";
import {
  PENDING_CLAIM_LIFETIME_SECONDS,
  randomClaimToken,
  requestFingerprint,
  sameCalculatedChart,
  sha256,
} from "@/lib/commerce/checkout-claims";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    planKey: z.enum(["personal", "premium"]),
    displayName: z.string().trim().min(2).max(50).optional(),
    email: z.string().trim().email().max(254),
    birthInput: birthInputSchema,
    chart: natalChartSchema,
    interpretation: z.string().trim().min(200).max(60_000),
    interpretationModelVersion: z.string().trim().min(1).max(100),
    interpretationPromptVersion: z.string().trim().min(1).max(100),
    recaptchaToken: z.string().max(4096).optional(),
  })
  .strict();

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  const flags = commerceFlags();
  if (!flags.checkout || !flags.subscriptions || !flags.anonymousCheckout)
    return json(
      { error: "Checkout-led signup is not currently available." },
      403,
    );
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await readLimitedJson(request, 128_000));
  } catch (error) {
    if (error instanceof RequestPayloadError)
      return json(
        { error: "Invalid checkout request." },
        error.code === "REQUEST_TOO_LARGE" ? 413 : 400,
      );
    return json({ error: "A complete, valid chart is required." }, 422);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (
    !(await verifyRecaptcha(
      input.recaptchaToken,
      ip,
      "anonymous_subscription_checkout",
    ))
  )
    return json({ error: "Checkout verification failed." }, 403);

  let fingerprint: string;
  try {
    fingerprint = requestFingerprint(request);
  } catch {
    return json({ error: "Checkout protection is not configured." }, 503);
  }

  const admin = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("pending_chart_claims")
    .select("claim_token_hash", { count: "exact", head: true })
    .eq("request_fingerprint_hash", fingerprint)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= 5)
    return json({ error: "Too many checkout attempts. Try again later." }, 429);

  const recalculated = await calculateNatalChart(input.birthInput);
  if (!sameCalculatedChart(input.chart, recalculated))
    return json({ error: "The displayed chart could not be verified." }, 422);

  const { data: plan } = await admin
    .from("commerce_plans")
    .select("plan_key,stripe_price_id,active")
    .eq("plan_key", input.planKey)
    .single();
  if (!plan?.active || !plan.stripe_price_id)
    return json({ error: "This membership is not currently available." }, 409);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl)
    return json({ error: "Checkout redirects are not configured." }, 500);

  const token = randomClaimToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(
    Date.now() + PENDING_CLAIM_LIFETIME_SECONDS * 1000,
  );
  const { error: pendingError } = await admin
    .from("pending_chart_claims")
    .insert({
      claim_token_hash: tokenHash,
      requested_plan_key: plan.plan_key,
      display_name: input.displayName ?? null,
      birth_input: input.birthInput as unknown as Json,
      chart: recalculated as unknown as Json,
      natal_reading: input.interpretation,
      natal_reading_model_version: input.interpretationModelVersion,
      natal_reading_prompt_version: input.interpretationPromptVersion,
      request_fingerprint_hash: fingerprint,
      expires_at: expiresAt.toISOString(),
    });
  if (pendingError)
    return json({ error: "Checkout could not be initialized." }, 500);

  const metadata = {
    application: "celestial_atlas",
    celestial_atlas_plan_key: plan.plan_key,
    pending_claim_token: token,
  };
  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      customer_email: input.email,
      payment_method_collection: "if_required",
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
      automatic_tax: { enabled: flags.automaticTax },
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      success_url: `${appUrl}/auth/claim-subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#chart`,
    });
    if (!session.url) throw new Error("stripe_checkout_url_missing");
    const { error: updateError } = await admin
      .from("pending_chart_claims")
      .update({ stripe_checkout_session_id: session.id })
      .eq("claim_token_hash", tokenHash);
    if (updateError) {
      await stripeClient().checkout.sessions.expire(session.id);
      throw updateError;
    }
    return json({ url: session.url });
  } catch {
    await admin
      .from("pending_chart_claims")
      .delete()
      .eq("claim_token_hash", tokenHash);
    return json({ error: "Stripe Checkout could not be opened." }, 502);
  }
}
