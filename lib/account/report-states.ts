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
  | { kind: "premium_included"; product: Product }
  | { kind: "not_purchased"; product: Product };

export function deriveAccountReportStates(input: {
  products: Product[];
  readyEntitlements: Entitlement[];
  reports: Report[];
  planKey: string;
}): AccountReportState[] {
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
      input.planKey === "premium"
        ? { kind: "premium_included", product }
        : { kind: "not_purchased", product },
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

  for (const kind of ["premium_included", "not_purchased"] as const) {
    const state = states.find((candidate) => candidate.kind === kind);
    if (state) return state.product.report_type as AccountReportType;
  }
  return undefined;
}
