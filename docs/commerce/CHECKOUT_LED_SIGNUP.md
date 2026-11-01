# Checkout-led signup

The natal-chart reveal offers one dominant Atlas continuation (`planKey: "premium"`, optional `interval: "month" | "year"`, default monthly) and a clear free-account alternative. The retired `personal` key is rejected. The chosen interval is stored in `pending_chart_claims.requested_billing_interval`. The 7-day trial applies only when no Stripe customer with the checkout email has had a subscription or trial; with a trial, Checkout always collects a payment method.

## Trust boundaries

- The browser submits validated birth input, its displayed chart, and its generated interpretation.
- The checkout route validates the payload, recalculates the chart independently, and rejects any chart that differs from the server calculation.
- Birth data and chart output are stored only in `pending_chart_claims` for at most one hour.
- Stripe receives only `application`, `celestial_atlas_plan_key`, `celestial_atlas_billing_interval`, and a cryptographically random pending-claim token.
- Subscription access still begins only after a signature-verified Stripe webhook establishes an active or trialing subscription.

## Retry and recovery

If the email already belongs to an account with a current membership (Stripe or Google Play), the claim-status route keeps that membership, cancels the duplicate Stripe subscription and signs the reader in. For a Stripe member, the existing subscription moves to the price chosen at checkout.

Webhook provisioning is idempotent. The database function locks the pending claim and returns an existing birth profile on retry. The pending claim is deleted only after subscription reconciliation and the short-lived sign-in claim have succeeded. Missing or expired claims fail closed with a sanitized permanent result; transient provider or database failures return an error so Stripe retries.

The browser polls for a bounded period while the webhook completes. Once ready, the server generates and immediately redeems a one-time Supabase token into secure cookies; the customer never receives or clicks a magic link.

## Rollout and forward recovery

`COMMERCE_ANONYMOUS_CHECKOUT_ENABLED` defaults to false. To stop new checkout-led signups without affecting existing free signup or authenticated billing, set it to false and redeploy. Existing pending rows expire and are removed by the cleanup cron. The additive tables and function can remain in place during recovery; dropping them is unnecessary and would remove forensic state needed for support.

Production activation requires a current database backup, migration validation, verified Stripe webhook configuration, the full release checks, and explicit approval.
