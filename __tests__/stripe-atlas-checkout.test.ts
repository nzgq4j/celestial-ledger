import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkoutPaymentMethodConfiguration } from "@/lib/stripe";
import { subscriptionCheckoutSessionParams } from "@/lib/stripe/checkout";
import { trialEligibleFromHistory } from "@/lib/stripe/trial";

const read = (path: string) => readFileSync(path, "utf8");
const checkoutRoutes = [
  "app/api/stripe/subscription-checkout/route.ts",
  "app/api/stripe/anonymous-subscription-checkout/route.ts",
  "app/api/checkout/route.ts",
  "lib/stripe/checkout.ts",
].map(read);

const price = { stripePriceId: "price_AtlasMonthly", trialDays: 7 };
const signedIn = {
  price,
  customer: "cus_test",
  metadata: { application: "celestial_atlas" },
  automaticTax: false,
  successUrl: "https://example.test/account",
  cancelUrl: "https://example.test/membership",
} as const;
const anonymous = {
  price,
  customerEmail: "reader@example.test",
  expiresAt: 1_900_000_000,
  metadata: { application: "celestial_atlas" },
  automaticTax: false,
  successUrl: "https://example.test/claim",
  cancelUrl: "https://example.test/#chart",
} as const;

afterEach(() => vi.unstubAllEnvs());

describe("Atlas checkout sessions", () => {
  it("never pins payment_method_types, so Google Pay can appear", () => {
    for (const source of checkoutRoutes)
      expect(source).not.toMatch(/payment_method_types\s*:/);
    const params = subscriptionCheckoutSessionParams({
      ...signedIn,
      trialEligible: true,
    });
    expect(params).not.toHaveProperty("payment_method_types");
    expect(params).not.toHaveProperty("payment_method_configuration");
  });

  it("uses the payment method configuration when the operator sets one", () => {
    vi.stubEnv("STRIPE_PAYMENT_METHOD_CONFIGURATION", "pmc_1AtlasGooglePay");
    const params = subscriptionCheckoutSessionParams({
      ...signedIn,
      trialEligible: false,
    });
    expect(params.payment_method_configuration).toBe("pmc_1AtlasGooglePay");
    expect(params).not.toHaveProperty("payment_method_types");
    expect(checkoutPaymentMethodConfiguration()).toEqual({
      payment_method_configuration: "pmc_1AtlasGooglePay",
    });
    expect(read("app/api/checkout/route.ts")).toContain(
      "...checkoutPaymentMethodConfiguration()",
    );
  });

  it("rejects a malformed configuration ID instead of sending it to Stripe", () => {
    vi.stubEnv("STRIPE_PAYMENT_METHOD_CONFIGURATION", "card,google_pay");
    expect(() => checkoutPaymentMethodConfiguration()).toThrow(/pmc_/);
    vi.stubEnv("STRIPE_PAYMENT_METHOD_CONFIGURATION", "  ");
    expect(checkoutPaymentMethodConfiguration()).toEqual({});
  });

  it("adds the price's trial only for eligible readers", () => {
    const trial = subscriptionCheckoutSessionParams({
      ...signedIn,
      trialEligible: true,
    });
    expect(trial.subscription_data).toMatchObject({
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
    });
    const returning = subscriptionCheckoutSessionParams({
      ...signedIn,
      trialEligible: false,
    });
    expect(returning.subscription_data).not.toHaveProperty("trial_period_days");
    const noTrialPrice = subscriptionCheckoutSessionParams({
      ...signedIn,
      price: { ...price, trialDays: 0 },
      trialEligible: true,
    });
    expect(noTrialPrice.subscription_data).not.toHaveProperty(
      "trial_period_days",
    );
  });

  it("keeps the checkout-led signup session shape", () => {
    const params = subscriptionCheckoutSessionParams({
      ...anonymous,
      trialEligible: false,
    });
    expect(params).toMatchObject({
      mode: "subscription",
      customer_email: "reader@example.test",
      expires_at: 1_900_000_000,
      payment_method_collection: "if_required",
      allow_promotion_codes: true,
      line_items: [{ price: "price_AtlasMonthly", quantity: 1 }],
    });
    expect(params).not.toHaveProperty("customer");
    expect(
      subscriptionCheckoutSessionParams({ ...anonymous, trialEligible: true })
        .payment_method_collection,
    ).toBe("always");
  });
});

