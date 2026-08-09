import { describe, expect, it } from "vitest";
import { deriveAccountReportStates } from "@/lib/account/report-states";

const products = [
  {
    report_type: "career_purpose",
    name: "Career and Purpose",
    description: "Career",
    unit_amount: 1000,
    currency: "gbp",
  },
  {
    report_type: "recovery_reflection",
    name: "Recovery Reflection",
    description: "Recovery",
    unit_amount: 1000,
    currency: "gbp",
  },
];

describe("account report states", () => {
  it("resolves every report product to one state and one action path", () => {
    const states = deriveAccountReportStates({
      products,
      readyEntitlements: [
        {
          id: "career-entitlement",
          report_type: "career_purpose",
          granted_at: "2026-08-09T08:00:00Z",
        },
      ],
      reports: [
        {
          id: "recovery-report",
          report_type: "recovery_reflection",
          status: "completed",
          created_at: "2026-08-08T08:00:00Z",
        },
      ],
      planKey: "personal",
    });
    expect(states).toHaveLength(2);
    expect(states.map((state) => state.product.report_type)).toEqual([
      "career_purpose",
      "recovery_reflection",
    ]);
    expect(states.map((state) => state.kind)).toEqual([
      "purchased_unused",
      "generated",
    ]);
  });

  it("gives an unused purchase priority over prior report history", () => {
    const [state] = deriveAccountReportStates({
      products: [products[0]],
      readyEntitlements: [
        {
          id: "new-entitlement",
          report_type: "career_purpose",
          granted_at: "2026-08-09T08:00:00Z",
        },
      ],
      reports: [
        {
          id: "old-report",
          report_type: "career_purpose",
          status: "completed",
          created_at: "2026-08-01T08:00:00Z",
        },
      ],
      planKey: "personal",
    });
    expect(state.kind).toBe("purchased_unused");
  });

  it("distinguishes Premium inclusion from a report that must be purchased", () => {
    expect(
      deriveAccountReportStates({
        products,
        readyEntitlements: [],
        reports: [],
        planKey: "premium",
      }).map((state) => state.kind),
    ).toEqual(["premium_included", "premium_included"]);
    expect(
      deriveAccountReportStates({
        products,
        readyEntitlements: [],
        reports: [],
        planKey: "personal",
      }).map((state) => state.kind),
    ).toEqual(["not_purchased", "not_purchased"]);
  });

  it("deduplicates repeated catalogue rows by report type", () => {
    const states = deriveAccountReportStates({
      products: [...products, products[0]],
      readyEntitlements: [],
      reports: [],
      planKey: "free",
    });
    expect(states).toHaveLength(2);
    expect(new Set(states.map((state) => state.product.report_type)).size).toBe(
      2,
    );
  });
});
