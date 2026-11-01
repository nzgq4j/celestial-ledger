-- Two-tier membership: Free and Atlas (database key `premium`).
--
-- Additive and forward-only. Rows are retained; nothing is dropped except the
-- two auto-named `period` check constraints, which are replaced in the same
-- transaction by strictly wider named checks. Production execution requires
-- the documented backup, dry run, manual approval and forward-recovery plan
-- in docs/commerce/TWO_TIER_ATLAS_RUNBOOK.md and
-- docs/commerce/TWO_TIER_ATLAS_FORWARD_RECOVERY.sql.
--
-- New Atlas Stripe prices are seeded INACTIVE with NULL Stripe price IDs:
-- Stripe objects cannot be created from a migration. Checkout refuses Atlas
-- until the operator creates the prices and runs the activation SQL.

-- ---------------------------------------------------------------------------
-- 1. Catalogue: Atlas keeps the `premium` key; Personal is retired.
-- ---------------------------------------------------------------------------
update public.commerce_plans set name = 'Atlas' where plan_key = 'premium';
update public.commerce_plans set active = false where plan_key = 'personal';
update public.report_prices set active = false where plan_key = 'personal';

-- Personal-only tarot decks become Atlas decks (Free keeps Free decks).
update public.tarot_decks set minimum_plan = 'premium' where minimum_plan = 'personal';

comment on table public.commerce_plans is
  'Server-authoritative membership catalogue: free and premium (reader-facing name "Atlas"). '
  'personal is retired and inactive. Sellable Stripe prices live in commerce_plan_prices; '
  'stripe_price_id here is a legacy single-price fallback used only to map old subscriptions.';

-- ---------------------------------------------------------------------------
-- 2. `year` capability period. Replace the auto-named inline checks with
--    named, strictly wider checks (every existing row remains valid).
-- ---------------------------------------------------------------------------
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select c.conrelid::regclass as table_name, c.conname
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in ('public.plan_capabilities'::regclass, 'public.capability_grants'::regclass)
      and pg_get_constraintdef(c.oid) like '%billing_month%'
  loop
    execute format('alter table %s drop constraint %I', v_constraint.table_name, v_constraint.conname);
  end loop;
end;
$$;

alter table public.plan_capabilities
  add constraint plan_capabilities_period_check
  check (period in ('none','week','billing_month','quarter','year'));
alter table public.capability_grants
  add constraint capability_grants_period_check
  check (period in ('none','week','billing_month','quarter','year'));

-- ---------------------------------------------------------------------------
-- 3. Multiple prices per plan (monthly and yearly Atlas, Google Play mapping).
-- ---------------------------------------------------------------------------
create table public.commerce_plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null references public.commerce_plans(plan_key) on delete restrict,
  billing_interval text not null check (billing_interval in ('month','year')),
  stripe_price_id text unique check (stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9_]+$'),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  unit_amount integer not null check (unit_amount >= 0),
  trial_days smallint not null default 0 check (trial_days between 0 and 31),
  active boolean not null default false,
  catalog_version integer not null default 1 check (catalog_version > 0),
  google_play_product_id text check (google_play_product_id is null or google_play_product_id ~ '^[a-z0-9][a-z0-9._]{0,139}$'),
  google_play_base_plan_id text check (google_play_base_plan_id is null or google_play_base_plan_id ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_key, billing_interval, catalog_version),
  check (plan_key <> 'free'),
  check (not active or stripe_price_id is not null),
  check (google_play_base_plan_id is null or google_play_product_id is not null)
);

create unique index commerce_plan_prices_one_active_idx
on public.commerce_plan_prices(plan_key, billing_interval)
where active;
create unique index commerce_plan_prices_google_play_idx
on public.commerce_plan_prices(google_play_product_id, coalesce(google_play_base_plan_id, ''))
where google_play_product_id is not null;

create trigger commerce_plan_prices_set_updated_at before update on public.commerce_plan_prices
for each row execute function private.set_updated_at();

alter table public.commerce_plan_prices enable row level security;
revoke all on public.commerce_plan_prices from public, anon, authenticated;
grant select on public.commerce_plan_prices to anon, authenticated;
grant all on public.commerce_plan_prices to service_role;
create policy commerce_plan_prices_select_active on public.commerce_plan_prices
for select to anon, authenticated using (active);

