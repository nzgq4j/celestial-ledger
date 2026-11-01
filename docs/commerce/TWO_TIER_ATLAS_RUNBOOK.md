# Two-tier membership (Free and Atlas): operator runbook

Migration: `supabase/migrations/20261101090000_two_tier_atlas_membership.sql`
Forward recovery: `docs/commerce/TWO_TIER_ATLAS_FORWARD_RECOVERY.sql`
Google Pay: `docs/commerce/google-pay.md`

Celestial Atlas sells two levels. The paid level keeps the database plan key
`premium` (`ATLAS_PLAN_KEY` in `lib/membership/plans.ts`) and is always shown to
readers as **Atlas**. `personal` is retired: its row stays, inactive, and is never
offered or made effective.

|                         | Free                                        | Atlas (`premium`)                                                                                                       |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Price                   | $0                                          | $12.99 a month or $99 a year (USD), 7-day free trial for first-time subscribers                                         |
| Saved charts            | 1                                           | 5                                                                                                                       |
| Personal daily readings | 1 a week (`daily_reading.personal`, `week`) | primary chart every day (`daily_reading.primary`) + 10 companion readings per billing month (`daily_reading.companion`) |
| Weekly reading          | no                                          | every week (`weekly_reading.primary`, 1/`week`)                                                                         |
| Tarot                   | one-card daily draw (`tarot.spreads`)       | all five spreads + journal (`tarot.spreads`, `tarot.journal`)                                                           |
| Detailed reports        | standard price                              | 1 included per membership year (`report.standard_credit`, 1/`year`), then 20% off (`report.discount_percent` 20)        |

## What the migration does

All changes are additive; no row is deleted.

1. `commerce_plans`: `premium.name = 'Atlas'`; `personal.active = false`. Personal
   report prices are deactivated. Tarot decks with `minimum_plan = 'personal'`
   move to `premium`.
2. Replaces the auto-named `period` checks on `plan_capabilities` and
   `capability_grants` with named, wider checks that add `'year'`.
3. Creates `public.commerce_plan_prices` (several prices per plan, Stripe and
   Google Play mapping). RLS: `anon`/`authenticated` read active rows only;
   `service_role` has full access. Seeds Atlas **monthly 1299 USD** and
   **yearly 9900 USD**, `trial_days = 7`, **inactive**, `stripe_price_id = NULL`.
   Checkout answers `409 "Atlas membership is not yet available."` until the
   prices are activated (step 4 below), and the membership page disables the
   Atlas button.
4. Upserts the Atlas and Free capabilities in the table above. Free values are
   restated unchanged. The retired Atlas report discount and report credit are
   un-retired (`configuration` no longer has `retired: true`).
5. Reactivates the existing Atlas report prices whose amount is exactly 80% of
   the active standard price. The catalogue already holds them
   (`recovery_reflection` 400 vs 500, `career_purpose` 1200 vs 1500, Stripe
   prices `price_1U1iiCLq4GnupuQQlSJzplCn` and `price_1U1iiKLq4GnupuQQtk88MZ7B`),
   so no new Stripe report price is needed. The migration prints a notice with
   the count.
6. Adds `private.membership_period_window(user, plan, period)` (day, week,
   billing_month, quarter, **year**) and rewrites
   `public.daily_reading_allowance` on top of it (same signature and grants).
   A membership year runs from the anniversaries of the current subscription's
   `created_at`. Without a subscription, the calendar year (UTC) applies.
7. Google Play provider columns on `account_subscriptions` (see the contract
   below) and `pending_chart_claims.requested_billing_interval`.
8. Adds `public.grant_annual_report_credit(user, source_reference, granted_at)`
   and rewrites `public.record_paid_subscription_invoice` (same signature and
   grants) to call it for Stripe rows only.

### Included report: why credits from the paid-invoice ledger

Two designs were possible: count reports generated "through the inclusion" in
the trailing year, or issue one `account_credits` row a year from the paid
invoice ledger. The migration uses **credits**, because:

- The machinery already exists end to end: `account_credits` (`report.standard`),
  `credit_report_eligibility`, `redeem_report_credit` (atomic, idempotent,
  creates a normal paid entitlement), `CheckoutButton`'s credit action and
  `reverse_paid_subscription_invoice` (refunds revoke an unused credit).
- A credit is issued only from a **paid** period. The `$0` trial invoice never
  issues one (the webhook returns `unpaid_period` before recording), so a trial
  cannot be used to take a free report and cancel.
- Counting generated reports would need a new marker on `orders`, and a report
  queued but failed or deleted would make the rule ambiguous.

Rule (`grant_annual_report_credit`): a paid Atlas period issues one credit
(12-month expiry) unless the account already received a subscription credit
in the trailing year (less seven days of tolerance for billing-date drift).
Monthly members get it on the first paid month, then on the twelfth renewal;
yearly members get it on each renewal. Cancelling and resubscribing in the same
year issues nothing new. A credit from a refunded period that was never
redeemed does not count, so the next paid period re-issues it. The call is
idempotent per source reference. Once the credit is used (or if none is
available), Atlas members buy at the Atlas price, which is 20% off.

