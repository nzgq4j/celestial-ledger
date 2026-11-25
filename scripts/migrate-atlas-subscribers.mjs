// Moves existing Stripe Atlas subscribers to the USD 6.99 yearly price at their
// next renewal. Members keep their current price and access until the end of
// the period they have paid for; from the next renewal they are billed
// USD 6.99 a year. Nobody is charged early or refunded.
//
// Dry run (default; reads only):
//   STRIPE_SECRET_KEY=… ATLAS_APP_PRICE_ID=price_… ATLAS_LEGACY_PRICE_IDS=price_a,price_b node scripts/migrate-atlas-subscribers.mjs
// Apply (changes live subscriptions; owner approval required):
//   … node scripts/migrate-atlas-subscribers.mjs --apply
//
// Output contains subscription IDs and counts only, never names or emails.
import Stripe from "stripe";

const apply = process.argv.includes("--apply");
const secret = process.env.STRIPE_SECRET_KEY;
const target = process.env.ATLAS_APP_PRICE_ID;
// Only subscriptions on these Atlas prices are moved (from commerce_plan_prices).
const legacy = new Set(
  (process.env.ATLAS_LEGACY_PRICE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
if (!secret || !target || legacy.size === 0) {
  console.error(
    "Set STRIPE_SECRET_KEY, ATLAS_APP_PRICE_ID and ATLAS_LEGACY_PRICE_IDS.",
  );
  process.exit(1);
}
const stripe = new Stripe(secret, { maxNetworkRetries: 2 });

const price = await stripe.prices.retrieve(target);
if (
  price.unit_amount !== 699 ||
  price.currency !== "usd" ||
  price.recurring?.interval !== "year" ||
  !price.active
) {
  console.error(
    "ATLAS_APP_PRICE_ID is not an active USD 6.99 yearly price. Nothing changed.",
  );
  process.exit(1);
}

const summary = {
  scheduled: 0,
  alreadyOnTarget: 0,
  alreadyScheduled: 0,
  cancelling: 0,
  skipped: 0,
};
for (const status of ["active", "trialing", "past_due"]) {
  for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) {
    if (sub.items.data.length !== 1) {
      summary.skipped += 1;
      console.warn(`${sub.id}: more than one item, review by hand.`);
      continue;
    }
    const item = sub.items.data[0];
    if (item.price.id === target) {
      summary.alreadyOnTarget += 1;
      continue;
    }
    if (!legacy.has(item.price.id)) {
      summary.skipped += 1;
      continue;
    }
    if (sub.cancel_at_period_end) {
      summary.cancelling += 1;
      continue;
    }
    if (sub.schedule) {
      summary.alreadyScheduled += 1;
      console.warn(`${sub.id}: already has a schedule, review by hand.`);
      continue;
    }
    summary.scheduled += 1;
    if (!apply) {
      console.log(
        `${sub.id}: would move from ${item.price.id} to ${target} at renewal.`,
      );
      continue;
    }
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: sub.id,
    });
    const current = schedule.phases[0];
    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: item.price.id, quantity: item.quantity ?? 1 }],
          start_date: current.start_date,
          end_date: current.end_date,
        },
        {
          items: [{ price: target, quantity: 1 }],
          iterations: 1,
          proration_behavior: "none",
        },
      ],
    });
    console.log(`${sub.id}: moves to ${target} at renewal.`);
  }
}
console.log(
  JSON.stringify({ mode: apply ? "applied" : "dry-run", ...summary }),
);
