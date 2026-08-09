import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";
import {
  sha256,
  SIGNIN_CLAIM_LIFETIME_SECONDS,
} from "@/lib/commerce/checkout-claims";
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
  const admin = createAdminClient();
  let provisionedUserId = subscription.metadata.user_id;
  const pendingToken = subscription.metadata.pending_claim_token;
  if (!provisionedUserId && pendingToken) {
    const pendingHash = sha256(pendingToken);
    const { data: pending } = await admin
      .from("pending_chart_claims")
      .select(
        "user_id,birth_profile_id,stripe_checkout_session_id,expires_at",
      )
      .eq("claim_token_hash", pendingHash)
      .maybeSingle();
    if (
      pending?.user_id &&
      pending.birth_profile_id &&
      pending.stripe_checkout_session_id === session.id &&
      new Date(pending.expires_at).getTime() > Date.now()
    ) {
      const { data: existingSubscription } = await admin
        .from("account_subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", pending.user_id)
        .in("status", ["active", "trialing", "past_due", "paused"])
        .neq("stripe_subscription_id", subscription.id)
        .maybeSingle();
      if (existingSubscription) {
        const expiresAt = new Date(
          Date.now() + SIGNIN_CLAIM_LIFETIME_SECONDS * 1000,
        ).toISOString();
        const { error: signinError } = await admin
          .from("subscription_signin_claims")
          .upsert({
            checkout_session_hash: sha256(session.id),
            user_id: pending.user_id,
            expires_at: expiresAt,
          });
        if (signinError)
          return json({ error: "Subscription confirmation failed." }, 500);
        await stripeClient().subscriptions.update(subscription.id, {
          metadata: {
            ...subscription.metadata,
            user_id: pending.user_id,
            pending_claim_token: "",
            celestial_atlas_duplicate: "ignored",
          },
        });
        await stripeClient().subscriptions.cancel(subscription.id);
        const { error: deleteError } = await admin
          .from("pending_chart_claims")
          .delete()
          .eq("claim_token_hash", pendingHash);
        if (deleteError)
          return json({ error: "Subscription confirmation failed." }, 500);
        provisionedUserId = pending.user_id;
      }
    }
  }
  if (!provisionedUserId) return json({ state: "pending" }, 202);

  const claimHash = sha256(session.id);
  const staleLock = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("subscription_signin_claims")
    .update({ locked_at: new Date().toISOString() })
    .eq("checkout_session_hash", claimHash)
    .eq("user_id", provisionedUserId)
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
