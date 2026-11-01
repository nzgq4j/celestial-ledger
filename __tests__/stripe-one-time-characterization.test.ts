import { describe, expect, it } from "vitest";
import fs from "node:fs";

const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
const subscriptionCheckout = fs.readFileSync(
  "app/api/stripe/subscription-checkout/route.ts",
  "utf8",
);
const billingPortal = fs.readFileSync("app/api/stripe/portal/route.ts", "utf8");
const account = fs.readFileSync("app/account/page.tsx", "utf8");
const accountReportStates = fs.readFileSync(
  "lib/account/report-states.ts",
  "utf8",
);
const reportQueue = fs.readFileSync("app/api/reports/route.ts", "utf8");
const fulfilment = fs.readFileSync(
  "supabase/migrations/20260802232350_stripe_fulfilment.sql",
  "utf8",
);
const entitlements = fs.readFileSync(
  "supabase/migrations/20260806212538_account_capability_entitlements.sql",
  "utf8",
);
const twoTier = fs.readFileSync(
  "supabase/migrations/20261101090000_two_tier_atlas_membership.sql",
  "utf8",
);
const subscriptionParams = fs.readFileSync("lib/stripe/checkout.ts", "utf8");
const stripeCatalog = fs.readFileSync("lib/stripe/catalog.ts", "utf8");

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

  it("issues one included Atlas report per membership year with 12-month expiry", () => {
    expect(webhook).toContain('event.type === "invoice.paid"');
    expect(webhook).toContain('"record_paid_subscription_invoice"');
    expect(twoTier).toContain(
      "public.grant_annual_report_credit(p_user_id, p_stripe_invoice_id, p_paid_at)",
    );
    expect(twoTier).toContain("p_granted_at + interval '12 months'");
    expect(twoTier).toContain(
      "('premium', 'report.standard_credit', 1, 'year'",
    );
  });

  it("removes fully refunded subscription invoices from the credit counter", () => {
    expect(webhook).toContain("reverseRefundedSubscriptionInvoice");
    expect(webhook).toContain("if (!charge.refunded) return");
    expect(webhook).toContain('"reverse_paid_subscription_invoice"');
    expect(entitlements).toContain("and reversed_at is null");
    expect(entitlements).toContain("quantity_remaining = 0");
  });

  it("uses fixed membership prices and permits Stripe promotion codes", () => {
    expect(subscriptionCheckout).toContain(
      "subscriptionCheckoutSessionParams(",
    );
    expect(subscriptionParams).toContain('mode: "subscription"');
    expect(subscriptionParams).toContain(
      "line_items: [{ price: input.price.stripePriceId, quantity: 1 }]",
    );
    expect(subscriptionParams).toContain("allow_promotion_codes: true");
    expect(checkout).toContain("allow_promotion_codes: true");
  });

  it("prefills Stripe Checkout from the authenticated account email", () => {
    expect(subscriptionCheckout).toContain("auth?.claims?.email");
    expect(subscriptionCheckout).toContain("customers.update");
    expect(subscriptionCheckout).toContain("email,");
    expect(billingPortal).toContain("auth?.claims?.email");
    expect(billingPortal).toContain("customers.update");
    expect(checkout).toContain("auth?.claims?.email");
    expect(checkout).toContain("customer_email: email");
  });

  it("validates the catalogue subtotal when a promotion reduces the total", () => {
    expect(webhook).toContain(
      "session.amount_subtotal ?? session.amount_total ?? undefined",
    );
  });

  it("gives Atlas one included report a year, then 20% off, with no blanket inclusion", () => {
    expect(accountReportStates).toContain('kind: "included_credit"');
    expect(accountReportStates).toContain("reportDiscountPercent");
    expect(accountReportStates).not.toContain("premium_included");
    expect(checkout).not.toContain("included with Premium");
    expect(checkout).toContain('.eq("plan_key", planKey)');
    expect(reportQueue).not.toContain('planKey !== "premium"');
    expect(reportQueue).toContain('.eq("role", "site_admin")');
    expect(twoTier).toContain(
      "update public.report_prices rp set active = true",
    );
    expect(twoTier).toContain("rp.unit_amount = round(f.unit_amount * 0.8)");
  });

  it("separates purchased but unused reports from the generated library", () => {
    // The account page renders report offers; the member data loader picks
    // out unused purchases and the offer card turns them into a generator.
    const memberData = fs.readFileSync("lib/account/member-data.ts", "utf8");
    const offers = fs.readFileSync(
      "components/account/ReportOffers.tsx",
      "utf8",
    );
    expect(account).toContain('id="reports"');
    expect(account).toContain("<ReportOffers");
    expect(memberData).toContain("linkedEntitlementIds");
    expect(memberData).toContain('item.status === "unused"');
    expect(memberData).toContain('item.status === "queued"');
    expect(offers).toContain("<GenerateReportButton");
    expect(accountReportStates).toContain('kind: "purchased_unused"');
    expect(offers).toContain('"entitlement" in state');
    expect(offers).toContain("entitlementId={entitlement?.id}");
  });

  it("resolves portal plan switches from the catalogue price", () => {
    expect(webhook).toContain("planKeyForStripePrice(admin, priceId)");
    expect(stripeCatalog).toContain('.from("commerce_plan_prices")');
    expect(stripeCatalog).toContain('.from("commerce_plans")');
    expect(stripeCatalog).toContain('.eq("stripe_price_id", priceId)');
  });
});
