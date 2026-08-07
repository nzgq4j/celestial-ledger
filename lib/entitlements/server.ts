import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  effectivePlan,
  type Plan,
  type PlanKey,
  type SubscriptionState,
} from "@/lib/entitlements/domain";

export async function effectivePlanKeyForUser(
  userId: string,
  at = new Date(),
): Promise<PlanKey> {
  const admin = createAdminClient();
  const { data: administrator } = await admin
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "site_admin")
    .maybeSingle();
  if (administrator) return "premium";
  const [
    { data: planRows, error: planError },
    { data: subscriptionRows, error: subscriptionError },
  ] = await Promise.all([
    admin.from("commerce_plans").select("plan_key,rank,active"),
    admin
      .from("account_subscriptions")
      .select("plan_key,status,current_period_end,grace_ends_at")
      .eq("user_id", userId),
  ]);
  if (planError || subscriptionError)
    throw new Error("ENTITLEMENT_LOOKUP_FAILED");

  const plans = (planRows ?? []).filter(
    (row): row is typeof row & { plan_key: PlanKey } =>
      ["free", "personal", "premium"].includes(row.plan_key),
  );
  const subscriptions = (subscriptionRows ?? []).filter(
    (
      row,
    ): row is typeof row & {
      plan_key: PlanKey;
      status: SubscriptionState["status"];
    } =>
      ["free", "personal", "premium"].includes(row.plan_key) &&
      [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ].includes(row.status),
  );
  return effectivePlan(
    plans.map(
      (row) =>
        ({
          key: row.plan_key,
          rank: row.rank,
          active: row.active,
        }) satisfies Plan,
    ),
    subscriptions.map(
      (row) =>
        ({
          planKey: row.plan_key,
          status: row.status,
          currentPeriodEnd: row.current_period_end
            ? new Date(row.current_period_end)
            : undefined,
          graceEndsAt: row.grace_ends_at
            ? new Date(row.grace_ends_at)
            : undefined,
        }) satisfies SubscriptionState,
    ),
    at,
  );
}
