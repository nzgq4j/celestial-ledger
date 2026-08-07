import { describe, expect, it } from "vitest";
import fs from "node:fs";

const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
const subscriptionCheckout = fs.readFileSync(
  "app/api/stripe/subscription-checkout/route.ts",
  "utf8",
);
const fulfilment = fs.readFileSync(
  "supabase/migrations/20260802232350_stripe_fulfilment.sql",
  "utf8",
);
const entitlements = fs.readFileSync(
  "supabase/migrations/20260806212538_account_capability_entitlements.sql",
  "utf8",
);

describe("existing one-time Stripe purchase contract", () => {
  it("creates authenticated, same-origin checkout from server catalog prices", () => {
    expect(checkout).toContain("isSameOrigin(request)");
    expect(checkout).toContain("supabase.auth.getClaims()");
    expect(checkout).toContain('.from("report_prices")');
    expect(checkout).toContain('.eq("plan_key", planKey)');
    expect(checkout).toContain("price.stripe_price_id");
    expect(checkout).not.toContain("priceId: z.");
  });

  it("keeps report commerce disabled unless the server flag is enabled", () => {
    expect(checkout).toContain("commerceFlags()");
    expect(checkout).toContain("if (!flags.checkout)");
  });

  it("uses trusted plan pricing and safely recovers incomplete checkout attempts", () => {
    expect(checkout).toContain("effectivePlanKeyForUser(userId)");
    expect(checkout).toContain("checkout.sessions.expire");
    expect(checkout).toContain('update({ status: "failed" })');
    expect(checkout).not.toContain("unitAmount: z.");
  });

  it("redeems report credits atomically through a service-role RPC", () => {
    expect(checkout).toContain('"redeem_report_credit"');
    expect(entitlements).toContain(
      "perform pg_advisory_xact_lock(hashtextextended('report-credit:'",
    );
    expect(entitlements).toContain("for update of c");
    expect(entitlements).toContain(
      "quantity_remaining = quantity_remaining - 1",
    );
    expect(entitlements).toContain("to service_role");
  });

  it("does not grant access from the checkout return", () => {
    expect(checkout).toContain("/account?checkout=return");
    expect(checkout).not.toContain('.from("entitlements").insert');
  });

  it("verifies the raw webhook body before reconciliation", () => {
    expect(webhook).toContain("await request.text()");
    expect(webhook).toContain("webhooks.constructEvent");
    expect(webhook).toContain('request.headers.get("stripe-signature")');
    expect(webhook).not.toContain("await request.json()");
  });

  it("maps delayed payment, expiry, refund, and dispute events", () => {
    for (const event of [
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
      "charge.refunded",
      "charge.dispute.created",
    ])
      expect(webhook).toContain(event);
  });

  it("makes fulfilment idempotent and rejects purchase mismatches", () => {
    expect(fulfilment).toContain("return 'duplicate'");
    expect(fulfilment).toContain("purchase_mismatch");
    expect(fulfilment).toContain("v_order.user_id <> p_user_id");
    expect(fulfilment).toContain("v_order.amount_total <> p_amount_total");
    expect(fulfilment).toContain("v_order.currency <> lower(p_currency)");
    expect(fulfilment).toContain("on conflict (order_id) do nothing");
  });

  it("keeps the privileged reconciliation RPC service-role-only", () => {
    expect(fulfilment).toContain(
      "revoke all on function public.process_stripe_event",
    );
    expect(fulfilment).toContain("from public, anon, authenticated");
    expect(fulfilment).toContain("to service_role");
  });

  it("gives site administrators unlimited capability consumption", () => {
    expect(entitlements).toContain("from public.admin_roles");
    expect(entitlements).toContain("role = 'site_admin'");
    expect(entitlements).toContain("return 'consumed'");
  });

  it("seeds the approved member prices inactive until rollout", () => {
    for (const price of [
      "price_1U1iiCLq4GnupuQQMRwT9cDT",
      "price_1U1iiCLq4GnupuQQSai1Gjy4",
      "price_1U1iiCLq4GnupuQQlSJzplCn",
      "price_1U1iiKLq4GnupuQQ6EqcnPDK",
      "price_1U1iiKLq4GnupuQQ956LN1AZ",
      "price_1U1iiKLq4GnupuQQtk88MZ7B",
    ])
      expect(entitlements).toContain(price);
    expect(entitlements.match(/false, 1\)/g)).toHaveLength(6);
  });

  it("issues one Premium credit every third paid period with 12-month expiry", () => {
    expect(webhook).toContain('event.type === "invoice.paid"');
    expect(webhook).toContain('"record_paid_subscription_invoice"');
    expect(entitlements).toContain("v_paid_periods % 3 = 0");
    expect(entitlements).toContain("p_paid_at + interval '12 months'");
  });

  it("removes fully refunded subscription invoices from the credit counter", () => {
    expect(webhook).toContain("reverseRefundedSubscriptionInvoice");
    expect(webhook).toContain("if (!charge.refunded) return");
    expect(webhook).toContain('"reverse_paid_subscription_invoice"');
    expect(entitlements).toContain("and reversed_at is null");
    expect(entitlements).toContain("quantity_remaining = 0");
  });

  it("uses fixed membership prices and permits Stripe promotion codes", () => {
    expect(subscriptionCheckout).toContain('mode: "subscription"');
    expect(subscriptionCheckout).toContain("price: plan.stripe_price_id");
    expect(subscriptionCheckout).toContain("allow_promotion_codes: true");
    expect(checkout).toContain("allow_promotion_codes: true");
  });

  it("validates the catalogue subtotal when a promotion reduces the total", () => {
    expect(webhook).toContain(
      "session.amount_subtotal ?? session.amount_total ?? undefined",
    );
  });
});
