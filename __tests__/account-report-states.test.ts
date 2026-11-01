import { describe, expect, it } from "vitest";
import {
  deriveAccountReportStates,
  primaryAccountReportAction,
} from "@/lib/account/report-states";

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
      planKey: "free",
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
      planKey: "free",
    });
    expect(state.kind).toBe("purchased_unused");
  });

  it("offers an unused included Atlas report before a purchase", () => {
    expect(
      deriveAccountReportStates({
        products,
        readyEntitlements: [],
        reports: [],
        planKey: "premium",
        includedReportCredits: 1,
      }),
    ).toEqual([
      { kind: "included_credit", product: products[0], creditsRemaining: 1 },
      { kind: "included_credit", product: products[1], creditsRemaining: 1 },
    ]);
  });

  it("prices reports at 20% off for Atlas once the included report is used", () => {
    const atlas = deriveAccountReportStates({
      products,
      readyEntitlements: [],
      reports: [],
      planKey: "premium",
      includedReportCredits: 0,
    });
    expect(atlas.map((state) => state.kind)).toEqual([
      "not_purchased",
      "not_purchased",
    ]);
    expect(atlas[0]).toMatchObject({ discountPercent: 20 });
    const free = deriveAccountReportStates({
      products,
      readyEntitlements: [],
      reports: [],
      planKey: "free",
    });
    expect(free[0]).toMatchObject({
      kind: "not_purchased",
      discountPercent: 0,
    });
    const retired = deriveAccountReportStates({
      products,
      readyEntitlements: [],
      reports: [],
      planKey: "personal",
    });
    expect(retired[0]).toMatchObject({ discountPercent: 0 });
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

  it("emphasizes only the most recently purchased unused entitlement", () => {
    const states = deriveAccountReportStates({
      products,
      readyEntitlements: [
        {
          id: "older-career-entitlement",
          report_type: "career_purpose",
          granted_at: "2026-08-08T08:00:00Z",
        },
        {
          id: "newer-recovery-entitlement",
          report_type: "recovery_reflection",
          granted_at: "2026-08-09T08:00:00Z",
        },
      ],
      reports: [],
      planKey: "free",
    });

    const primary = primaryAccountReportAction(states);
    expect(primary).toBe("recovery_reflection");
    expect(
      states.filter((state) => state.product.report_type === primary),
    ).toHaveLength(1);
  });

  it("uses stable editorial order when there is no unused purchase", () => {
    const included = deriveAccountReportStates({
      products,
      readyEntitlements: [],
      reports: [],
      planKey: "premium",
      includedReportCredits: 1,
    });
    const purchasable = deriveAccountReportStates({
      products,
      readyEntitlements: [],
      reports: [],
      planKey: "free",
    });

    expect(primaryAccountReportAction(included)).toBe("career_purpose");
    expect(primaryAccountReportAction(purchasable)).toBe("career_purpose");
  });
});
