import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:"),
);
const generatedAt = "2026-08-05T12:00:00Z";
const forecastSql = await fs.readFile(
  path.join(outputDir, "forecast_model.sql"),
  "utf8",
);
const months = [
  "Aug 2026",
  "Sep 2026",
  "Oct 2026",
  "Nov 2026",
  "Dec 2026",
  "Jan 2027",
  "Feb 2027",
  "Mar 2027",
  "Apr 2027",
  "May 2027",
  "Jun 2027",
  "Jul 2027",
  "Aug 2027",
  "Sep 2027",
  "Oct 2027",
  "Nov 2027",
  "Dec 2027",
  "Jan 2028",
];

const shared = {
  startingUsers: 500,
  personalPrice: 9.99,
  premiumPrice: 19.99,
  hosting: 250,
  advertising: 250,
  packPrice: 5,
  freePackRate: 0.08,
  personalPackRate: 0.03,
  premiumPackRate: 0.01,
  reportPrice: 14.99,
  personalDiscount: 0.1,
  premiumDiscount: 0.2,
  freeReportRate: 0.02,
  personalReportRate: 0.04,
  premiumReportRate: 0.02,
  premiumIncludedReports: 1 / 3,
  inputPrice: 0.25,
  outputPrice: 2,
  reportInputTokens: 15000,
  reportOutputTokens: 20000,
  reportAttempts: 1.1,
  natalInputTokens: 5000,
  natalOutputTokens: 2000,
  cardRate: 0.029,
  fixedFee: 0.3,
  billingRate: 0.007,
};

const reportAiUnit =
  ((shared.reportInputTokens / 1_000_000) * shared.inputPrice +
    (shared.reportOutputTokens / 1_000_000) * shared.outputPrice) *
  shared.reportAttempts;
const natalAiUnit =
  (shared.natalInputTokens / 1_000_000) * shared.inputPrice +
  (shared.natalOutputTokens / 1_000_000) * shared.outputPrice;

const scenarioDefinitions = [
  {
    name: "Conservative",
    mix: [0.85, 0.12, 0.03],
    cac: 25,
    organic: 0.005,
    churn: 0.04,
  },
  { name: "Base", mix: [0.8, 0.16, 0.04], cac: 20, organic: 0.01, churn: 0.03 },
  {
    name: "Upside",
    mix: [0.7, 0.23, 0.07],
    cac: 15,
    organic: 0.015,
    churn: 0.025,
  },
];

function runScenario(definition) {
  const [freeMix, personalMix, premiumMix] = definition.mix;
  let openingUsers = shared.startingUsers;
  const rows = [];
  for (let index = 0; index < months.length; index += 1) {
    const paidAdds = shared.advertising / definition.cac;
    const organicAdds = openingUsers * definition.organic;
    const churned = openingUsers * definition.churn;
    const closingUsers = openingUsers + paidAdds + organicAdds - churned;
    const activeUsers = (openingUsers + closingUsers) / 2;
    const freeUsers = activeUsers * freeMix;
    const personalUsers = activeUsers * personalMix;
    const premiumUsers = activeUsers * premiumMix;
    const subscriptionRevenue =
      personalUsers * shared.personalPrice + premiumUsers * shared.premiumPrice;
    const packTransactions =
      freeUsers * shared.freePackRate +
      personalUsers * shared.personalPackRate +
      premiumUsers * shared.premiumPackRate;
    const packRevenue = packTransactions * shared.packPrice;
    const paidReports =
      freeUsers * shared.freeReportRate +
      personalUsers * shared.personalReportRate +
      premiumUsers * shared.premiumReportRate;
    const reportRevenue =
      freeUsers * shared.freeReportRate * shared.reportPrice +
      personalUsers *
        shared.personalReportRate *
        shared.reportPrice *
        (1 - shared.personalDiscount) +
      premiumUsers *
        shared.premiumReportRate *
        shared.reportPrice *
        (1 - shared.premiumDiscount);
    const totalRevenue = subscriptionRevenue + packRevenue + reportRevenue;
    const includedReports = premiumUsers * shared.premiumIncludedReports;
    const reportAiCost = (paidReports + includedReports) * reportAiUnit;
    const weightedCharts = freeMix * 1 + personalMix * 1.4 + premiumMix * 2;
    const natalInterpretations = (paidAdds + organicAdds) * weightedCharts;
    const natalAiCost = natalInterpretations * natalAiUnit;
    const aiCost = reportAiCost + natalAiCost;
    const paymentFees =
      subscriptionRevenue * (shared.cardRate + shared.billingRate) +
      (personalUsers + premiumUsers) * shared.fixedFee +
      packRevenue * shared.cardRate +
      packTransactions * shared.fixedFee +
      reportRevenue * shared.cardRate +
      paidReports * shared.fixedFee;
    const totalCost =
      aiCost + paymentFees + shared.hosting + shared.advertising;
    const contribution = totalRevenue - totalCost;
    rows.push({
      month: months[index],
      openingUsers,
      paidAdds,
      organicAdds,
      churned,
      closingUsers,
      activeUsers,
      freeUsers,
      personalUsers,
      premiumUsers,
      subscriptionRevenue,
      packRevenue,
      reportRevenue,
      totalRevenue,
      paidReports,
      includedReports,
      aiCost,
      paymentFees,
      hosting: shared.hosting,
      advertising: shared.advertising,
      totalCost,
      contribution,
      margin: contribution / totalRevenue,
    });
    openingUsers = closingUsers;
  }
  const totals = rows.reduce(
    (acc, row) => {
      for (const field of [
        "totalRevenue",
        "aiCost",
        "paymentFees",
        "hosting",
        "advertising",
        "totalCost",
        "contribution",
      ])
        acc[field] += row[field];
      return acc;
    },
    {
      totalRevenue: 0,
      aiCost: 0,
      paymentFees: 0,
      hosting: 0,
      advertising: 0,
      totalCost: 0,
      contribution: 0,
    },
  );
  return {
    definition,
    rows,
    totals,
    endingUsers: rows.at(-1).closingUsers,
    endingContribution: rows.at(-1).contribution,
  };
}

