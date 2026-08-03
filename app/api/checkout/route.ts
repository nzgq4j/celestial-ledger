import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeClient } from "@/lib/stripe";
import Stripe from "stripe";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z
  .object({
    reportType: z.enum([
      "career_purpose",
      "recovery_reflection",
      "future_trends",
    ]),
  })
  .strict();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  if (isDemoMode())
    return json({ error: "Checkout is disabled in preview demo mode." }, 403);
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (authError || typeof userId !== "string")
    return json({ error: "Sign in before purchasing a report." }, 401);

  try {
    const { reportType } = schema.parse(await readLimitedJson(request, 1_024));
    if (
      !(["career_purpose", "recovery_reflection"] as const).includes(
        reportType as "career_purpose" | "recovery_reflection",
      )
    )
      return json(
        { error: "This report is not available for purchase yet." },
        409,
      );
    const admin = createAdminClient();
    const { count: birthProfileCount } = await admin
      .from("birth_profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString());
    if (!birthProfileCount)
      return json(
        {
          error:
            "Create and save your natal chart before purchasing this report.",
          actionUrl: "/#chart",
        },
        409,
      );
    const { data: product } = await admin
      .from("products")
      .select("report_type, stripe_price_id, unit_amount, currency, active")
      .eq("report_type", reportType)
      .single();
    if (
      !product?.active ||
      !product.stripe_price_id ||
      product.unit_amount === null ||
      !product.currency
    )
      return json(
        { error: "This report is not currently available for purchase." },
        409,
      );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl)
      return json({ error: "Checkout redirects are not configured." }, 500);

    const { data: pendingOrder } = await admin
      .from("orders")
      .select("id, stripe_checkout_session_id")
      .eq("user_id", userId)
      .eq("report_type", reportType)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingOrder?.stripe_checkout_session_id) {
      const existingSession = await stripeClient().checkout.sessions.retrieve(
        pendingOrder.stripe_checkout_session_id,
      );
      if (existingSession.status === "open" && existingSession.url)
        return json({ url: existingSession.url, reused: true });
      if (existingSession.status === "expired")
        await admin
          .from("orders")
          .update({ status: "expired" })
          .eq("id", pendingOrder.id)
          .eq("status", "pending");
    }

    const idempotencyKey = randomUUID();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        report_type: reportType,
        idempotency_key: idempotencyKey,
        amount_total: product.unit_amount,
        currency: product.currency,
      })
      .select("id")
      .single();
    if (orderError || !order)
      return json({ error: "Checkout could not be initialized." }, 500);

    try {
      const metadata = {
        application: "celestial_atlas",
        order_id: order.id,
        user_id: userId,
        report_type: reportType,
      };
      const session = await stripeClient().checkout.sessions.create(
        {
          mode: "payment",
          line_items: [{ price: product.stripe_price_id, quantity: 1 }],
          client_reference_id: order.id,
          metadata,
          payment_intent_data: { metadata },
          success_url: `${appUrl}/account?checkout=return`,
          cancel_url: `${appUrl}/account?checkout=cancelled`,
        },
        { idempotencyKey: order.id },
      );
      if (!session.url)
        throw new Error("Stripe did not return a Checkout URL.");
      await admin
        .from("orders")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", order.id);
      return json({ url: session.url });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error("[checkout] Stripe session creation failed", {
          type: error.type,
          code: error.code,
          statusCode: error.statusCode,
          requestId: error.requestId,
        });
      } else {
        console.error("[checkout] Session creation failed", {
          type: error instanceof Error ? error.name : "UnknownError",
        });
      }
      await admin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
      return json({ error: "Stripe Checkout could not be created." }, 502);
    }
  } catch (error) {
    if (error instanceof z.ZodError)
      return json({ error: "Invalid report type." }, 422);
    return json({ error: "Checkout could not be initialized." }, 500);
  }
}
