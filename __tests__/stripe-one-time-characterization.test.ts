import { describe, expect, it } from "vitest";
import fs from "node:fs";

const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
const fulfilment = fs.readFileSync(
  "supabase/migrations/20260802232350_stripe_fulfilment.sql",
  "utf8",
);

describe("existing one-time Stripe purchase contract", () => {
  it("creates authenticated, same-origin checkout from server catalog prices", () => {
    expect(checkout).toContain("isSameOrigin(request)");
    expect(checkout).toContain("supabase.auth.getClaims()");
    expect(checkout).toContain('.from("products")');
    expect(checkout).toContain("product.stripe_price_id");
    expect(checkout).not.toContain("priceId: z.");
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
});
