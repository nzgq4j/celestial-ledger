export type PlanKey = "free" | "personal" | "premium";
export type CapabilityPeriod = "none" | "week" | "billing_month" | "quarter";

export type Plan = {
  key: PlanKey;
  rank: number;
  active: boolean;
};

export type PlanCapability = {
  planKey: PlanKey;
  capability: string;
  allowance: number | null;
  period: CapabilityPeriod;
};

export type SubscriptionState = {
  planKey: PlanKey;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  currentPeriodEnd?: Date;
  graceEndsAt?: Date;
};

export type CapabilityGrant = {
  capability: string;
  allowance: number | null;
  period: CapabilityPeriod;
  startsAt: Date;
  endsAt?: Date;
  priority: number;
  status: "active" | "revoked" | "expired";
};

export type CapabilityDecision =
  | {
      allowed: true;
      allowance: number | null;
      period: CapabilityPeriod;
      source: "plan" | "grant" | "plan_and_grant";
      planKey: PlanKey;
    }
  | { allowed: false; reason: "unknown_capability"; planKey: PlanKey };

function subscriptionIsEffective(subscription: SubscriptionState, at: Date) {
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() <= at.getTime()
  )
    return false;
  if (["active", "trialing"].includes(subscription.status)) return true;
  return (
    subscription.status === "past_due" &&
    !!subscription.graceEndsAt &&
    subscription.graceEndsAt.getTime() > at.getTime()
  );
}

export function effectivePlan(
  plans: Plan[],
  subscriptions: SubscriptionState[],
  at = new Date(),
): PlanKey {
  const effective = subscriptions
    .filter((subscription) => subscriptionIsEffective(subscription, at))
    .map((subscription) =>
      plans.find((plan) => plan.key === subscription.planKey),
    )
    .filter((plan): plan is Plan => !!plan?.active)
    .sort((left, right) => right.rank - left.rank)[0];
  return effective?.key ?? "free";
}

export function decideCapability(input: {
  plans: Plan[];
  planCapabilities: PlanCapability[];
  subscriptions: SubscriptionState[];
  grants: CapabilityGrant[];
  capability: string;
  at?: Date;
}): CapabilityDecision {
  const at = input.at ?? new Date();
  const planKey = effectivePlan(input.plans, input.subscriptions, at);
  const planCapability = input.planCapabilities.find(
    (candidate) =>
      candidate.planKey === planKey &&
      candidate.capability === input.capability,
  );
  const grants = input.grants
    .filter(
      (grant) =>
        grant.capability === input.capability &&
        grant.status === "active" &&
        grant.startsAt.getTime() <= at.getTime() &&
        (!grant.endsAt || grant.endsAt.getTime() > at.getTime()),
    )
    .sort((left, right) => right.priority - left.priority);
  if (!planCapability && !grants.length)
    return { allowed: false, reason: "unknown_capability", planKey };

  const grant = grants[0];
  const unlimited =
    planCapability?.allowance === null || grant?.allowance === null;
  const allowance = unlimited
    ? null
    : Math.max(planCapability?.allowance ?? 0, grant?.allowance ?? 0);
  const period = grant?.period ?? planCapability?.period ?? "none";
  return {
    allowed: true,
    allowance,
    period,
    source:
      planCapability && grant ? "plan_and_grant" : grant ? "grant" : "plan",
    planKey,
  };
}
