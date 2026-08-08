import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  randomClaimToken,
  sameCalculatedChart,
  sha256,
} from "@/lib/commerce/checkout-claims";

const checkoutRoute = readFileSync(
  "app/api/stripe/anonymous-subscription-checkout/route.ts",
  "utf8",
);
const webhookRoute = readFileSync("app/api/stripe/webhook/route.ts", "utf8");
const claimRoute = readFileSync(
  "app/api/stripe/subscription-claim-status/route.ts",
  "utf8",
);
const cleanupRoute = readFileSync(
  "app/api/internal/pending-chart-claims/route.ts",
  "utf8",
);
const reveal = readFileSync("components/HoroscopeApp.tsx", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260808113000_checkout_led_signup.sql",
  "utf8",
);

describe("checkout-led signup", () => {
  it("presents one Personal continuation with a dignified free path", () => {
    expect(reveal).toContain('planKey: "personal"');
    expect(reveal).toContain("interpretationHook(interpretation)");
    expect(reveal).toContain('href="/auth/create-account"');
    expect(reveal).toContain("pack.messages.chartReveal.freeAccount");
    expect(reveal).not.toContain('planKey: "premium"');
  });

  it("carries the revealed chart and reading into checkout without re-entry", () => {
    expect(reveal).toContain("email: checkoutEmail");
    expect(reveal).toContain("birthInput: chart.input");
    expect(reveal).toContain("chart,");
    expect(reveal).toContain("interpretation,");
    expect(reveal).toContain("interpretationModelVersion");
    expect(reveal).toContain("interpretationPromptVersion");
  });

  it("prefills the existing visitor email in Stripe Checkout", () => {
    expect(checkoutRoute).toContain("email: z.string().trim().email().max(254)");
    expect(checkoutRoute).toContain("customer_email: input.email");
  });

  it("uses opaque single-use claim tokens and stable server comparison", () => {
    const token = randomClaimToken();
    expect(token).toHaveLength(43);
    expect(sha256(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(sameCalculatedChart({ b: [2], a: 1 }, { a: 1, b: [2] })).toBe(true);
    expect(sameCalculatedChart({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("independently calculates the chart and keeps birth data out of Stripe metadata", () => {
    expect(checkoutRoute).toContain("calculateNatalChart");
    expect(checkoutRoute).toContain("sameCalculatedChart");
    const metadata =
      checkoutRoute.match(/const metadata = \{([\s\S]*?)\n\s*\};/)?.[1] ?? "";
    expect(metadata).toContain("pending_claim_token");
    expect(metadata).not.toMatch(/birth|latitude|longitude|chart/i);
  });

  it("keeps authenticated checkout separate and provisions anonymous customers in the webhook", () => {
    expect(checkoutRoute).toContain("anonymousCheckout");
    expect(webhookRoute).toContain("passwordlessUserForEmail");
    expect(webhookRoute).toContain("attach_pending_chart_claim");
    expect(webhookRoute).toContain("process_subscription_event");
    expect(webhookRoute.indexOf("process_subscription_event")).toBeLessThan(
      webhookRoute.indexOf('pending_claim_token: ""'),
    );
  });

  it("makes attachment idempotent, locked, expiring, and service-role only", () => {
    expect(migration).toContain("for update");
    expect(migration).toContain("if v_claim.birth_profile_id is not null");
    expect(migration).toContain("if v_claim.expires_at <= now()");
    expect(migration).toContain(
      "revoke all on function public.attach_pending_chart_claim",
    );
    expect(migration).toContain(
      "grant execute on function public.attach_pending_chart_claim",
    );
  });

  it("uses bounded confirmation polling and deletes expired claims", () => {
    expect(claimRoute).toContain("subscription_signin_claims");
    expect(claimRoute).toContain("verifyOtp");
    expect(cleanupRoute).toContain('lt("expires_at"');
    expect(
      readFileSync("components/SubscriptionClaimStatus.tsx", "utf8"),
    ).toContain("attempt < 9");
  });
});
