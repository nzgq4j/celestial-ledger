import type Stripe from "stripe";
import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeClient, stripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

type Reconcile = {
  action: "paid" | "expired" | "failed" | "refunded" | "disputed";
  orderId: string;
  userId?: string;
  reportType?: string;
  sessionId?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
};

async function orderIdForPaymentIntent(paymentIntentId: string) {
  const { data } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  return data?.id;
}

async function reconcileInput(
  event: Stripe.Event,
): Promise<Reconcile | undefined> {
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ].includes(event.type)
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id ?? session.client_reference_id;
    if (!orderId) return;
    const paid =
      event.type === "checkout.session.async_payment_succeeded" ||
      (event.type === "checkout.session.completed" &&
        session.payment_status === "paid");
    if (event.type === "checkout.session.completed" && !paid) return;
    return {
      action: paid
        ? "paid"
        : event.type === "checkout.session.expired"
          ? "expired"
          : "failed",
      orderId,
      userId: session.metadata?.user_id,
      reportType: session.metadata?.report_type,
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
      amount: session.amount_total ?? undefined,
      currency: session.currency ?? undefined,
    };
  }
  if (
    event.type === "charge.refunded" ||
    event.type === "charge.dispute.created"
  ) {
    let paymentIntentId: string | undefined;
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
    } else {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId =
        typeof dispute.charge === "string"
          ? dispute.charge
          : dispute.charge?.id;
      if (chargeId) {
        const charge = await stripeClient().charges.retrieve(chargeId);
        paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
      }
    }
    if (!paymentIntentId) return;
    const orderId = await orderIdForPaymentIntent(paymentIntentId);
    if (!orderId) return;
    return {
      action: event.type === "charge.refunded" ? "refunded" : "disputed",
      orderId,
      paymentIntentId,
    };
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing Stripe signature." }, 400);
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      stripeWebhookSecret(),
    );
  } catch {
    return json({ error: "Invalid Stripe signature." }, 400);
  }

  const input = await reconcileInput(event);
  if (!input) return json({ received: true, handled: false });
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("process_stripe_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_action: input.action,
    p_order_id: input.orderId,
    p_user_id: input.userId ?? null,
    p_report_type: input.reportType ?? null,
    p_checkout_session_id: input.sessionId ?? null,
    p_payment_intent_id: input.paymentIntentId ?? null,
    p_amount_total: input.amount ?? null,
    p_currency: input.currency ?? null,
  });
  if (error) return json({ error: "Webhook reconciliation failed." }, 500);
  if (data === "order_not_found" || data === "purchase_mismatch")
    return json({ error: "Webhook data did not match an order." }, 400);
  return json({ received: true, result: data });
}