const scenarios = scenarioDefinitions.map(runScenario);
const base = scenarios[1];
const flat = runScenario({
  name: "Flat 500",
  mix: [0.8, 0.16, 0.04],
  cac: Number.POSITIVE_INFINITY,
  organic: 0,
  churn: 0,
});
const contributionPerActiveUser =
  (base.rows[0].totalRevenue - base.rows[0].paymentFees - base.rows[0].aiCost) /
  base.rows[0].activeUsers;
const breakEvenUsers =
  (shared.hosting + shared.advertising) / contributionPerActiveUser;

const summaryMetrics = [
  {
    starting_users: shared.startingUsers,
    month_18_users: base.endingUsers,
    revenue_18m: base.totals.totalRevenue,
    contribution_18m: base.totals.contribution,
    ai_cost_18m: base.totals.aiCost,
    break_even_users: breakEvenUsers,
    month_1_contribution: base.rows[0].contribution,
    month_18_contribution: base.rows.at(-1).contribution,
  },
];

const monthlyTrend = base.rows.flatMap((row) => [
  { month: row.month, series: "Revenue", value: row.totalRevenue },
  { month: row.month, series: "Total cost", value: row.totalCost },
]);

const costComposition = [
  { cost: "Ops / hosting", value: base.totals.hosting },
  { cost: "Advertising", value: base.totals.advertising },
  { cost: "Payment fees", value: base.totals.paymentFees },
  { cost: "AI model cost", value: base.totals.aiCost },
];

const scenarioSummary = scenarios.map((scenario) => ({
  scenario: scenario.definition.name,
  tier_mix: `${Math.round(scenario.definition.mix[0] * 100)}% / ${Math.round(scenario.definition.mix[1] * 100)}% / ${Math.round(scenario.definition.mix[2] * 100)}%`,
  paid_cac: scenario.definition.cac,
  organic_rate: scenario.definition.organic,
  churn_rate: scenario.definition.churn,
  month_18_users: scenario.endingUsers,
  revenue_18m: scenario.totals.totalRevenue,
  contribution_18m: scenario.totals.contribution,
  contribution_margin:
    scenario.totals.contribution / scenario.totals.totalRevenue,
  month_18_contribution: scenario.endingContribution,
}));

