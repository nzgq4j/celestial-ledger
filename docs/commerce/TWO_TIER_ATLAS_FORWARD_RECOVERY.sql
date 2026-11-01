-- Forward recovery for 20261101090000_two_tier_atlas_membership.sql.
-- Not a migration. Review, run inside a transaction and record what was run.
-- Never drop the new table/columns, delete subscriptions, credits, orders,
-- reports or provider mappings: they are needed for reconciliation and support.

-- A. Stop selling Atlas immediately (checkout answers
--    "Atlas membership is not yet available."). Existing members keep access.
update public.commerce_plan_prices set active = false where plan_key = 'premium';
--    Or, at the application layer: COMMERCE_SUBSCRIPTIONS_ENABLED=false and redeploy.

-- B. Withdraw the free trial for new checkouts without stopping sales.
update public.commerce_plan_prices set trial_days = 0 where plan_key = 'premium';

-- C. Wrong Stripe price ID activated: deactivate, correct, reactivate.
--    (The webhook maps any row, active or not, so existing subscribers on the
--    wrong price still resolve to Atlas while this is fixed.)
-- update public.commerce_plan_prices set active = false
--   where plan_key = 'premium' and billing_interval = 'month';
-- update public.commerce_plan_prices set stripe_price_id = 'price_CORRECT', active = true
--   where plan_key = 'premium' and billing_interval = 'month' and catalog_version = 1;

-- D. Stop issuing included annual reports (credits already issued stay valid).
update public.plan_capabilities set allowance = 0,
  configuration = configuration || '{"paused":true}'::jsonb
where plan_key = 'premium' and capability_key = 'report.standard_credit';

-- E. Pause the Atlas report discount (purchases fall back to "currently unavailable"
--    for Atlas members until a price is active again; prefer fixing the price row).
-- update public.report_prices set active = false where plan_key = 'premium';

-- F. Correct an allowance value (example: companion readings).
-- update public.plan_capabilities set allowance = 10
--   where plan_key = 'premium' and capability_key = 'daily_reading.companion';

-- G. Restore the pre-migration function bodies only if a defect is proven.
--    Use the definitions captured in the runbook backup step
--    (pg_get_functiondef output) in a reviewed follow-up migration.
--    `create or replace` keeps signatures and grants. The year period check
--    is a superset and needs no reversal.

-- H. Personal stays retired. Re-activating it is a commercial decision, not a
--    recovery step: it has no prices in commerce_plan_prices and is never sold.
