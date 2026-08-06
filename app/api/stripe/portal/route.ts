import { commerceFlags } from "@/lib/commerce/flags";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
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
  if (error || typeof userId !== "string")
    return json({ error: "Sign in required." }, 401);
  const { data: customer } = await createAdminClient()
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!customer)
    return json({ error: "No billing profile exists for this account." }, 404);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl)
    return json({ error: "Billing return URL is not configured." }, 500);
  const session = await stripeClient().billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${appUrl}/account`,
  });
  return json({ url: session.url });
}
