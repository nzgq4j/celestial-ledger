import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ATLAS_PLAN_KEY, type BillingInterval } from "@/lib/membership/plans";

type Admin = SupabaseClient<Database>;

export const ATLAS_UNAVAILABLE_MESSAGE =
  "Atlas membership is not yet available.";

export type ActivePlanPrice = {
  planKey: string;
  interval: BillingInterval;
  stripePriceId: string;
  unitAmount: number;
  currency: string;
  trialDays: number;
};

/** The one active Stripe price for Atlas at this interval, or null. */
export async function activeAtlasPrice(
  admin: Admin,
  interval: BillingInterval,
): Promise<ActivePlanPrice | null> {
  const [{ data: plan }, { data: price, error }] = await Promise.all([
    admin
      .from("commerce_plans")
      .select("plan_key,active")
      .eq("plan_key", ATLAS_PLAN_KEY)
      .maybeSingle(),
    admin
      .from("commerce_plan_prices")
      .select(
        "plan_key,billing_interval,stripe_price_id,unit_amount,currency,trial_days,active",
      )
      .eq("plan_key", ATLAS_PLAN_KEY)
      .eq("billing_interval", interval)
      .eq("active", true)
      .order("catalog_version", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error || !plan?.active || !price?.active || !price.stripe_price_id)
    return null;
  return {
    planKey: price.plan_key,
    interval,
    stripePriceId: price.stripe_price_id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    trialDays: price.trial_days,
  };
}

/**
 * Maps a Stripe price back to its plan. Every commerce_plan_prices row counts
 * (a later-deactivated price still has subscribers); the legacy single price
 * on commerce_plans is the fallback for subscriptions created before it.
 */
export async function planKeyForStripePrice(
  admin: Admin,
  priceId: string | null | undefined,
): Promise<string | null> {
  if (!priceId) return null;
  const { data: price } = await admin
    .from("commerce_plan_prices")
    .select("plan_key")
    .eq("stripe_price_id", priceId)
    .maybeSingle();
  if (price?.plan_key) return price.plan_key;
  const { data: cataloguePlan } = await admin
    .from("commerce_plans")
    .select("plan_key")
    .eq("stripe_price_id", priceId)
    .eq("active", true)
    .maybeSingle();
  return cataloguePlan?.plan_key ?? null;
}
