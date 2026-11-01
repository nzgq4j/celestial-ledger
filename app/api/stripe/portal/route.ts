import { commerceFlags } from "@/lib/commerce/flags";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { GOOGLE_PLAY_SUBSCRIPTIONS_URL } from "@/lib/membership/plans";
import { stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  if (!commerceFlags().subscriptions)
    return json(
      { error: "Subscription management is not currently available." },
      403,
    );
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  const email = auth?.claims?.email;
  if (error || typeof userId !== "string")
    return json({ error: "Sign in required." }, 401);
  if (typeof email !== "string" || !email.trim())
    return json({ error: "Your account email could not be verified." }, 422);
  const admin = createAdminClient();
  // Google Play subscriptions are managed in Google Play, not in Stripe.
  const { data: current } = await admin
    .from("account_subscriptions")
    .select("provider")
    .eq("user_id", userId)
    .in("status", ["incomplete", "trialing", "active", "past_due", "paused"])
    .maybeSingle();
  if (current?.provider === "google_play")
    return json({
      url: GOOGLE_PLAY_SUBSCRIPTIONS_URL,
      provider: "google_play",
    });
  const { data: customer } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!customer)
    return json({ error: "No billing profile exists for this account." }, 404);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl)
    return json({ error: "Billing return URL is not configured." }, 500);
  await stripeClient().customers.update(customer.stripe_customer_id, {
    email,
  });
  const session = await stripeClient().billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${appUrl}/account`,
  });
  return json({ url: session.url });
}
