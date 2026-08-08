import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";
import { sha256 } from "@/lib/commerce/checkout-claims";
import { commerceFlags } from "@/lib/commerce/flags";
import { stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({ sessionId: z.string().trim().min(10).max(255) })
  .strict();
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: NextRequest) {
  if (!commerceFlags().anonymousCheckout)
    return json(
      { error: "Checkout-led signup is not currently available." },
      403,
    );
  if (!isSameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  let body: unknown;
  try {
    body = await readLimitedJson(request, 1024);
  } catch {
    return json({ error: "Invalid checkout return." }, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid checkout return." }, 422);

  const session = await stripeClient().checkout.sessions.retrieve(
    parsed.data.sessionId,
  );
  if (
    session.mode !== "subscription" ||
    session.metadata?.application !== "celestial_atlas" ||
    session.status !== "complete"
  )
    return json({ state: "pending" }, 202);

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) return json({ state: "pending" }, 202);
  const subscription =
    await stripeClient().subscriptions.retrieve(subscriptionId);
  if (!subscription.metadata.user_id) return json({ state: "pending" }, 202);

  const admin = createAdminClient();
  const claimHash = sha256(session.id);
  const staleLock = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("subscription_signin_claims")
    .update({ locked_at: new Date().toISOString() })
    .eq("checkout_session_hash", claimHash)
    .eq("user_id", subscription.metadata.user_id)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .or(`locked_at.is.null,locked_at.lt.${staleLock}`)
    .select("user_id")
    .maybeSingle();
  if (claimError)
    return json({ error: "Subscription confirmation failed." }, 500);
  if (!claimed) return json({ state: "pending" }, 202);

  let email = session.customer_details?.email?.trim().toLowerCase();
  if (!email && session.customer) {
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;
    const customer = await stripeClient().customers.retrieve(customerId);
    if (!customer.deleted) email = customer.email?.trim().toLowerCase();
  }
  if (!email) {
    await admin
      .from("subscription_signin_claims")
      .update({ locked_at: null })
      .eq("checkout_session_hash", claimHash);
    return json({ error: "Checkout email could not be verified." }, 422);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || link.user.id !== claimed.user_id) {
    await admin
      .from("subscription_signin_claims")
      .update({ locked_at: null })
      .eq("checkout_session_hash", claimHash);
    return json({ error: "Account confirmation failed." }, 500);
  }

  const response = json({
    state: "ready",
    redirect: "/account?checkout=subscription_return",
  });
  const { url, publishableKey } = supabasePublicConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
      },
    },
  });
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) {
    await admin
      .from("subscription_signin_claims")
      .update({ locked_at: null })
      .eq("checkout_session_hash", claimHash);
    return json({ error: "Account session could not be established." }, 500);
  }
  await admin
    .from("subscription_signin_claims")
    .update({ consumed_at: new Date().toISOString(), locked_at: null })
    .eq("checkout_session_hash", claimHash);
  return response;
}