describe("Atlas trial eligibility", () => {
  it("allows a trial only with no earlier subscription or trial", () => {
    expect(
      trialEligibleFromHistory({
        accountStatuses: [],
        stripeSubscriptions: [],
      }),
    ).toBe(true);
    expect(
      trialEligibleFromHistory({
        accountStatuses: ["incomplete_expired"],
        stripeSubscriptions: [{ status: "incomplete", trial_start: null }],
      }),
    ).toBe(true);
    for (const status of ["canceled", "active", "trialing", "past_due"])
      expect(
        trialEligibleFromHistory({
          accountStatuses: [status],
          stripeSubscriptions: [],
        }),
      ).toBe(false);
    expect(
      trialEligibleFromHistory({
        accountStatuses: [],
        stripeSubscriptions: [{ status: "canceled", trial_start: null }],
      }),
    ).toBe(false);
    expect(
      trialEligibleFromHistory({
        accountStatuses: [],
        stripeSubscriptions: [
          { status: "incomplete_expired", trial_start: 1_700_000_000 },
        ],
      }),
    ).toBe(false);
  });
});

describe("Atlas subscription routes", () => {
  const subscriptionCheckout = read(
    "app/api/stripe/subscription-checkout/route.ts",
  );
  const anonymousCheckout = read(
    "app/api/stripe/anonymous-subscription-checkout/route.ts",
  );
  const webhook = read("app/api/stripe/webhook/route.ts");
  const catalog = read("lib/stripe/catalog.ts");

  it("sells only Atlas, by interval, from active commerce_plan_prices", () => {
    for (const route of [subscriptionCheckout, anonymousCheckout]) {
      expect(route).toContain("z.literal(ATLAS_PLAN_KEY)");
      expect(route).toContain("z.enum(BILLING_INTERVALS)");
      expect(route).not.toContain('"personal"');
      expect(route).toContain("activeAtlasPrice(admin");
      expect(route).toContain("ATLAS_UNAVAILABLE_MESSAGE");
      expect(route).toContain("atlasTrialEligible(");
      expect(route).not.toMatch(/Premium/);
    }
    expect(catalog).toContain('.from("commerce_plan_prices")');
    expect(catalog).toContain('.eq("active", true)');
    expect(catalog).toMatch(
      /ATLAS_UNAVAILABLE_MESSAGE\s*=\s*"Atlas membership is not yet available\."/,
    );
  });

  it("maps Stripe prices to plans through commerce_plan_prices, then the legacy price", () => {
    expect(webhook).toContain("planKeyForStripePrice(admin, priceId)");
    const priceLookup = catalog.indexOf(
      '.from("commerce_plan_prices")',
      catalog.indexOf("planKeyForStripePrice"),
    );
    const legacyLookup = catalog.indexOf(
      '.from("commerce_plans")',
      priceLookup,
    );
    expect(priceLookup).toBeGreaterThan(0);
    expect(legacyLookup).toBeGreaterThan(priceLookup);
  });

  it("does not issue the included report from a $0 trial invoice", () => {
    expect(webhook).toContain("if (!invoice.amount_paid)");
    expect(webhook.indexOf("if (!invoice.amount_paid)")).toBeLessThan(
      webhook.indexOf('"record_paid_subscription_invoice"'),
    );
  });

  it("sends Google Play members to Google Play to manage Atlas", () => {
    const portal = read("app/api/stripe/portal/route.ts");
    expect(portal).toContain('current?.provider === "google_play"');
    expect(portal).toContain("GOOGLE_PLAY_SUBSCRIPTIONS_URL");
    expect(read("lib/membership/plans.ts")).toContain(
      '"https://play.google.com/store/account/subscriptions"',
    );
  });
});