insert into public.commerce_plan_prices(
  plan_key, billing_interval, stripe_price_id, currency, unit_amount, trial_days, active, catalog_version
) values
  ('premium', 'month', null, 'usd', 1299, 7, false, 1),
  ('premium', 'year', null, 'usd', 9900, 7, false, 1)
on conflict (plan_key, billing_interval, catalog_version) do nothing;

comment on table public.commerce_plan_prices is
  'Sellable membership prices. Checkout offers only active rows; the webhook maps any row (active or not) back to its plan. '
  'Google Play product/base-plan IDs map Play subscriptions to the same plan.';
comment on column public.commerce_plan_prices.trial_days is
  'Free-trial length offered only to accounts and Stripe customers with no previous subscription or trial.';

-- ---------------------------------------------------------------------------
-- 4. Atlas allowances (server-authoritative). Free is restated unchanged.
-- ---------------------------------------------------------------------------
insert into public.plan_capabilities(plan_key, capability_key, allowance, period, configuration) values
  ('free', 'birth_profiles.saved', 1, 'none', '{}'::jsonb),
  ('free', 'daily_reading.personal', 1, 'week', '{}'::jsonb),
  ('free', 'tarot.spreads', null, 'none', '{"spreads":["daily"]}'::jsonb),
  ('premium', 'birth_profiles.saved', 5, 'none', '{}'::jsonb),
  ('premium', 'daily_reading.primary', 1, 'none', '{"cadence":"daily","profile_scope":"primary"}'::jsonb),
  ('premium', 'daily_reading.companion', 10, 'billing_month', '{"profile_scope":"companion"}'::jsonb),
  ('premium', 'weekly_reading.primary', 1, 'week', '{"profile_scope":"primary"}'::jsonb),
  ('premium', 'tarot.spreads', null, 'none', '{"spreads":["daily","ppf","love5","celtic","grand"]}'::jsonb),
  ('premium', 'tarot.journal', null, 'none', '{}'::jsonb),
  ('premium', 'report.discount_percent', 20, 'none', '{}'::jsonb),
  ('premium', 'report.standard_credit', 1, 'year',
    '{"credit_key":"report.standard","issued_by":"paid_subscription_ledger"}'::jsonb)
on conflict (plan_key, capability_key) do update set
  allowance = excluded.allowance,
  period = excluded.period,
  configuration = excluded.configuration;

-- Atlas report prices are 20% below the standard (free) price. The catalogue
-- already holds such rows (retired by 20260908074857); reactivate only rows
-- whose amount is exactly 80% of an active standard price.
do $$
declare
  v_reactivated integer;
  v_mismatched integer;
begin
  update public.report_prices rp set active = true
  where rp.plan_key = 'premium'
    and exists (
      select 1 from public.report_prices f
      where f.plan_key = 'free' and f.active
        and f.report_type = rp.report_type
        and f.catalog_version = rp.catalog_version
        and f.currency = rp.currency
        and rp.unit_amount = round(f.unit_amount * 0.8)
    );
  get diagnostics v_reactivated = row_count;
  select count(*) into v_mismatched
  from public.report_prices f
  where f.plan_key = 'free' and f.active
    and not exists (
      select 1 from public.report_prices rp
      where rp.plan_key = 'premium' and rp.active and rp.report_type = f.report_type
    );
  raise notice 'Atlas report prices reactivated: %, standard prices without an Atlas price: %',
    v_reactivated, v_mismatched;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Period windows, including the membership year.
-- ---------------------------------------------------------------------------
create or replace function private.membership_period_window(
  p_user_id uuid, p_plan text, p_period text,
  out period_start timestamptz, out period_end timestamptz
) language plpgsql stable security definer set search_path = '' as $$
declare
  v_anchor timestamptz;
  v_years integer;
