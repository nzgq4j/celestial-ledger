# Commerce launch rules

Status: approved implementation baseline for test mode. Production activation remains gated.

## Catalog

- Free is the default for every existing and new account unless a verified grant applies.
- Two levels: Free and **Atlas** (database key `premium`; readers only ever see "Atlas"). Personal is retired and inactive (see `TWO_TIER_ATLAS_RUNBOOK.md`).
- Atlas is USD 12.99 monthly or USD 99 yearly (`commerce_plan_prices`), with a 7-day free trial only for accounts and Stripe customers that never had a subscription or trial.
- Existing Career and Purpose (USD 15) and Recovery Reflection (USD 5) reports remain one-time purchases.
- Reading-credit packs are deferred until their contents, expiry, and refund treatment are separately approved.
- Stripe identifiers are provider references, never authorization inputs. Application code authorizes stable plan and capability keys from Postgres.

## Subscription lifecycle

- Access begins only after a signature-verified Stripe event establishes an `active` or `trialing` subscription. Checkout redirects never grant access.
- A cancellation scheduled for period end retains access through `current_period_end`.
- An immediate cancellation, full refund, or dispute removes future subscription capability access after webhook reconciliation. Existing generated private reports retain their normal retention/deletion lifecycle.
- Stripe Smart Retries and recovery emails handle collection attempts. Celestial Atlas allows a seven-day local grace window after the first `past_due` event, capped by a terminal Stripe status such as `canceled` or `unpaid`.
- Upgrades take effect after Stripe confirms the changed subscription. Downgrades take effect at the next billing boundary through the Customer Portal.
- Duplicate and out-of-order events are idempotent. Older provider state must never overwrite newer normalized state.

## Allowances and credits

- Free: one saved natal chart and one personal daily reading per rolling calendar week.
- Free also includes all twelve daily sun-sign horoscopes and the one-card daily tarot draw.
- Atlas: five saved natal charts, one primary-chart daily reading per UTC day, ten companion-chart daily readings per billing month, one on-demand primary-chart weekly reading per ISO Monday–Sunday entitlement week, all five tarot spreads with the tarot journal, and one included detailed report per membership year. The weekly reading itself starts on the profile-local request date and covers seven inclusive calendar dates.
- Weekly reading delivery is in-app with PDF download in the first release; it is not included in automated email delivery.
- Allowance consumption is atomic, server-authoritative, and idempotent. Unknown capabilities deny by default.
- The Atlas included report is a `report.standard` credit issued from a paid period (never from the free trial) when none was issued in the trailing membership year. Credits expire twelve months after grant, oldest-expiring credits are consumed first, and consumed credits are not restored automatically after report generation.
- One-time report refunds revoke only unused entitlements automatically. Consumed-report refunds require support review and do not restore or delete content automatically.

## Discounts, tax, and refunds

- Atlas members buy detailed reports at 20% off (dedicated Atlas `report_prices` rows). Stripe applies approved promotion/coupon identifiers selected by the server.
- Checkout never pins payment method types; Google Pay and other wallets follow the Dashboard settings or `STRIPE_PAYMENT_METHOD_CONFIGURATION` (see `google-pay.md`).
- USD is the only launch currency.
- Stripe Tax may be enabled only after the business has configured its registrations and product tax codes in Stripe test mode and verified the resulting Checkout calculations.
- Subscription charges are non-prorated and non-refundable by default after a period begins, except where support approves a refund or applicable rules require one.
- Customer-facing terms, cancellation timing, refund language, renewal notices, and receipts must match these rules before production activation.

## Operational controls

- `commerce.checkout_enabled`, `commerce.webhook_fulfilment_enabled`, `commerce.subscriptions_enabled`, and each paid capability default to disabled.
- Test and live Stripe catalogs must never share identifiers.
- Reconciliation compares local active subscriptions to Stripe and records privacy-minimized drift without storing webhook payloads or payment instruments.
- Production activation requires backup, migration dry run, forward recovery, catalog verification, webhook verification, release checks, and explicit manual approval.
