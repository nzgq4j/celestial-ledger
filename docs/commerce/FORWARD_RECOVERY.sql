-- Forward recovery for account capability rollout.
-- This file is intentionally not a migration and must be reviewed before use.

-- 1. Disable all paid plans without deleting billing or entitlement history.
update public.commerce_plans
set active = false
where plan_key in ('personal', 'premium');

-- 2. Revoke temporary non-subscription grants if a rollout is halted.
update public.capability_grants
set status = 'revoked'
where status = 'active'
  and source_type in ('promotion', 'administrative');

-- 3. Preserve normalized subscriptions, usage, credits, Stripe event IDs,
--    one-time orders, and reports for reconciliation and support.
-- 4. Correct data only with a reviewed additive migration or idempotent
--    reconciliation job. Do not drop tables or delete provider mappings.