begin
  if p_period = 'day' then
    period_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
    period_end := period_start + interval '1 day';
  elsif p_period = 'week' then
    period_start := date_trunc('week', now() at time zone 'UTC') at time zone 'UTC';
    period_end := period_start + interval '7 days';
  elsif p_period = 'billing_month' then
    select s.current_period_start, s.current_period_end into period_start, period_end
    from public.account_subscriptions s where s.user_id = p_user_id
      and s.plan_key = p_plan and s.status in ('active','trialing','past_due')
      and s.current_period_start <= now() and s.current_period_end > now()
    order by s.current_period_start desc limit 1;
    if period_start is null then
      period_start := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
      period_end := period_start + interval '1 month';
    end if;
  elsif p_period = 'quarter' then
    period_start := date_trunc('quarter', now() at time zone 'UTC') at time zone 'UTC';
    period_end := period_start + interval '3 months';
  elsif p_period = 'year' then
    -- Membership year: anniversaries of the current subscription's start, so
    -- monthly and yearly members share one rule. Calendar year as fallback.
    select s.created_at into v_anchor
    from public.account_subscriptions s where s.user_id = p_user_id
      and s.plan_key = p_plan and s.status in ('active','trialing','past_due')
      and s.created_at <= now()
    order by s.created_at desc limit 1;
    if v_anchor is null then
      period_start := date_trunc('year', now() at time zone 'UTC') at time zone 'UTC';
    else
      v_years := extract(year from age(now(), v_anchor))::integer;
      period_start := v_anchor + make_interval(years => v_years);
    end if;
    period_end := period_start + interval '1 year';
  else
    period_start := '1970-01-01 UTC'::timestamptz;
    period_end := '9999-01-01 UTC'::timestamptz;
  end if;
end;
$$;
revoke all on function private.membership_period_window(uuid, text, text) from public, anon, authenticated;

