import { z } from "zod";
import { commerceFlags } from "@/lib/commerce/flags";
import { readLimitedJson } from "@/lib/api-security";
import { ATLAS_APP_PRICE, isAtlasAppPrice } from "@/lib/membership/app-price";
import { appJson, appPreflight, authenticateRequest } from "@/lib/request-auth";
import { stripeClient } from "@/lib/stripe";
import { activeAtlasPrice } from "@/lib/stripe/catalog";
import { subscriptionCheckoutSessionParams } from "@/lib/stripe/checkout";
import { ensureStripeCustomer } from "@/lib/stripe/customer";
import { atlasTrialEligible } from "@/lib/stripe/trial";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ plan: z.literal("year") }).strict();

export const OPTIONS = appPreflight;

/** Starts Stripe Checkout for Atlas+ from the app. Returns { url }. */
export async function POST(request: Request) {
  const fail = (code: string, error: string, status: number) =>
    appJson(request, { code, error }, status);

  const flags = commerceFlags();
  if (!flags.checkout || !flags.subscriptions)
    return fail("UNAVAILABLE", "Atlas+ is not available right now.", 403);

  const auth = await authenticateRequest(request);
  if (!auth.ok)
    return fail(auth.code.toUpperCase(), "Sign in first.", auth.status);
  const { userId, email } = auth.user;
  if (!email)
    return fail(
      "EMAIL_UNVERIFIED",
      "Your account email could not be verified.",
      422,
    );

  let body: unknown;
  try {
    body = await readLimitedJson(request, 1_024);
  } catch {
    return fail("INVALID_REQUEST", "Invalid request.", 400);
  }
  if (!schema.safeParse(body).success)
    return fail("INVALID_REQUEST", "Invalid plan.", 422);

  const admin = createAdminClient();
  const price = await activeAtlasPrice(admin, ATLAS_APP_PRICE.interval);
  if (!price || !isAtlasAppPrice(price))
    return fail("PRICE_NOT_READY", "Atlas+ is not available yet.", 409);

  const { data: current } = await admin
    .from("account_subscriptions")
    .select("provider")
    .eq("user_id", userId)
    .in("status", ["incomplete", "trialing", "active", "past_due", "paused"])
    .maybeSingle();
  if (current)
    return fail(
      current.provider === "google_play"
        ? "MANAGED_IN_GOOGLE_PLAY"
        : "ALREADY_SUBSCRIBED",
      current.provider === "google_play"
        ? "Your Atlas+ membership is managed in Google Play."
        : "You already have Atlas+.",
      409,
    );

  const stripe = stripeClient();
  const customer = await ensureStripeCustomer(admin, stripe, userId, email);
  if (!customer)
    return fail("BILLING_PROFILE_FAILED", "Billing could not be started.", 500);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl)
    return fail("NOT_CONFIGURED", "Checkout is not configured.", 500);

  const session = await stripe.checkout.sessions.create(
    subscriptionCheckoutSessionParams({
      price,
      trialEligible: await atlasTrialEligible({
        admin,
        stripe,
        userId,
        stripeCustomerId: customer.stripe_customer_id,
      }),
      customer: customer.stripe_customer_id,
      metadata: {
        application: "celestial_atlas",
        user_id: userId,
        celestial_atlas_plan_key: price.planKey,
        celestial_atlas_billing_interval: price.interval,
      },
      automaticTax: flags.automaticTax,
      successUrl: `${appUrl}/profile?checkout=complete`,
      cancelUrl: `${appUrl}/profile`,
    }),
  );
  if (!session.url)
    return fail("CHECKOUT_FAILED", "Checkout could not be opened.", 502);
  return appJson(request, { url: session.url });
}
