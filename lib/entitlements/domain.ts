/**
 * Database plan keys. `premium` is the paid level, shown to readers as
 * "Atlas" (see lib/membership/plans.ts). `personal` is a retired, inactive
 * key kept only so historical rows still type-check; it is never effective.
 */
export type PlanKey = "free" | "personal" | "premium";
export type CapabilityPeriod =
  "none" | "week" | "billing_month" | "quarter" | "year";

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

const DAY_MS = 24 * 60 * 60 * 1000;

function utcMidnight(at: Date) {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

function addUtcYears(at: Date, years: number) {
  const next = new Date(at.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

/**
 * Mirrors `private.membership_period_window` for presentation and for callers
 * of `consume_capability`, which takes explicit period bounds.
 *
 * - `week` starts Monday 00:00 UTC.
 * - `billing_month` uses the current subscription period when known.
 * - `year` is the membership year: anniversaries of `anchor` (the current
 *   subscription's start), or the UTC calendar year without one.
 */
export function capabilityPeriodWindow(
  period: CapabilityPeriod,
  at = new Date(),
  context: {
    anchor?: Date;
    billingPeriod?: { start: Date; end: Date };
  } = {},
): { start: Date; end: Date } {
  switch (period) {
    case "week": {
      const midnight = utcMidnight(at);
      const start = new Date(
        midnight.getTime() - ((midnight.getUTCDay() + 6) % 7) * DAY_MS,
      );
      return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
    }
    case "billing_month": {
      const billing = context.billingPeriod;
      if (
        billing &&
        billing.start.getTime() <= at.getTime() &&
        billing.end.getTime() > at.getTime()
      )
        return { start: billing.start, end: billing.end };
      const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth()));
      return {
        start,
        end: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1)),
      };
    }
    case "quarter": {
      const month = at.getUTCMonth() - (at.getUTCMonth() % 3);
      return {
        start: new Date(Date.UTC(at.getUTCFullYear(), month)),
        end: new Date(Date.UTC(at.getUTCFullYear(), month + 3)),
      };
    }
    case "year": {
      const anchor = context.anchor;
      if (anchor && anchor.getTime() <= at.getTime()) {
        let years = at.getUTCFullYear() - anchor.getUTCFullYear();
        if (addUtcYears(anchor, years).getTime() > at.getTime()) years -= 1;
        const start = addUtcYears(anchor, years);
        return { start, end: addUtcYears(start, 1) };
      }
      return {
        start: new Date(Date.UTC(at.getUTCFullYear(), 0)),
        end: new Date(Date.UTC(at.getUTCFullYear() + 1, 0)),
      };
    }
    default:
      return {
        start: new Date("1970-01-01T00:00:00Z"),
        end: new Date("9999-01-01T00:00:00Z"),
      };
  }
}
