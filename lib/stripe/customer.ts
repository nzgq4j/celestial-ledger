import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/database.types";

type Admin = SupabaseClient<Database>;

/**
 * The account's Stripe customer, created on first use. The customer's email
 * is kept aligned with the authenticated account so Checkout and the portal
 * never open with an empty or unrelated email.
 */
export async function ensureStripeCustomer(
  admin: Admin,
  stripe: Stripe,
  userId: string,
  email: string,
): Promise<{ id: string; stripe_customer_id: string } | null> {
  const { data: existing } = await admin
    .from("billing_customers")
    .select("id,stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    await stripe.customers.update(existing.stripe_customer_id, { email });
    return existing;
  }
  const created = await stripe.customers.create({
    email,
    metadata: { application: "celestial_atlas", user_id: userId },
  });
  const result = await admin
    .from("billing_customers")
    .insert({ user_id: userId, stripe_customer_id: created.id })
    .select("id,stripe_customer_id")
    .single();
  return result.error || !result.data ? null : result.data;
}
