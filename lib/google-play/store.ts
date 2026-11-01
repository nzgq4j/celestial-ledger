import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { ATLAS_PLAN_KEY } from "@/lib/membership/plans";
import {
  CURRENT_SUBSCRIPTION_STATUSES,
  currentPeriodStart,
  type AccountSubscriptionStatus,
  type MappedPlaySubscription,
} from "./subscription";

/**
 * Database access for Google Play subscriptions.
 *
 * The columns `account_subscriptions.provider`, `google_play_*` and the table
 * `commerce_plan_prices` come from the billing migration. Until
 * `database.types.ts` is regenerated with them, this module uses an untyped
 * client and the explicit row types below.
 */
export type PlayDb = SupabaseClient<any, "public", any>;

export function playDb(): PlayDb {
  return createAdminClient() as unknown as PlayDb;
}

export type PlayPlanPrice = {
  plan_key: string;
  billing_interval: "month" | "year";
  trial_days: number | null;
  google_play_product_id: string;
  google_play_base_plan_id: string;
  active: boolean;
  catalog_version: string | number | null;
};

export type SubscriptionRow = {
  id: string;
  user_id: string | null;
  provider: "stripe" | "google_play";
  plan_key: string;
  status: AccountSubscriptionStatus;
  current_period_end: string | null;
  google_play_purchase_token: string | null;
};

const PRICE_COLUMNS =
  "plan_key,billing_interval,trial_days,google_play_product_id,google_play_base_plan_id,active,catalog_version";
const SUBSCRIPTION_COLUMNS =
  "id,user_id,provider,plan_key,status,current_period_end,google_play_purchase_token";

/** Active Play products for Atlas, newest catalog version first. */
export async function loadPlayCatalog(db: PlayDb = playDb()) {
  const { data, error } = await db
    .from("commerce_plan_prices")
    .select(PRICE_COLUMNS)
    .eq("plan_key", ATLAS_PLAN_KEY)
    .eq("active", true)
    .not("google_play_product_id", "is", null)
    .not("google_play_base_plan_id", "is", null)
    .order("catalog_version", { ascending: false });
  if (error) throw new Error("PLAY_CATALOG_UNAVAILABLE");
  const byInterval = new Map<"month" | "year", PlayPlanPrice>();
  for (const row of (data ?? []) as PlayPlanPrice[])
    if (!byInterval.has(row.billing_interval))
      byInterval.set(row.billing_interval, row);
  return [...byInterval.values()];
}

/** Maps a Play product/base plan to a price row (active or retired). */
export async function findPlayPrice(
  productId: string,
  basePlanId: string | null,
  db: PlayDb = playDb(),
): Promise<PlayPlanPrice | null> {
  let query = db
    .from("commerce_plan_prices")
    .select(PRICE_COLUMNS)
    .eq("google_play_product_id", productId);
  if (basePlanId) query = query.eq("google_play_base_plan_id", basePlanId);
  const { data, error } = await query
    .order("active", { ascending: false })
    .order("catalog_version", { ascending: false })
    .limit(1);
  if (error) throw new Error("PLAY_CATALOG_UNAVAILABLE");
  return ((data ?? []) as PlayPlanPrice[])[0] ?? null;
}

export async function currentSubscriptionFor(
  userId: string,
  db: PlayDb = playDb(),
): Promise<SubscriptionRow | null> {
  const { data, error } = await db
    .from("account_subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("user_id", userId)
    .in("status", [...CURRENT_SUBSCRIPTION_STATUSES])
    .maybeSingle();
  if (error) throw new Error("SUBSCRIPTION_LOOKUP_FAILED");
  return (data as SubscriptionRow | null) ?? null;
}

export async function subscriptionByPurchaseToken(
  purchaseToken: string,
  db: PlayDb = playDb(),
): Promise<SubscriptionRow | null> {
  const { data, error } = await db
    .from("account_subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("google_play_purchase_token", purchaseToken)
    .maybeSingle();
  if (error) throw new Error("SUBSCRIPTION_LOOKUP_FAILED");
  return (data as SubscriptionRow | null) ?? null;
}

export class PlaySyncConflict extends Error {
  constructor(
    public readonly code:
      | "STRIPE_SUBSCRIPTION_ACTIVE"
      | "ALREADY_SUBSCRIBED"
      | "TOKEN_OWNED_BY_ANOTHER_ACCOUNT",
  ) {
    super(code);
  }
}

/**
 * Upserts the `account_subscriptions` row for a Play purchase token.
 * Idempotent: always writes the state Google reports now.
 */
export async function upsertPlaySubscription(
  input: {
    userId: string;
    purchaseToken: string;
    linkedPurchaseToken?: string | null;
    mapped: MappedPlaySubscription;
    price: PlayPlanPrice;
  },
  db: PlayDb = playDb(),
) {
  const { userId, purchaseToken, mapped, price } = input;
  const existing = await subscriptionByPurchaseToken(purchaseToken, db);
  if (existing?.user_id && existing.user_id !== userId)
    throw new PlaySyncConflict("TOKEN_OWNED_BY_ANOTHER_ACCOUNT");

  const becomesCurrent = CURRENT_SUBSCRIPTION_STATUSES.includes(mapped.status);
  if (becomesCurrent) {
    // An upgrade/downgrade/resubscribe replaces the linked token.
    if (input.linkedPurchaseToken)
      await db
        .from("account_subscriptions")
        .update({ status: "canceled", cancel_at_period_end: true })
        .eq("google_play_purchase_token", input.linkedPurchaseToken)
        .eq("user_id", userId);
    const current = await currentSubscriptionFor(userId, db);
    if (current && current.google_play_purchase_token !== purchaseToken) {
      if (current.provider !== "google_play")
        throw new PlaySyncConflict("STRIPE_SUBSCRIPTION_ACTIVE");
      throw new PlaySyncConflict("ALREADY_SUBSCRIBED");
    }
  }

  const row = {
    user_id: userId,
    provider: "google_play" as const,
    plan_key: price.plan_key,
    status: mapped.status,
    current_period_start: currentPeriodStart(
      mapped,
      price.billing_interval,
      price.trial_days ?? 7,
    ),
    current_period_end: mapped.currentPeriodEnd,
    cancel_at_period_end: mapped.cancelAtPeriodEnd,
    grace_ends_at: mapped.graceEndsAt,
    billing_customer_id: null,
    stripe_subscription_id: null,
    google_play_purchase_token: purchaseToken,
    google_play_product_id: mapped.productId,
    google_play_order_id: mapped.orderId,
  };
  const result = existing
    ? await db
        .from("account_subscriptions")
        .update(row)
        .eq("id", existing.id)
        .select("plan_key,status,current_period_end,grace_ends_at")
        .single()
    : await db
        .from("account_subscriptions")
        .upsert(row, { onConflict: "google_play_purchase_token" })
        .select("plan_key,status,current_period_end,grace_ends_at")
        .single();
  if (result.error) {
    if (result.error.code === "23505")
      throw new PlaySyncConflict("ALREADY_SUBSCRIBED");
    throw new Error("SUBSCRIPTION_WRITE_FAILED");
  }
  return result.data as {
    plan_key: string;
    status: AccountSubscriptionStatus;
    current_period_end: string | null;
    grace_ends_at: string | null;
  };
}
