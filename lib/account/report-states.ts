import { membershipPlanFor, PLAN_ALLOWANCES } from "@/lib/membership/plans";

export const accountReportTypes = [
  "career_purpose",
  "recovery_reflection",
] as const;

export type AccountReportType = (typeof accountReportTypes)[number];

type Product = {
  report_type: string;
  name: string;
  description: string;
  unit_amount: number | null;
  currency: string | null;
};

type Entitlement = {
  id: string;
  report_type: string;
  granted_at: string;
};

type Report = {
  id: string;
  report_type: string;
  status: string;
  created_at: string;
};

export type AccountReportState =
  | {
      kind: "purchased_unused";
      product: Product;
      entitlement: Entitlement;
    }
  | { kind: "generated"; product: Product; report: Report }
  /**
   * The reader holds an unused included report (Atlas: one per membership
   * year). Redeem it with CheckoutButton's credit action; it applies to any
   * report type, so every unbought report shows this state.
   */
  | { kind: "included_credit"; product: Product; creditsRemaining: number }
  /** Buy at the plan's price; Atlas members see `discountPercent` off. */
  | { kind: "not_purchased"; product: Product; discountPercent: number };

export function deriveAccountReportStates(input: {
  products: Product[];
  readyEntitlements: Entitlement[];
  reports: Report[];
  planKey: string;
  /** Unexpired `report.standard` credits remaining (account_credits). */
  includedReportCredits?: number;
}): AccountReportState[] {
  const creditsRemaining = Math.max(0, input.includedReportCredits ?? 0);
  const discountPercent =
    PLAN_ALLOWANCES[membershipPlanFor(input.planKey)].reportDiscountPercent;
  const products = new Map<AccountReportType, Product>();
  for (const product of input.products)
    if (
      accountReportTypes.includes(product.report_type as AccountReportType) &&
      !products.has(product.report_type as AccountReportType)
    )
      products.set(product.report_type as AccountReportType, product);

  const states: AccountReportState[] = [];
  for (const reportType of accountReportTypes) {
    const product = products.get(reportType);
    if (!product) continue;
    const entitlement = input.readyEntitlements.find(
      (candidate) => candidate.report_type === reportType,
    );
    if (entitlement) {
      states.push({ kind: "purchased_unused", product, entitlement });
      continue;
    }
    const report = input.reports.find(
      (candidate) => candidate.report_type === reportType,
    );
    if (report) {
      states.push({ kind: "generated", product, report });
      continue;
    }
    states.push(
      creditsRemaining > 0
        ? { kind: "included_credit", product, creditsRemaining }
        : { kind: "not_purchased", product, discountPercent },
    );
  }
  return states;
}

/**
 * Selects the one report action that receives accent emphasis in the account.
 * A paid unused entitlement wins; ties use the newest purchase. Included and
 * purchasable reports then follow the stable editorial order above.
 */
export function primaryAccountReportAction(
  states: AccountReportState[],
): AccountReportType | undefined {
  const purchased = states
    .filter(
      (
        state,
      ): state is Extract<AccountReportState, { kind: "purchased_unused" }> =>
        state.kind === "purchased_unused",
    )
    .sort((left, right) =>
      right.entitlement.granted_at.localeCompare(left.entitlement.granted_at),
    )[0];
  if (purchased) return purchased.product.report_type as AccountReportType;

  for (const kind of ["included_credit", "not_purchased"] as const) {
    const state = states.find((candidate) => candidate.kind === kind);
    if (state) return state.product.report_type as AccountReportType;
  }
  return undefined;
}
