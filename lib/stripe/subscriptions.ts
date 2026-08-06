import type Stripe from "stripe";

export function subscriptionPeriod(subscription: Stripe.Subscription) {
  const starts = subscription.items.data.map(
    (item) => item.current_period_start,
  );
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return {
    start: starts.length ? Math.min(...starts) : undefined,
    end: ends.length ? Math.max(...ends) : undefined,
  };
}

export function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}

export function subscriptionPlanKey(subscription: Stripe.Subscription) {
  return (
    subscription.metadata.celestial_atlas_plan_key ??
    subscription.items.data[0]?.price.metadata.celestial_atlas_plan_key
  );
}