`app/api/reports/route.ts` no longer queues complimentary reports for Atlas
members. Without an entitlement, only site administrators can queue a report
while checkout is enabled.

### Free-trial rule (7 days)

`subscription_data.trial_period_days` is sent only when **all** of these hold
(`lib/stripe/trial.ts`):

- no `account_subscriptions` row for the account (any provider) has a status
  other than `incomplete`/`incomplete_expired`;
- no Stripe subscription of the account's customer (or, for checkout-led signup,
  of any Stripe customer with the same email) ever started or had a trial;
- the price row has `trial_days > 0`.

Any lookup failure denies the trial. Checkout then still proceeds at full
price. With a trial, Checkout always collects a payment method and the trial
cancels if none is present at the end
(`trial_settings.end_behavior.missing_payment_method = cancel`).

## Operator steps

### 1. Before applying (production protocol in AGENTS.md)

1. Take a backup: a full Supabase backup or PITR marker, plus a targeted
   export of `commerce_plans`, `plan_capabilities`, `capability_grants`,
   `report_prices`, `account_subscriptions`, `pending_chart_claims`,
   `tarot_decks`, `account_credits`, `subscription_paid_invoices`, and the
   current definitions of `public.daily_reading_allowance` and
   `public.record_paid_subscription_invoice`:

   ```sql
   select pg_get_functiondef('public.daily_reading_allowance(uuid,uuid)'::regprocedure);
   select pg_get_functiondef('public.record_paid_subscription_invoice(text,text,text,uuid,timestamptz)'::regprocedure);
   ```

2. Dry-run on a Supabase branch or local stack (`supabase db reset` applies all
   migrations), then run `npx vitest run __tests__/membership-two-tier-migration.test.ts`.
3. Get manual approval. Then apply the migration (`supabase db push`, or the
   migration pipeline).

### 2. Verify the database

```sql
select plan_key, name, active from public.commerce_plans order by rank;
-- free/Free/t, personal/Personal/f, premium/Atlas/t
select plan_key, capability_key, allowance, period from public.plan_capabilities
where plan_key in ('free','premium') order by 1, 2;
select plan_key, billing_interval, unit_amount, trial_days, active, stripe_price_id
from public.commerce_plan_prices;
-- premium month 1299 7 f NULL; premium year 9900 7 f NULL
select report_type, plan_key, unit_amount, active from public.report_prices order by 1, 2;
-- premium rows active at 80% of free; personal rows inactive
```

### 3. Stripe Dashboard (test mode first, then live)

1. **Product**: open the existing Atlas product (`prod_V1mG2ikID4WWAV`, formerly
   "Premium") and rename it **Atlas**, or create a new product named **Atlas**.
   Description: "A personal astrology reading every morning."
2. **Prices** on that product, both _Recurring_, USD, tax behaviour as agreed:
   - $12.99, billing period _Monthly_;
   - $99.00, billing period _Yearly_.

   Do **not** set a trial on the prices; Checkout adds the trial only for
   eligible readers. Optionally add metadata `celestial_atlas_plan_key = premium`
   (a fallback only; the webhook maps prices through `commerce_plan_prices`).
   Copy both `price_...` IDs.

3. **Archive** the legacy $19.99 Premium price (`price_1U1ihsLq4GnupuQQWdv4sdCg`)
   and the Personal product (`prod_V1mGzJYIyklaXH`, price
   `price_1U1ii4Lq4GnupuQQly91BydM`). Cancel any tester subscriptions on them.
   They are testers only, and Personal rows already resolve to Free.
4. **Customer portal** (Settings > Billing > Customer portal): under
   _Subscriptions > Customers can switch plans_, list only the **Atlas** product
   with its monthly and yearly prices. Remove Personal. Keep cancellation
   enabled ("at end of billing period"). Under _Business information_, keep the
   terms and privacy links.
