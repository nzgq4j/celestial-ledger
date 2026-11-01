# Google Pay

## Web (Stripe Checkout)

Stripe Checkout shows Google Pay automatically when both are true:

1. Google Pay is **enabled** in the Stripe Dashboard: Settings > Payments >
   **Payment methods**, under _Wallets_. Turn on **Google Pay** in the default
   payment method configuration, or in the configuration named by
   `STRIPE_PAYMENT_METHOD_CONFIGURATION`.
2. The Checkout Session does **not** pin `payment_method_types`. All three session
   builders meet this, and `__tests__/stripe-atlas-checkout.test.ts` enforces it:
   - Atlas subscriptions: `lib/stripe/checkout.ts`, used by
     `app/api/stripe/subscription-checkout` and
     `app/api/stripe/anonymous-subscription-checkout`;
   - one-time reports: `app/api/checkout/route.ts`.

Stripe-hosted Checkout needs **no domain verification** for Google Pay (the
payment page is served from `checkout.stripe.com`). Domain registration is only
needed for Payment Element or Express Checkout Element on our own pages, and we
use neither.

Google Pay appears only on supported browsers (Chrome, Edge and Android Chrome)
when the visitor has a card saved in Google Pay or their Google account. It is
hidden otherwise, so its absence on a test machine is not a fault.

### Optional: a dedicated payment method configuration

1. Dashboard > Settings > Payments > Payment methods > **Create configuration**
   (for example "Celestial Atlas Checkout"). Turn on Cards, Google Pay, Apple Pay
   and Link, plus any others the business approves.
2. Copy its ID (`pmc_...`).
3. Set `STRIPE_PAYMENT_METHOD_CONFIGURATION=pmc_...` in the deployment environment
   and redeploy. It is sent as `payment_method_configuration` on every Checkout
   Session. A value that is not a `pmc_` ID makes checkout fail loudly instead
   of being sent to Stripe.
4. To return to the account default, unset the variable and redeploy.

Use different `pmc_` IDs in test and live mode; they are not shared.

### Verify

In test mode, open `/membership` in Chrome signed in to a Google account with a
card, then start Atlas checkout. Google Pay should appear above the card form.
Repeat with a report purchase from `/account#reports`.

## Android app

Inside the Android app, Atlas is sold through **Google Play Billing**, not
Stripe. `SubscriptionButton` renders `PlayBillingButton` when
`appPlatformFromWindow() === "android"`, and Play members manage Atlas at
https://play.google.com/store/account/subscriptions. See the schema contract in
`TWO_TIER_ATLAS_RUNBOOK.md`.
