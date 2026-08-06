import type Stripe from "stripe";
import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { commerceFlags } from "@/lib/commerce/flags";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeClient, stripeWebhookSecret } from "@/lib/stripe";
import {
  stripeId,
  subscriptionPeriod,
  subscriptionPlanKey,
} from "@/lib/stripe/subscriptions";

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

async function subscriptionForEvent(event: Stripe.Event) {
  if (
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)
  )
    return event.data.object as Stripe.Subscription;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") return;
    const id = stripeId(session.subscription);
    if (id) return stripeClient().subscriptions.retrieve(id);
  }
  if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
  ) {
    const invoice = event.data.object as Stripe.Invoice;
    const id = stripeId(invoice.parent?.subscription_details?.subscription);
    if (id) return stripeClient().subscriptions.retrieve(id);
  }
}

async function reconcileSubscription(event: Stripe.Event) {
  const subscription = await subscriptionForEvent(event);
  if (!subscription) return;
  const userId = subscription.metadata.user_id;
  const planKey = subscriptionPlanKey(subscription);
  const customerId = stripeId(subscription.customer);
  if (!userId || !planKey || !customerId) return "subscription_mismatch";
  const period = subscriptionPeriod(subscription);
  const graceEndsAt =
    subscription.status === "past_due"
      ? new Date(event.created * 1000 + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const { data, error } = await createAdminClient().rpc(
    "process_subscription_event",
    {
      p_event_id: event.id,
      p_event_type: event.type,
      p_event_created: event.created,
      p_user_id: userId,
      p_plan_key: planKey,
      p_stripe_customer_id: customerId,
      p_stripe_subscription_id: subscription.id,
      p_status: subscription.status,
      p_current_period_start: period.start
        ? new Date(period.start * 1000).toISOString()
        : null,
      p_current_period_end: period.end
        ? new Date(period.end * 1000).toISOString()
        : null,
      p_cancel_at_period_end: subscription.cancel_at_period_end,
      p_grace_ends_at: graceEndsAt,
    },
  );
  if (error) throw error;
  return data;
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

  const flags = commerceFlags();
  if (!flags.webhookFulfilment)
    return json({ received: true, handled: false, disabled: true });

  if (flags.subscriptions) {
    const subscriptionResult = await reconcileSubscription(event);
    if (subscriptionResult)
      return json({ received: true, result: subscriptionResult });
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
