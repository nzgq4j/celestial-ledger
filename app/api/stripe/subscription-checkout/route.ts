import { z } from "zod";
import { commerceFlags } from "@/lib/commerce/flags";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";
import { ATLAS_PLAN_KEY, BILLING_INTERVALS } from "@/lib/membership/plans";
import { stripeClient } from "@/lib/stripe";
import {
  activeAtlasPrice,
  ATLAS_UNAVAILABLE_MESSAGE,
} from "@/lib/stripe/catalog";
import { subscriptionCheckoutSessionParams } from "@/lib/stripe/checkout";
import { atlasTrialEligible } from "@/lib/stripe/trial";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Atlas is the only sellable plan (database key `premium`); `personal` is retired.
const schema = z
  .object({
    planKey: z.literal(ATLAS_PLAN_KEY),
    interval: z.enum(BILLING_INTERVALS).default("month"),
  })
  .strict();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  const flags = commerceFlags();
  if (!flags.checkout || !flags.subscriptions)
    return json({ error: "Subscriptions are not currently available." }, 403);
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  const email = auth?.claims?.email;
  if (authError || typeof userId !== "string")
    return json({ error: "Sign in before choosing a membership." }, 401);
  if (typeof email !== "string" || !email.trim())
    return json({ error: "Your account email could not be verified." }, 422);

  const parsed = schema.safeParse(await readLimitedJson(request, 1_024));
  if (!parsed.success) return json({ error: "Invalid membership plan." }, 422);
  const admin = createAdminClient();
  const price = await activeAtlasPrice(admin, parsed.data.interval);
  if (!price) return json({ error: ATLAS_UNAVAILABLE_MESSAGE }, 409);

  const { data: current } = await admin
    .from("account_subscriptions")
    .select("id,status,provider")
    .eq("user_id", userId)
    .in("status", ["incomplete", "trialing", "active", "past_due", "paused"])
    .maybeSingle();
  if (current)
    return json(
      {
        error:
          current.provider === "google_play"
            ? "Your Atlas membership is managed in Google Play."
            : "Manage your existing Atlas membership from the billing portal.",
      },
      409,
    );

  let { data: customer } = await admin
    .from("billing_customers")
    .select("id,stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!customer) {
    const stripeCustomer = await stripeClient().customers.create({
      email,
      metadata: { application: "celestial_atlas", user_id: userId },
    });
    const result = await admin
      .from("billing_customers")
      .insert({ user_id: userId, stripe_customer_id: stripeCustomer.id })
      .select("id,stripe_customer_id")
      .single();
    if (result.error || !result.data)
      return json({ error: "Billing profile could not be initialized." }, 500);
    customer = result.data;
  } else {
    // Checkout reads contact information from an attached Customer. Keep the
    // billing record aligned with the authenticated account so upgrades never
    // open with an empty or unrelated email field.
    await stripeClient().customers.update(customer.stripe_customer_id, {
      email,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl)
    return json({ error: "Checkout redirects are not configured." }, 500);
  const metadata = {
    application: "celestial_atlas",
    user_id: userId,
    celestial_atlas_plan_key: price.planKey,
    celestial_atlas_billing_interval: price.interval,
  };
  const trialEligible = await atlasTrialEligible({
    admin,
    stripe: stripeClient(),
    userId,
    stripeCustomerId: customer.stripe_customer_id,
  });
  const session = await stripeClient().checkout.sessions.create(
    subscriptionCheckoutSessionParams({
      price,
      trialEligible,
      customer: customer.stripe_customer_id,
      metadata,
      automaticTax: flags.automaticTax,
      successUrl: `${appUrl}/account?checkout=subscription_return`,
      cancelUrl: `${appUrl}/membership?checkout=cancelled`,
    }),
  );
  if (!session.url)
    return json({ error: "Stripe did not return Checkout." }, 502);
  return json({ url: session.url });
}