5. **Webhook endpoint** (`/api/stripe/webhook`) must still send
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`,
   `charge.refunded` and `charge.dispute.created`. No new events are needed.
6. **Trial reminders** (recommended): Settings > Billing > Subscriptions and
   emails, enable _Send a reminder email 7 days before a free trial ends_.
7. **Google Pay**: see `docs/commerce/google-pay.md`.

### 4. Activate the Atlas prices

Replace the placeholders with the IDs from step 3.2 (test IDs in test, live IDs in live):

```sql
begin;
update public.commerce_plan_prices
set stripe_price_id = 'price_REPLACE_MONTHLY', active = true
where plan_key = 'premium' and billing_interval = 'month' and catalog_version = 1;
update public.commerce_plan_prices
set stripe_price_id = 'price_REPLACE_YEARLY', active = true
where plan_key = 'premium' and billing_interval = 'year' and catalog_version = 1;
select billing_interval, stripe_price_id, unit_amount, trial_days, active
from public.commerce_plan_prices where plan_key = 'premium';
commit;
```

Before committing, check that both rows are active and that the amounts match the
Stripe prices: 1299 and 9900. Checkout trusts the Stripe price; the stored
amount is for display and audit.

### 5. Environment variables

No new required variables. Check that these are set as intended:

| Variable                                                                                             | Purpose                                                                             |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`                                  | unchanged                                                                           |
| `COMMERCE_CHECKOUT_ENABLED`, `COMMERCE_SUBSCRIPTIONS_ENABLED`, `COMMERCE_WEBHOOK_FULFILMENT_ENABLED` | `true` to sell Atlas                                                                |
| `COMMERCE_ANONYMOUS_CHECKOUT_ENABLED`                                                                | checkout-led signup from the chart reveal                                           |
| `STRIPE_PAYMENT_METHOD_CONFIGURATION`                                                                | **optional**, `pmc_...`; see google-pay.md. Leave unset to use the account default. |

Redeploy after changing variables.

### 6. Google Play mapping (when the Play products exist)

In Play Console > Monetize > Subscriptions, create the subscription product
(for example `atlas`) with base plans (for example `atlas-monthly` and
`atlas-yearly`) and a 7-day free-trial offer for new subscribers. Then:

```sql
update public.commerce_plan_prices
set google_play_product_id = 'atlas', google_play_base_plan_id = 'atlas-monthly'
where plan_key = 'premium' and billing_interval = 'month' and catalog_version = 1;
update public.commerce_plan_prices
set google_play_product_id = 'atlas', google_play_base_plan_id = 'atlas-yearly'
where plan_key = 'premium' and billing_interval = 'year' and catalog_version = 1;
```

### 7. Smoke test (test mode)

1. Signed-in Free account, `/membership` → Yearly → "Start 7-day free trial"
   → Checkout shows a 7-day trial and $99/year, plus Google Pay in Chrome
   with a saved card.
2. Complete the purchase. The account becomes Atlas (`trialing`), and the
   webhook result for the $0 invoice is `processed:unpaid_period`.
3. Advance the trial with a Stripe test clock. The first paid invoice
   returns `processed:credit_granted`, and the account shows one included report.
4. Cancel, resubscribe with the same account → no trial; the button reads
   "Upgrade to Atlas".
5. Try `{ "planKey": "personal" }` on `/api/stripe/subscription-checkout` → 422.

## Google Play subscription schema (contract for the Android workstream)

`public.account_subscriptions`:

| Column                       | Type                             | Notes                                          |
| ---------------------------- | -------------------------------- | ---------------------------------------------- |
| `provider`                   | `text not null default 'stripe'` | `check (provider in ('stripe','google_play'))` |
| `billing_customer_id`        | `uuid` **nullable**              | required for `stripe` rows                     |
| `stripe_subscription_id`     | `text unique` **nullable**       | required for `stripe` rows                     |
| `google_play_purchase_token` | `text unique`                    | required for `google_play` rows                |
| `google_play_product_id`     | `text`                           | Play product ID                                |
| `google_play_order_id`       | `text`                           | latest order ID (e.g. `GPA.1234-...`)          |

- Check `account_subscriptions_provider_ids_check`:
  `(provider = 'stripe' and billing_customer_id is not null and stripe_subscription_id is not null) or (provider = 'google_play' and google_play_purchase_token is not null)`.
- `account_subscriptions_one_current_idx` is unchanged. A user can have only one
  subscription in `incomplete/trialing/active/past_due/paused`, across
  providers. Web checkout refuses a second one ("Your Atlas membership is
  managed in Google Play."). The portal route returns
  `https://play.google.com/store/account/subscriptions` for Play members.
- Entitlement functions (`membership_allowance`, `consume_capability`,
  `daily_reading_allowance`, `effectivePlanKeyForUser`) are provider-agnostic.
  A `google_play` row with `plan_key = 'premium'`, a current `status` and
  `current_period_start/_end` grants Atlas. Use the same status vocabulary
  (`trialing`, `active`, `past_due` with `grace_ends_at`, `canceled`, ...).
- `record_paid_subscription_invoice` and `reverse_paid_subscription_invoice`
  handle Stripe only. For each **paid** Play period (not the free trial), call
  `select public.grant_annual_report_credit(<user_id>, 'google_play:' || <orderId>, <paid_at>)`
  (service role). It is idempotent per source reference and applies the same
  one-per-year rule.
- Map Play products with `commerce_plan_prices.google_play_product_id` and
  `google_play_base_plan_id` (a unique pair). Look the pair up with the service
  role, without filtering on `active`: that flag governs web Checkout only.
- `process_subscription_event` is Stripe-only, so Play server code writes its own
  rows (upsert on `google_play_purchase_token`).
