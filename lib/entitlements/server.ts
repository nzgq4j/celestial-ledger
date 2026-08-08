import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  decideCapability,
  effectivePlan,
  type CapabilityDecision,
  type CapabilityGrant,
  type Plan,
  type PlanCapability,
  type PlanKey,
  type SubscriptionState,
} from "@/lib/entitlements/domain";

export async function capabilityDecisionForUser(
  userId: string,
  capability: string,
  at = new Date(),
): Promise<CapabilityDecision> {
  const admin = createAdminClient();
  const planKey = await effectivePlanKeyForUser(userId, at);
  const [
    { data: capabilityRows, error: capabilityError },
    { data: grantRows, error: grantError },
  ] = await Promise.all([
    admin
      .from("plan_capabilities")
      .select("plan_key,capability_key,allowance,period")
      .eq("plan_key", planKey)
      .eq("capability_key", capability),
    admin
      .from("capability_grants")
      .select(
        "capability_key,allowance,period,starts_at,ends_at,priority,status",
      )
      .eq("user_id", userId)
      .eq("capability_key", capability),
  ]);
  if (capabilityError || grantError)
    throw new Error("ENTITLEMENT_LOOKUP_FAILED");
  return decideCapability({
    plans: [
      { key: "free", rank: 0, active: true },
      { key: "personal", rank: 10, active: true },
      { key: "premium", rank: 20, active: true },
    ],
    planCapabilities: (capabilityRows ?? []).map(
      (row) =>
        ({
          planKey: row.plan_key as PlanKey,
          capability: row.capability_key,
          allowance: row.allowance,
          period: row.period as PlanCapability["period"],
        }) satisfies PlanCapability,
    ),
    subscriptions:
      planKey === "free"
        ? []
        : [{ planKey, status: "active" as const, currentPeriodEnd: undefined }],
    grants: (grantRows ?? []).map(
      (row) =>
        ({
          capability: row.capability_key,
          allowance: row.allowance,
          period: row.period as CapabilityGrant["period"],
          startsAt: new Date(row.starts_at),
          endsAt: row.ends_at ? new Date(row.ends_at) : undefined,
          priority: row.priority,
          status: row.status as CapabilityGrant["status"],
        }) satisfies CapabilityGrant,
    ),
    capability,
    at,
  });
}

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
