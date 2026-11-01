import { describe, expect, it } from "vitest";
import {
  capabilityPeriodWindow,
  decideCapability,
  effectivePlan,
  type CapabilityGrant,
  type Plan,
  type PlanCapability,
  type SubscriptionState,
} from "@/lib/entitlements/domain";

const at = new Date("2026-08-06T12:00:00Z");
const plans: Plan[] = [
  { key: "free", rank: 0, active: true },
  { key: "personal", rank: 10, active: true },
  { key: "premium", rank: 20, active: true },
];
const capabilities: PlanCapability[] = [
  {
    planKey: "free",
    capability: "daily_reading.personal",
    allowance: 1,
    period: "week",
  },
  {
    planKey: "personal",
    capability: "daily_reading.personal",
    allowance: 10,
    period: "billing_month",
  },
  {
    planKey: "premium",
    capability: "daily_reading.primary",
    allowance: 1,
    period: "none",
  },
];

function subscription(
  values: Partial<SubscriptionState> = {},
): SubscriptionState {
  return {
    planKey: "personal",
    status: "active",
    currentPeriodEnd: new Date("2026-09-01T00:00:00Z"),
    ...values,
  };
}

describe("deterministic account entitlement decisions", () => {
  it("defaults every account to Free", () => {
    expect(effectivePlan(plans, [], at)).toBe("free");
  });

  it("accepts active and trialing subscriptions", () => {
    expect(effectivePlan(plans, [subscription()], at)).toBe("personal");
    expect(
      effectivePlan(plans, [subscription({ status: "trialing" })], at),
    ).toBe("personal");
  });

  it("keeps past-due access only inside grace", () => {
    expect(
      effectivePlan(
        plans,
        [
          subscription({
            status: "past_due",
            graceEndsAt: new Date("2026-08-07T00:00:00Z"),
          }),
        ],
        at,
      ),
    ).toBe("personal");
    expect(
      effectivePlan(
        plans,
        [
          subscription({
            status: "past_due",
            graceEndsAt: new Date("2026-08-06T00:00:00Z"),
          }),
        ],
        at,
      ),
    ).toBe("free");
  });

  it.each(["canceled", "unpaid", "paused", "incomplete_expired"] as const)(
    "denies terminal subscription status %s",
    (status) =>
      expect(effectivePlan(plans, [subscription({ status })], at)).toBe("free"),
  );

  it("does not retain a subscription after paid-through expiry", () => {
    expect(
      effectivePlan(
        plans,
        [subscription({ currentPeriodEnd: new Date("2026-08-06T11:59:59Z") })],
        at,
      ),
    ).toBe("free");
  });

  it("denies unknown capabilities", () => {
    expect(
      decideCapability({
        plans,
        planCapabilities: capabilities,
        subscriptions: [],
        grants: [],
        capability: "unknown.capability",
        at,
      }),
    ).toEqual({
      allowed: false,
      reason: "unknown_capability",
      planKey: "free",
    });
  });

  it("uses the active plan allowance", () => {
    expect(
      decideCapability({
        plans,
        planCapabilities: capabilities,
        subscriptions: [subscription()],
        grants: [],
        capability: "daily_reading.personal",
        at,
      }),
    ).toMatchObject({ allowed: true, allowance: 10, period: "billing_month" });
  });

  it("allows a stronger promotional grant without plan-name checks", () => {
    const grants: CapabilityGrant[] = [
      {
        capability: "daily_reading.personal",
        allowance: 25,
        period: "billing_month",
        startsAt: new Date("2026-08-01T00:00:00Z"),
        endsAt: new Date("2026-09-01T00:00:00Z"),
        priority: 200,
        status: "active",
      },
    ];
    expect(
      decideCapability({
        plans,
        planCapabilities: capabilities,
        subscriptions: [subscription()],
        grants,
        capability: "daily_reading.personal",
        at,
      }),
    ).toMatchObject({ allowed: true, allowance: 25, source: "plan_and_grant" });
  });
});

describe("two-tier catalogue and capability periods", () => {
  it("never makes the retired Personal plan effective", () => {
    const twoTier: Plan[] = [
      { key: "free", rank: 0, active: true },
      { key: "personal", rank: 10, active: false },
      { key: "premium", rank: 20, active: true },
    ];
    expect(effectivePlan(twoTier, [subscription()], at)).toBe("free");
    expect(
      effectivePlan(twoTier, [subscription({ planKey: "premium" })], at),
    ).toBe("premium");
  });

  it("supports a yearly allowance period", () => {
    expect(
      decideCapability({
        plans,
        planCapabilities: [
          {
            planKey: "premium",
            capability: "report.standard_credit",
            allowance: 1,
            period: "year",
          },
        ],
        subscriptions: [subscription({ planKey: "premium" })],
        grants: [],
        capability: "report.standard_credit",
        at,
      }),
    ).toMatchObject({ allowed: true, allowance: 1, period: "year" });
  });

  it("anchors the membership year on the subscription anniversary", () => {
    const anchor = new Date("2025-03-15T10:00:00Z");
    expect(
      capabilityPeriodWindow("year", new Date("2026-03-15T09:59:59Z"), {
        anchor,
      }),
    ).toEqual({
      start: new Date("2025-03-15T10:00:00Z"),
      end: new Date("2026-03-15T10:00:00Z"),
    });
    expect(
      capabilityPeriodWindow("year", new Date("2026-03-15T10:00:00Z"), {
        anchor,
      }),
    ).toEqual({
      start: new Date("2026-03-15T10:00:00Z"),
      end: new Date("2027-03-15T10:00:00Z"),
    });
    expect(capabilityPeriodWindow("year", at)).toEqual({
      start: new Date("2026-01-01T00:00:00Z"),
      end: new Date("2027-01-01T00:00:00Z"),
    });
  });

  it("matches the database week, billing-month and quarter windows", () => {
    expect(capabilityPeriodWindow("week", at)).toEqual({
      start: new Date("2026-08-03T00:00:00Z"),
      end: new Date("2026-08-10T00:00:00Z"),
    });
    const billing = {
      start: new Date("2026-07-20T00:00:00Z"),
      end: new Date("2026-08-20T00:00:00Z"),
    };
    expect(
      capabilityPeriodWindow("billing_month", at, { billingPeriod: billing }),
    ).toEqual(billing);
    expect(capabilityPeriodWindow("billing_month", at)).toEqual({
      start: new Date("2026-08-01T00:00:00Z"),
      end: new Date("2026-09-01T00:00:00Z"),
    });
    expect(capabilityPeriodWindow("quarter", at)).toEqual({
      start: new Date("2026-07-01T00:00:00Z"),
      end: new Date("2026-10-01T00:00:00Z"),
    });
  });
});