create or replace function public.daily_reading_allowance(p_user_id uuid, p_birth_profile_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_access jsonb; v_primary uuid; v_capability text; v_period text;
  v_start timestamptz; v_end timestamptz; v_used integer; v_limit integer;
begin
  if not exists (select 1 from public.birth_profiles where id = p_birth_profile_id
    and user_id = p_user_id and expires_at > now()) then
    return jsonb_build_object('status', 'profile_unavailable');
  end if;
  select id into v_primary from public.birth_profiles
  where user_id = p_user_id and expires_at > now() order by created_at, id limit 1;
  v_access := private.membership_allowance(p_user_id, 'daily_reading.personal');
  v_capability := 'daily_reading.personal';
  if v_access->>'plan' = 'premium' then
    v_capability := case when v_primary = p_birth_profile_id then 'daily_reading.primary' else 'daily_reading.companion' end;
    v_access := private.membership_allowance(p_user_id, v_capability);
  end if;
  if not (v_access->>'allowed')::boolean then
    return jsonb_build_object('status', 'not_included');
  end if;
  v_period := v_access->>'period';
  if v_capability = 'daily_reading.primary' then v_period := 'day'; end if;
  select w.period_start, w.period_end into v_start, v_end
  from private.membership_period_window(p_user_id, v_access->>'plan', v_period) w;
  select count(*) into v_used from public.daily_reading_reservations
  where user_id = p_user_id and capability_key = v_capability
    and created_at >= v_start and created_at < v_end
    and (completed or lease_expires_at > now());
  v_limit := (v_access->>'allowance')::integer;
  return jsonb_build_object('status', case when v_limit is null or v_used < v_limit then 'available' else 'allowance_exhausted' end,
    'capability', v_capability, 'allowance', v_limit, 'used', v_used,
    'remaining', case when v_limit is null then null else greatest(0, v_limit - v_used) end,
    'period', v_period, 'resetsAt', v_end);
end;
$$;
revoke all on function public.daily_reading_allowance(uuid, uuid) from public, anon, authenticated;
grant execute on function public.daily_reading_allowance(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Google Play as a second subscription provider.
-- ---------------------------------------------------------------------------
alter table public.account_subscriptions
  add column provider text not null default 'stripe' check (provider in ('stripe','google_play')),
  add column google_play_purchase_token text unique,
  add column google_play_product_id text,
  add column google_play_order_id text;
alter table public.account_subscriptions
  alter column billing_customer_id drop not null,
  alter column stripe_subscription_id drop not null;
alter table public.account_subscriptions
  add constraint account_subscriptions_provider_ids_check check (
    (provider = 'stripe' and billing_customer_id is not null and stripe_subscription_id is not null)
    or (provider = 'google_play' and google_play_purchase_token is not null)
  );
-- account_subscriptions_one_current_idx (one current subscription per user,
-- across providers) is intentionally unchanged.

comment on column public.account_subscriptions.provider is
  'Billing provider. stripe rows carry billing_customer_id and stripe_subscription_id; google_play rows carry google_play_purchase_token.';

-- Remember the billing interval chosen before anonymous checkout.
alter table public.pending_chart_claims
  add column requested_billing_interval text check (requested_billing_interval in ('month','year'));

-- ---------------------------------------------------------------------------
-- 7. One included report per membership year.
--
-- Uses the existing credit machinery: an account_credits row
-- (credit_key report.standard) redeemed by redeem_report_credit into a normal
-- entitlement. A credit is issued from a PAID subscription period (so a free
-- trial never yields a report) when no subscription credit was issued to the
-- account within the last membership year (seven days of tolerance for
-- monthly billing-date drift). Credits from refunded, unredeemed periods do
-- not count, so the next paid period re-issues them.
-- ---------------------------------------------------------------------------
create or replace function public.grant_annual_report_credit(
  p_user_id uuid, p_source_reference text, p_granted_at timestamptz
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_allowance integer;
  v_issued integer;
begin
  if p_user_id is null or p_source_reference is null or p_granted_at is null then
    return 'invalid_request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('annual-report-credit:' || p_user_id::text, 0));
  if exists (select 1 from public.account_credits where user_id = p_user_id
    and source_type = 'subscription' and source_reference = p_source_reference) then
    return 'duplicate';
  end if;
  select allowance into v_allowance from public.plan_capabilities
  where plan_key = 'premium' and capability_key = 'report.standard_credit' and period = 'year';
  if coalesce(v_allowance, 0) = 0 then return 'not_included'; end if;
  select coalesce(sum(c.quantity_total), 0)::integer into v_issued
  from public.account_credits c
  where c.user_id = p_user_id and c.credit_key = 'report.standard'
    and c.source_type = 'subscription'
    and c.granted_at > p_granted_at - (interval '1 year' - interval '7 days')
    and c.granted_at <= p_granted_at
    and not (
      exists (select 1 from public.subscription_paid_invoices i
        where i.stripe_invoice_id = c.source_reference and i.reversed_at is not null)
      and not exists (select 1 from public.orders o where o.credit_id = c.id)
    );
  if v_issued >= v_allowance then return 'recorded'; end if;
  insert into public.account_credits(
    user_id, credit_key, quantity_total, quantity_remaining, source_type,
    source_reference, granted_at, expires_at
  ) values (
    p_user_id, 'report.standard', 1, 1, 'subscription',
    p_source_reference, p_granted_at, p_granted_at + interval '12 months'
  );
  return 'credit_granted';
end;
$$;
revoke all on function public.grant_annual_report_credit(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.grant_annual_report_credit(uuid, text, timestamptz) to service_role;
comment on function public.grant_annual_report_credit(uuid, text, timestamptz) is
  'Service-role-only, idempotent per source reference: issues the Atlas included report (one per membership year) '
  'from a paid subscription period. Stripe calls it via record_paid_subscription_invoice; Google Play server code '
  'calls it directly with source reference ''google_play:<orderId>''.';

create or replace function public.record_paid_subscription_invoice(
  p_stripe_invoice_id text, p_stripe_payment_intent_id text,
  p_stripe_subscription_id text, p_user_id uuid, p_paid_at timestamptz
) returns text language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('paid-invoice:' || p_stripe_subscription_id, 0));
  if exists (select 1 from public.subscription_paid_invoices where stripe_invoice_id = p_stripe_invoice_id) then return 'duplicate'; end if;
  if not exists (select 1 from public.account_subscriptions where provider = 'stripe'
    and stripe_subscription_id = p_stripe_subscription_id
    and user_id = p_user_id and plan_key = 'premium' and status in ('active','trialing')) then return 'ineligible'; end if;
  insert into public.subscription_paid_invoices(stripe_invoice_id, stripe_payment_intent_id, stripe_subscription_id, user_id, paid_at)
  values (p_stripe_invoice_id, p_stripe_payment_intent_id, p_stripe_subscription_id, p_user_id, p_paid_at);
  if public.grant_annual_report_credit(p_user_id, p_stripe_invoice_id, p_paid_at) = 'credit_granted' then
    return 'credit_granted';
  end if;
  return 'recorded';
end;
$$;
revoke all on function public.record_paid_subscription_invoice(text, text, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.record_paid_subscription_invoice(text, text, text, uuid, timestamptz) to service_role;
comment on function public.record_paid_subscription_invoice(text, text, text, uuid, timestamptz)
is 'Idempotent Atlas paid-invoice ledger (Stripe rows only). Issues one included report credit per membership year.';
