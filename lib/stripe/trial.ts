import "server-only";

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Free-trial eligibility (documented in docs/commerce/TWO_TIER_ATLAS_RUNBOOK.md):
 * a trial is offered only when neither the account nor any matching Stripe
 * customer has ever had a subscription that started (any status other than
 * `incomplete`/`incomplete_expired`) or any trial. Any lookup failure denies
 * the trial; checkout itself still proceeds, at full price.
 */
const NEVER_STARTED = new Set(["incomplete", "incomplete_expired"]);

export function trialEligibleFromHistory(input: {
  accountStatuses: readonly string[];
  stripeSubscriptions: readonly Pick<
    Stripe.Subscription,
    "status" | "trial_start"
  >[];
}) {
  if (input.accountStatuses.some((status) => !NEVER_STARTED.has(status)))
    return false;
  return !input.stripeSubscriptions.some(
    (subscription) =>
      subscription.trial_start != null ||
      !NEVER_STARTED.has(subscription.status),
  );
}

export async function atlasTrialEligible(input: {
  admin: SupabaseClient<Database>;
  stripe: Stripe;
  userId?: string;
  stripeCustomerId?: string;
  email?: string;
}): Promise<boolean> {
  try {
    const customerIds = new Set<string>();
    if (input.stripeCustomerId) customerIds.add(input.stripeCustomerId);
    if (input.email) {
      const customers = await input.stripe.customers.list({
        email: input.email,
        limit: 10,
      });
      for (const customer of customers.data) customerIds.add(customer.id);
    }

    const userIds = new Set<string>();
    if (input.userId) userIds.add(input.userId);
    if (customerIds.size) {
      const { data: billingCustomers, error } = await input.admin
        .from("billing_customers")
        .select("user_id")
        .in("stripe_customer_id", [...customerIds]);
      if (error) return false;
      for (const row of billingCustomers ?? [])
        if (row.user_id) userIds.add(row.user_id);
    }

    let accountStatuses: string[] = [];
    if (userIds.size) {
      const { data: rows, error } = await input.admin
        .from("account_subscriptions")
        .select("status")
        .in("user_id", [...userIds]);
      if (error) return false;
      accountStatuses = (rows ?? []).map((row) => row.status);
    }

    const stripeSubscriptions: Pick<
      Stripe.Subscription,
      "status" | "trial_start"
    >[] = [];
    for (const customer of customerIds) {
      const page = await input.stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 100,
      });
      stripeSubscriptions.push(...page.data);
    }
    return trialEligibleFromHistory({ accountStatuses, stripeSubscriptions });
  } catch {
    return false;
  }
}
