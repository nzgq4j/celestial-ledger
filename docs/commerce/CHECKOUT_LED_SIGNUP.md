# Checkout-led signup

The natal-chart reveal offers one dominant Personal continuation and a clear free-account alternative. Premium remains available from the membership comparison page.

## Trust boundaries

- The browser submits validated birth input, its displayed chart, and its generated interpretation.
- The checkout route validates the payload, recalculates the chart independently, and rejects any chart that differs from the server calculation.
- Birth data and chart output are stored only in `pending_chart_claims` for at most one hour.
- Stripe receives only `application`, `celestial_atlas_plan_key`, and a cryptographically random pending-claim token.
- Subscription access still begins only after a signature-verified Stripe webhook establishes an active or trialing subscription.

## Retry and recovery

Webhook provisioning is idempotent. The database function locks the pending claim and returns an existing birth profile on retry. The pending claim is deleted only after subscription reconciliation and the short-lived sign-in claim have succeeded. Missing or expired claims fail closed with a sanitized permanent result; transient provider or database failures return an error so Stripe retries.

The browser polls for a bounded period while the webhook completes. Once ready, the server generates and immediately redeems a one-time Supabase token into secure cookies; the customer never receives or clicks a magic link.

## Rollout and forward recovery

`COMMERCE_ANONYMOUS_CHECKOUT_ENABLED` defaults to false. To stop new checkout-led signups without affecting existing free signup or authenticated billing, set it to false and redeploy. Existing pending rows expire and are removed by the cleanup cron. The additive tables and function can remain in place during recovery; dropping them is unnecessary and would remove forensic state needed for support.

Production activation requires a current database backup, migration validation, verified Stripe webhook configuration, the full release checks, and explicit approval.
