/**
 * Canonical two-tier membership catalogue (client-safe facts only).
 *
 * Celestial Atlas sells exactly two levels:
 *  - Free  (`free`)    — who you are: your chart, which does not change.
 *  - Atlas (`premium`) — what is happening to you now: a reading every morning.
 *
 * The paid level keeps the historical database key `premium` so existing
 * subscriptions, foreign keys and Stripe metadata stay valid. Every reader-
 * facing surface must call it "Atlas". The legacy `personal` key is retired
 * (inactive in `commerce_plans`) and must not be offered anywhere.
 *
 * Server-authoritative allowances live in `public.plan_capabilities`; the
 * numbers here describe the catalogue for presentation and must match the
 * migration `supabase/migrations/*_two_tier_atlas_membership.sql`.
 */

export const ATLAS_PLAN_KEY = "premium" as const;
export type SellablePlanKey = typeof ATLAS_PLAN_KEY;
export type MembershipPlanId = "free" | "atlas";
export type BillingInterval = "month" | "year";

export const ATLAS_TRIAL_DAYS = 7;

export const ATLAS_PRICES: Record<
  BillingInterval,
  { unitAmount: number; currency: "usd"; display: string }
> = {
  month: { unitAmount: 1299, currency: "usd", display: "$12.99" },
  year: { unitAmount: 9900, currency: "usd", display: "$99" },
};

export const PLAN_ALLOWANCES = {
  free: {
    savedCharts: 1,
    personalReadingsPerWeek: 1,
    dailyPersonalReading: false,
    weeklyReading: false,
    companionReadingsPerMonth: 0,
    tarotSpreads: ["daily"] as const,
    tarotJournal: false,
    includedReportsPerYear: 0,
    reportDiscountPercent: 0,
  },
  atlas: {
    savedCharts: 5,
    personalReadingsPerWeek: 7,
    dailyPersonalReading: true,
    weeklyReading: true,
    companionReadingsPerMonth: 10,
    tarotSpreads: [
      "daily",
      "past_present_future",
      "love",
      "celtic_cross",
      "grand",
    ] as const,
    tarotJournal: true,
    includedReportsPerYear: 1,
    reportDiscountPercent: 20,
  },
} as const;

/** Maps a database plan key to the reader-facing plan identity. */
export function membershipPlanFor(
  planKey: string | null | undefined,
): MembershipPlanId {
  return planKey === ATLAS_PLAN_KEY ? "atlas" : "free";
}

export function isAtlasMember(planKey: string | null | undefined) {
  return membershipPlanFor(planKey) === "atlas";
}

/** The only reader-facing name of the paid level, in every locale. */
export const ATLAS_PLAN_NAME = "Atlas";

export const BILLING_INTERVALS = [
  "month",
  "year",
] as const satisfies readonly BillingInterval[];

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

/** Whole-percent saving of paying yearly instead of twelve monthly payments. */
export const ATLAS_YEARLY_SAVING_PERCENT = Math.round(
  (1 - ATLAS_PRICES.year.unitAmount / (ATLAS_PRICES.month.unitAmount * 12)) *
    100,
);

/** Where Google Play subscribers manage or cancel Atlas. */
export const GOOGLE_PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions";

export type SubscriptionProvider = "stripe" | "google_play";

/** Tarot access, derived from the catalogue so UI and server agree. */
export type TarotSpreadId = (typeof PLAN_ALLOWANCES.atlas.tarotSpreads)[number];

export function tarotSpreadIncluded(
  planKey: string | null | undefined,
  spread: TarotSpreadId,
) {
  return (
    PLAN_ALLOWANCES[membershipPlanFor(planKey)]
      .tarotSpreads as readonly string[]
  ).includes(spread);
}

export function tarotJournalIncluded(planKey: string | null | undefined) {
  return PLAN_ALLOWANCES[membershipPlanFor(planKey)].tarotJournal;
}
