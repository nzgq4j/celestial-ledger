import { commerceFlags } from "@/lib/commerce/flags";
import { GOOGLE_PLAY_SUBSCRIPTIONS_URL } from "@/lib/membership/plans";
import { appJson, appPreflight, authenticateRequest } from "@/lib/request-auth";
import { stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const OPTIONS = appPreflight;

/** Where the member manages Atlas+: the Stripe portal, or Google Play. Returns { url, provider }. */
export async function POST(request: Request) {
  const fail = (code: string, error: string, status: number) =>
    appJson(request, { code, error }, status);
  if (!commerceFlags().subscriptions)
    return fail("UNAVAILABLE", "Membership management is not available right now.", 403);

  const auth = await authenticateRequest(request);
  if (!auth.ok) return fail(auth.code.toUpperCase(), "Sign in first.", auth.status);
  const { userId } = auth.user;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("account_subscriptions")
    .select("provider")
    .eq("user_id", userId)
    .in("status", ["incomplete", "trialing", "active", "past_due", "paused"])
    .maybeSingle();
  if (current?.provider === "google_play")
    return appJson(request, { url: GOOGLE_PLAY_SUBSCRIPTIONS_URL, provider: "google_play" });

  const { data: customer } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!customer) return fail("NO_BILLING_PROFILE", "There is no membership to manage.", 404);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return fail("NOT_CONFIGURED", "Billing is not configured.", 500);

  const session = await stripeClient().billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${appUrl}/profile`,
  });
  return appJson(request, { url: session.url, provider: "stripe" });
}