const tierEconomics = [
  {
    tier: "Free",
    share: 0.8,
    monthly_price: 0,
    monthly_revenue_per_user: 0.08 * 5 + 0.02 * 14.99,
    variable_cost_per_user:
      0.08 * 5 * 0.029 +
      0.08 * 0.3 +
      0.02 * 14.99 * 0.029 +
      0.02 * 0.3 +
      0.02 * reportAiUnit,
    key_entitlement: "1 natal chart; 1 primary daily reading/week",
  },
  {
    tier: "Personal",
    share: 0.16,
    monthly_price: 9.99,
    monthly_revenue_per_user: 9.99 + 0.03 * 5 + 0.04 * 14.99 * 0.9,
    variable_cost_per_user:
      9.99 * 0.036 +
      0.3 +
      0.03 * 5 * 0.029 +
      0.03 * 0.3 +
      0.04 * 14.99 * 0.9 * 0.029 +
      0.04 * 0.3 +
      0.04 * reportAiUnit,
    key_entitlement:
      "2 charts; daily primary reading; 2 companion readings/month",
  },
  {
    tier: "Premium",
    share: 0.04,
    monthly_price: 19.99,
    monthly_revenue_per_user: 19.99 + 0.01 * 5 + 0.02 * 14.99 * 0.8,
    variable_cost_per_user:
      19.99 * 0.036 +
      0.3 +
      0.01 * 5 * 0.029 +
      0.01 * 0.3 +
      0.02 * 14.99 * 0.8 * 0.029 +
      0.02 * 0.3 +
      (0.02 + 1 / 3) * reportAiUnit,
    key_entitlement:
      "5 charts; emailed primary reading; 10 companion readings/month; quarterly report credit",
  },
];

