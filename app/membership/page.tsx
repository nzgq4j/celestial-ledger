import { MembershipExperience } from "@/components/MembershipExperience";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPageMetadata } from "@/lib/seo";
import { commerceFlags } from "@/lib/commerce/flags";
import { effectivePlanKeyForUser } from "@/lib/entitlements/server";
import {
  ATLAS_PLAN_KEY,
  isBillingInterval,
  membershipPlanFor,
  type BillingInterval,
  type SubscriptionProvider,
} from "@/lib/membership/plans";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Free and Atlas Membership",
  description:
    "Your natal chart is free. Atlas adds a personal astrology reading every morning, a weekly reading every Monday, all five tarot spreads and an included detailed report each year.",
  path: "/membership",
  keywords: ["astrology membership", "daily astrology readings", "Atlas"],
});

const CURRENT_STATUSES = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "paused",
];
const NEVER_STARTED = new Set(["incomplete", "incomplete_expired"]);

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const flags = commerceFlags();
  const admin = createAdminClient();

  const { data: priceRows } = await admin
    .from("commerce_plan_prices")
    .select("billing_interval")
    .eq("plan_key", ATLAS_PLAN_KEY)
    .eq("active", true)
    .not("stripe_price_id", "is", null);
  const availableIntervals = [
    ...new Set(
      (priceRows ?? [])
        .map((row) => row.billing_interval)
        .filter(isBillingInterval),
    ),
  ] satisfies BillingInterval[];

  let planId: "free" | "atlas" = "free";
  let provider: SubscriptionProvider | null = null;
  // Anonymous visitors are shown the trial; checkout makes the final,
  // Stripe-verified decision (lib/stripe/trial.ts).
  let trialEligible = true;
  if (data.user) {
    const [planKey, { data: history }] = await Promise.all([
      effectivePlanKeyForUser(data.user.id),
      admin
        .from("account_subscriptions")
        .select("status,provider")
        .eq("user_id", data.user.id),
    ]);
    planId = membershipPlanFor(planKey);
    const current = (history ?? []).find((row) =>
      CURRENT_STATUSES.includes(row.status),
    );
    provider =
      current?.provider === "google_play"
        ? "google_play"
        : current
          ? "stripe"
          : null;
    trialEligible = !(history ?? []).some(
      (row) => !NEVER_STARTED.has(row.status),
    );
  }

  return (
    <MembershipExperience
      signedIn={Boolean(data.user)}
      subscriptionsEnabled={flags.checkout && flags.subscriptions}
      availableIntervals={availableIntervals}
      planId={planId}
      provider={provider}
      trialEligible={trialEligible}
    />
  );
}
