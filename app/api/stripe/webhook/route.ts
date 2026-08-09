import type Stripe from "stripe";
import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { commerceFlags } from "@/lib/commerce/flags";
import {
  customerEmailForSubscription,
  passwordlessUserForEmail,
  sha256,
  SIGNIN_CLAIM_LIFETIME_SECONDS,
} from "@/lib/commerce/checkout-claims";
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
      // Validate the immutable catalogue subtotal. The total can be lower when
      // Stripe applies an approved promotion code, including a 100% discount.
      amount: session.amount_subtotal ?? session.amount_total ?? undefined,
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
  if (subscription.metadata.celestial_atlas_duplicate === "ignored")
    return "duplicate_subscription_ignored";
  let userId = subscription.metadata.user_id;
  const priceId = subscription.items.data[0]?.price.id;
  const admin = createAdminClient();
  const { data: cataloguePlan } = priceId
    ? await admin
        .from("commerce_plans")
        .select("plan_key")
        .eq("stripe_price_id", priceId)
        .eq("active", true)
        .maybeSingle()
    : { data: null };
  const planKey = cataloguePlan?.plan_key ?? subscriptionPlanKey(subscription);
  const customerId = stripeId(subscription.customer);
  if (!planKey || !customerId) return "subscription_mismatch";

  const pendingToken = subscription.metadata.pending_claim_token;
  let pendingClaim:
    { tokenHash: string; checkoutSessionId: string | null } | undefined;
  if (!userId && pendingToken) {
    const tokenHash = sha256(pendingToken);
    const { data: claim, error: claimError } = await admin
      .from("pending_chart_claims")
      .select(
        "requested_plan_key,display_name,expires_at,stripe_checkout_session_id",
      )
      .eq("claim_token_hash", tokenHash)
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claim || new Date(claim.expires_at).getTime() <= Date.now()) {
      console.error("[stripe-webhook] Anonymous subscription claim rejected", {
        reason: claim ? "expired" : "missing",
        eventId: event.id,
        subscriptionId: subscription.id,
      });
      return claim ? "anonymous_claim_expired" : "anonymous_claim_missing";
    }
    if (claim.requested_plan_key !== planKey)
      return "anonymous_claim_plan_mismatch";

    const customer = await customerEmailForSubscription(
      stripeClient(),
      subscription,
    );
    userId = await passwordlessUserForEmail(
      admin,
      customer.email,
      claim.display_name ?? customer.displayName,
    );
    const { data: profileId, error: attachError } = await admin.rpc(
      "attach_pending_chart_claim",
      {
        p_claim_token_hash: tokenHash,
        p_user_id: userId,
        p_stripe_customer_id: customer.customerId,
        p_stripe_subscription_id: subscription.id,
      },
    );
    if (attachError) throw attachError;
    if (!profileId) return "anonymous_claim_unavailable";
    pendingClaim = {
      tokenHash,
      checkoutSessionId: claim.stripe_checkout_session_id,
    };
  }
  if (!userId) return "subscription_mismatch";
  const period = subscriptionPeriod(subscription);
  const graceEndsAt =
    subscription.status === "past_due"
      ? new Date(event.created * 1000 + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const { data, error } = await admin.rpc("process_subscription_event", {
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
  });
  if (error) throw error;
  if (data !== "processed" && data !== "duplicate" && data !== "stale") {
    if (data === "customer_or_subscription_conflict") throw new Error(data);
    return data;
  }
  if (pendingClaim) {
    if (!pendingClaim.checkoutSessionId)
      throw new Error("anonymous_checkout_session_missing");
    const expiresAt = new Date(
      Date.now() + SIGNIN_CLAIM_LIFETIME_SECONDS * 1000,
    ).toISOString();
    const { error: signinError } = await admin
      .from("subscription_signin_claims")
      .upsert({
        checkout_session_hash: sha256(pendingClaim.checkoutSessionId),
        user_id: userId,
        expires_at: expiresAt,
      });
    if (signinError) throw signinError;
    await stripeClient().subscriptions.update(subscription.id, {
      metadata: {
        ...subscription.metadata,
        user_id: userId,
        pending_claim_token: "",
      },
    });
    const { error: deleteError } = await admin
      .from("pending_chart_claims")
      .delete()
      .eq("claim_token_hash", pendingClaim.tokenHash);
    if (deleteError) throw deleteError;
  }
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const payments = await stripeClient().invoicePayments.list({
      invoice: invoice.id,
      status: "paid",
      limit: 10,
    });
    const paymentIntentId = payments.data
      .map((payment) => stripeId(payment.payment.payment_intent))
      .find(Boolean);
    if (!paymentIntentId) return `${data}:payment_mismatch`;
    const { data: creditResult, error: creditError } =
      await createAdminClient().rpc("record_paid_subscription_invoice", {
        p_stripe_invoice_id: invoice.id,
        p_stripe_payment_intent_id: paymentIntentId,
        p_stripe_subscription_id: subscription.id,
        p_user_id: userId,
        p_paid_at: new Date(event.created * 1000).toISOString(),
      });
    if (creditError) throw creditError;
    return `${data}:${creditResult}`;
  }
  return data;
}

async function reverseRefundedSubscriptionInvoice(event: Stripe.Event) {
  if (event.type !== "charge.refunded") return;
  const charge = event.data.object as Stripe.Charge;
  if (!charge.refunded) return;
  const paymentIntentId = stripeId(charge.payment_intent);
  if (!paymentIntentId) return;
  const { data, error } = await createAdminClient().rpc(
    "reverse_paid_subscription_invoice",
    {
      p_stripe_payment_intent_id: paymentIntentId,
      p_reversed_at: new Date(event.created * 1000).toISOString(),
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
    const reversalResult = await reverseRefundedSubscriptionInvoice(event);
    if (reversalResult && reversalResult !== "not_subscription_invoice")
      return json({ received: true, result: reversalResult });
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