const artifact = {
  surface: "report",
  manifest: {
    version: 1,
    surface: "report",
    title: "Celestial Atlas 18-Month Monetization Forecast",
    description:
      "A decision-ready operating contribution forecast for a 500-user starting base.",
    generatedAt,
    cards: [
      {
        id: "revenue_card",
        description: "Gross revenue across the 18-month base case.",
        dataset: "summary_metrics",
        sourceId: "forecast_model",
        metrics: [
          { label: "18M revenue", field: "revenue_18m", format: "currency" },
        ],
      },
      {
        id: "contribution_card",
        description:
          "Revenue after model, payment, hosting/operations, and advertising costs.",
        dataset: "summary_metrics",
        sourceId: "forecast_model",
        metrics: [
          {
            label: "18M operating contribution",
            field: "contribution_18m",
            format: "currency",
          },
        ],
      },
      {
        id: "users_card",
        description:
          "Closing users in Month 18 after paid and organic additions and churn.",
        dataset: "summary_metrics",
        sourceId: "forecast_model",
        metrics: [
          {
            label: "Month 18 users",
            field: "month_18_users",
            format: "number",
          },
        ],
      },
      {
        id: "ai_card",
        description:
          "GPT-5 mini cost for long reports and new-user natal interpretations.",
        dataset: "summary_metrics",
        sourceId: "forecast_model",
        metrics: [
          { label: "18M AI cost", field: "ai_cost_18m", format: "currency" },
        ],
      },
      {
        id: "breakeven_card",
        description:
          "Active users required to cover the $500 combined monthly fixed spend at base unit economics.",
        dataset: "summary_metrics",
        sourceId: "forecast_model",
        metrics: [
          {
            label: "Break-even active users",
            field: "break_even_users",
            format: "number",
          },
        ],
      },
    ],
    charts: [
      {
        id: "scenario_chart",
        title: "Operating contribution by scenario",
        subtitle: "18-month total, USD",
        type: "bar",
        dataset: "scenario_summary",
        sourceId: "forecast_model",
        valueFormat: "currency",
        encodings: {
          x: { field: "scenario", type: "nominal", label: "Scenario" },
          y: {
            field: "contribution_18m",
            type: "quantitative",
            label: "18M contribution",
          },
          tooltip: [
            {
              field: "month_18_users",
              type: "quantitative",
              label: "Month 18 users",
              format: "number",
            },
          ],
        },
      },
    ],
    tables: [],
    sources: [
      {
        id: "forecast_model",
        label: "Celestial Atlas 18-month forecast model",
        path: "celestial-atlas-18-month-monetization-model.xlsx",
      },
      {
        id: "openai_pricing",
        label: "OpenAI GPT-5 mini pricing",
        path: "https://developers.openai.com/api/docs/models/gpt-5-mini",
      },
      {
        id: "stripe_pricing",
        label: "Stripe pricing",
        path: "https://stripe.com/pricing",
      },
    ],
    blocks: [
      {
        id: "title",
        type: "markdown",
        body: "# Celestial Atlas 18-Month Monetization Forecast",
      },
      {
        id: "executive_summary",
        type: "markdown",
        sourceId: "forecast_model",
        body: `## Executive Summary\n\n- **The revised $500 combined monthly expense ceiling materially improves the model.** The base case generates **$${Math.round(base.totals.totalRevenue).toLocaleString("en-US")}** of gross revenue and **$${Math.round(base.totals.contribution).toLocaleString("en-US")}** of operating contribution over 18 months.\n- **The business is contribution-positive from Month 1.** Monthly contribution begins near **$${Math.round(base.rows[0].contribution).toLocaleString("en-US")}** and reaches about **$${Math.round(base.rows.at(-1).contribution).toLocaleString("en-US")}** by Month 18.\n- **AI model cost is immaterial at this scale.** GPT-5 mini usage totals about **$${base.totals.aiCost.toFixed(0)}**, versus **$${base.totals.paymentFees.toFixed(0)}** of payment fees and **$${(base.totals.hosting + base.totals.advertising).toLocaleString("en-US")}** of combined fixed spend.\n- **The main commercial risk is paid conversion and retention, not token spend.** The base case assumes a 20% paid mix, $20 paid CAC, 1% monthly organic additions, and 3% monthly churn.`,
      },
      {
        id: "metrics",
        type: "metric-strip",
        cardIds: [
          "revenue_card",
          "contribution_card",
          "users_card",
          "ai_card",
          "breakeven_card",
        ],
      },
      {
        id: "growth_finding",
        type: "markdown",
        sourceId: "forecast_model",
        body: `## Revenue clears the fixed-cost floor immediately\n\nWith $250 per month assigned to advertising, paid acquisition falls to 12.5 users per month at the assumed $20 CAC. The active base therefore grows modestly from 500 to about **${Math.round(base.endingUsers)} users** by Month 18. Even with that slower growth, revenue remains comfortably above operating cost throughout the forecast.\n\nIf the user base stays completely flat at 500, the same tier mix and purchase assumptions still produce about **$${Math.round(flat.totals.totalRevenue).toLocaleString("en-US")}** of revenue and **$${Math.round(flat.totals.contribution).toLocaleString("en-US")}** of contribution over 18 months. Growth adds upside, but it is not required for base contribution profitability.`,
      },
      {
        id: "cost_finding",
        type: "markdown",
        sourceId: "forecast_model",
        body: `## Hosting, advertising, and payment fees dominate the cost base\n\nOver 18 months, hosting/operations and advertising each cost **$4,500**. Payment processing adds about **$${Math.round(base.totals.paymentFees).toLocaleString("en-US")}**, while AI generation costs only about **$${base.totals.aiCost.toFixed(0)}**. The model therefore does not support weakening the paid tiers merely to save tokens.\n\nThe practical cost-control priority is transaction design: bundle low-price daily readings into credits, limit avoidable micro-transactions, and measure international-card and currency-conversion fees before expanding the forecast.`,
      },
      {
        id: "scenario_finding",
        type: "markdown",
        sourceId: "forecast_model",
        body: `## The downside remains positive, but its user base contracts\n\nThe Conservative case ends with about **${Math.round(scenarios[0].endingUsers)} users** because 4% monthly churn exceeds paid and organic additions. It still produces about **$${Math.round(scenarios[0].totals.contribution).toLocaleString("en-US")}** of 18-month operating contribution under the reduced fixed-cost structure. The Upside case reaches about **${Math.round(scenarios[2].endingUsers)} users** and **$${Math.round(scenarios[2].totals.contribution).toLocaleString("en-US")}** of contribution.\n\nThis makes retention the first launch gate: a profitable but shrinking user base is not a healthy long-term outcome.`,
      },
      {
        id: "scenario_chart_note",
        type: "markdown",
        body: "The three cases vary tier mix, CAC, organic additions, and churn while holding prices, purchase rates, model usage, and fixed monthly spend constant.",
      },
      { id: "scenario_chart", type: "chart", chartId: "scenario_chart" },
      {
        id: "tier_finding",
        type: "markdown",
        sourceId: "forecast_model",
        body: "## Paid tiers carry the economics\n\nFree users contribute add-on and report revenue, but Personal and Premium memberships generate the recurring margin that covers the fixed operating base. The proposed prices remain cost-effective: neither AI usage nor the included Premium report credit creates meaningful margin pressure at the modeled usage levels.\n\nKeep report purchases à la carte for Personal, retain a quarterly standard-report credit for Premium, and use the $5 purchase as a multi-reading credit pack rather than a single reading.",
      },
      {
        id: "recommendations",
        type: "markdown",
        body: "## Recommended next steps\n\n1. **Launch-test $9.99 Personal and $19.99 Premium** before changing entitlements; the present price ladder covers modeled variable costs comfortably.\n2. **Set commercial gates around conversion and retention:** paid mix, 30/60/90-day retention, tier migration, and churn by tier.\n3. **Instrument unit usage:** daily-reading frequency, pack attach rate, report attach rate, model tokens, retries, and email delivery cost.\n4. **Review the $250 advertising allocation after 60–90 days.** If CAC is above $20 or retention is below plan, do not scale spend until the funnel is repaired.\n5. **Complete the existing legal, licensing, security, and operational release gates before enabling paid reports.** This forecast is planning analysis, not release approval.",
      },
      {
        id: "further_questions",
        type: "markdown",
        body: "## Further questions\n\n- What paid conversion rate is realistic after a 30-day launch cohort?\n- Does Premium email delivery improve retention enough to justify its operational overhead?\n- How many users choose annual billing, and how does that change cash timing and payment fees?\n- What share of payments will incur international-card or currency-conversion charges?\n- Should the $250 advertising budget be concentrated on paid acquisition or partly reserved for creative and conversion testing?",
      },
      {
        id: "caveats",
        type: "markdown",
        body: "## Caveats and assumptions\n\nThis is an operating contribution forecast, not GAAP net income or cash flow. It excludes founder/staff compensation, customer support, legal/accounting, taxes, refunds and chargebacks, email delivery, monitoring, storage overages, app-store commissions, international-card and FX surcharges, and annual-plan cash timing. The $500 monthly expense ceiling is modeled as $250 hosting/operations plus $250 advertising; change those two workbook inputs if a different allocation is intended.\n\nDaily readings currently use deterministic/template logic and therefore carry no OpenAI token cost. Long reports and natal interpretations use GPT-5 mini planning allowances. OpenAI lists GPT-5 mini at $0.25 per million input tokens and $2.00 per million output tokens; Stripe assumptions use 2.9% plus $0.30 for domestic online cards and 0.7% of subscription billing volume. Actual usage and fees must replace these assumptions after launch.",
      },
    ],
  },
  snapshot: {
    version: 1,
    generatedAt,
    status: "ready",
    datasets: {
      summary_metrics: summaryMetrics,
      monthly_trend: monthlyTrend,
      cost_composition: costComposition,
      scenario_summary: scenarioSummary,
      tier_economics: tierEconomics,
    },
    accessIssues: [],
  },
  sources: [
    {
      id: "forecast_model",
      path: "forecast_model.sql",
      query: {
        engine: "postgresql",
        language: "sql",
        sql: forecastSql,
        description:
          "Formula-driven 18-month Celestial Atlas monetization model using the Assumptions, Monthly Forecast, and Scenario Analysis sheets, with an equivalent SQL reproducibility specification.",
        tables_used: ["Assumptions", "Monthly Forecast", "Scenario Analysis"],
        executed_at: generatedAt,
      },
    },
    {
      id: "openai_pricing",
      query: {
        engine: "web",
        language: "html",
        url: "https://developers.openai.com/api/docs/models/gpt-5-mini",
        description: "Official GPT-5 mini token pricing.",
        executed_at: generatedAt,
      },
    },
    {
      id: "stripe_pricing",
      query: {
        engine: "web",
        language: "html",
        url: "https://stripe.com/pricing",
        description: "Official Stripe payment and Billing pricing.",
        executed_at: generatedAt,
      },
    },
  ],
};

await fs.writeFile(
  path.join(outputDir, "artifact.json"),
  JSON.stringify(artifact, null, 2),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      artifact: path.join(outputDir, "artifact.json"),
      headline: summaryMetrics[0],
      scenarios: scenarioSummary,
      flat: {
        revenue_18m: flat.totals.totalRevenue,
        contribution_18m: flat.totals.contribution,
      },
    },
    null,
    2,
  ),
);
