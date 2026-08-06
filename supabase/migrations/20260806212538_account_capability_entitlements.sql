create table public.commerce_plans (
  plan_key text primary key check (plan_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  name text not null check (char_length(name) between 1 and 80),
  rank smallint not null unique check (rank >= 0),
  active boolean not null default false,
  stripe_product_id text unique,
  stripe_price_id text unique,
  currency text check (currency is null or currency ~ '^[a-z]{3}$'),
  unit_amount integer check (unit_amount is null or unit_amount >= 0),
  billing_interval text check (billing_interval is null or billing_interval in ('month','year')),
  catalog_version integer not null default 1 check (catalog_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    plan_key = 'free'
    or not active
    or (stripe_product_id is not null and stripe_price_id is not null and currency is not null and unit_amount is not null and billing_interval is not null)
  )
);

create table public.plan_capabilities (
  plan_key text not null references public.commerce_plans(plan_key) on delete restrict,
  capability_key text not null check (capability_key ~ '^[a-z][a-z0-9_.]{2,95}$'),
  allowance integer check (allowance is null or allowance >= 0),
  period text not null check (period in ('none','week','billing_month','quarter')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object'),
  primary key (plan_key, capability_key)
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  plan_key text not null references public.commerce_plans(plan_key) on delete restrict,
  stripe_subscription_id text not null unique,
  status text not null check (status in ('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  grace_ends_at timestamptz,
  last_stripe_event_created bigint not null default 0 check (last_stripe_event_created >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index account_subscriptions_one_current_idx
on public.account_subscriptions(user_id)
where user_id is not null and status in ('incomplete','trialing','active','past_due','paused');
create index account_subscriptions_reconcile_idx
on public.account_subscriptions(status, updated_at);

create table public.capability_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  capability_key text not null check (capability_key ~ '^[a-z][a-z0-9_.]{2,95}$'),
  source_type text not null check (source_type in ('subscription','promotion','complimentary','administrative','grandfathered')),
  source_reference text,
  allowance integer check (allowance is null or allowance >= 0),
  period text not null check (period in ('none','week','billing_month','quarter')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  priority smallint not null default 100,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index capability_grants_effective_idx
on public.capability_grants(user_id, capability_key, status, starts_at, ends_at);

create table public.capability_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  capability_key text not null check (capability_key ~ '^[a-z][a-z0-9_.]{2,95}$'),
  quantity integer not null check (quantity > 0),
  period_start timestamptz not null,
  period_end timestamptz not null,
  idempotency_key text not null,
  source_reference text,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  check (period_end > period_start)
);
create index capability_usage_period_idx
on public.capability_usage(user_id, capability_key, period_start, period_end);

create table public.account_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  credit_key text not null check (credit_key ~ '^[a-z][a-z0-9_.]{2,95}$'),
  quantity_total integer not null check (quantity_total > 0),
  quantity_remaining integer not null check (quantity_remaining between 0 and quantity_total),
  source_type text not null check (source_type in ('subscription','purchase','promotion','complimentary','administrative')),
  source_reference text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index account_credits_available_idx
on public.account_credits(user_id, credit_key, expires_at)
where quantity_remaining > 0;

create trigger commerce_plans_set_updated_at before update on public.commerce_plans
for each row execute function private.set_updated_at();
create trigger billing_customers_set_updated_at before update on public.billing_customers
for each row execute function private.set_updated_at();
create trigger account_subscriptions_set_updated_at before update on public.account_subscriptions
for each row execute function private.set_updated_at();
create trigger capability_grants_set_updated_at before update on public.capability_grants
for each row execute function private.set_updated_at();
create trigger account_credits_set_updated_at before update on public.account_credits
for each row execute function private.set_updated_at();

alter table public.commerce_plans enable row level security;
alter table public.plan_capabilities enable row level security;
alter table public.billing_customers enable row level security;
alter table public.account_subscriptions enable row level security;
alter table public.capability_grants enable row level security;
alter table public.capability_usage enable row level security;
alter table public.account_credits enable row level security;

revoke all on public.commerce_plans, public.plan_capabilities, public.billing_customers,
  public.account_subscriptions, public.capability_grants, public.capability_usage,
  public.account_credits from public, anon, authenticated;
grant select on public.commerce_plans, public.plan_capabilities to anon, authenticated;

create policy commerce_plans_select_active on public.commerce_plans
for select to anon, authenticated using (active);
create policy plan_capabilities_select_active on public.plan_capabilities
for select to anon, authenticated using (
  exists (
    select 1
    from public.commerce_plans p
    where p.plan_key = plan_capabilities.plan_key and p.active
  )
);

insert into public.commerce_plans(
  plan_key, name, rank, active, stripe_product_id, stripe_price_id,
  currency, unit_amount, billing_interval
)
values
  ('free', 'Free', 0, true, null, null, null, 0, null),
  ('personal', 'Personal', 10, false, 'prod_V1c4EeWPK7MDoI', 'price_1U1YqGLq4GnupuQQH6QoGmMg', 'usd', 999, 'month'),
  ('premium', 'Premium', 20, false, 'prod_V1c4PNfI7z4O49', 'price_1U1YqSLq4GnupuQQp8LxuEdG', 'usd', 1999, 'month');

insert into public.plan_capabilities(plan_key, capability_key, allowance, period) values
  ('free', 'birth_profiles.saved', 1, 'none'),
  ('free', 'daily_reading.personal', 1, 'week'),
  ('personal', 'birth_profiles.saved', 2, 'none'),
  ('personal', 'daily_reading.personal', 10, 'billing_month'),
  ('personal', 'weekly_reading.primary', null, 'none'),
  ('personal', 'report.discount_percent', 10, 'none'),
  ('premium', 'birth_profiles.saved', 5, 'none'),
  ('premium', 'daily_reading.primary', 1, 'none'),
  ('premium', 'daily_reading.companion', 10, 'billing_month'),
  ('premium', 'weekly_reading.primary', null, 'none'),
  ('premium', 'report.discount_percent', 20, 'none'),
  ('premium', 'report.standard_credit', 1, 'quarter');

create or replace function public.consume_capability(
  p_user_id uuid,
  p_capability_key text,
  p_quantity integer,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_idempotency_key text,
  p_source_reference text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_key text := 'free';
  v_allowance integer;
  v_plan_has_capability boolean := false;
  v_grant_allowance integer;
  v_has_grant boolean := false;
  v_unlimited_grant boolean := false;
  v_used integer;
begin
  if p_quantity <= 0 or p_period_end <= p_period_start then return 'invalid_request'; end if;
  if exists (select 1 from public.capability_usage where user_id = p_user_id and idempotency_key = p_idempotency_key) then
    return 'duplicate';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_capability_key || ':' || p_period_start::text, 0));

  select s.plan_key into v_plan_key
  from public.account_subscriptions s
  join public.commerce_plans p on p.plan_key = s.plan_key and p.active
  where s.user_id = p_user_id
    and (s.status in ('active','trialing') or (s.status = 'past_due' and s.grace_ends_at > now()))
    and (s.current_period_end is null or s.current_period_end > now())
  order by p.rank desc, s.updated_at desc limit 1;
  v_plan_key := coalesce(v_plan_key, 'free');

  select pc.allowance, true into v_allowance, v_plan_has_capability
  from public.plan_capabilities pc
  where pc.plan_key = v_plan_key and pc.capability_key = p_capability_key;

  select max(g.allowance), count(*) > 0, coalesce(bool_or(g.allowance is null), false)
  into v_grant_allowance, v_has_grant, v_unlimited_grant
  from public.capability_grants g
  where g.user_id = p_user_id and g.capability_key = p_capability_key and g.status = 'active'
    and g.starts_at <= now() and (g.ends_at is null or g.ends_at > now());

  if not v_plan_has_capability and not v_has_grant then return 'denied'; end if;
  if (v_plan_has_capability and v_allowance is null) or v_unlimited_grant then v_allowance := null;
  elsif v_grant_allowance is not null then v_allowance := greatest(coalesce(v_allowance, 0), v_grant_allowance);
  end if;

  if v_allowance is not null then
    select coalesce(sum(quantity), 0)::integer into v_used from public.capability_usage
    where user_id = p_user_id and capability_key = p_capability_key
      and period_start = p_period_start and period_end = p_period_end;
    if v_used + p_quantity > v_allowance then return 'allowance_exhausted'; end if;
  end if;

  insert into public.capability_usage(user_id, capability_key, quantity, period_start, period_end, idempotency_key, source_reference)
  values (p_user_id, p_capability_key, p_quantity, p_period_start, p_period_end, p_idempotency_key, p_source_reference);
  return 'consumed';
end;
$$;

revoke all on function public.consume_capability(uuid, text, integer, timestamptz, timestamptz, text, text)
from public, anon, authenticated;
grant execute on function public.consume_capability(uuid, text, integer, timestamptz, timestamptz, text, text)
to service_role;

create or replace function public.process_subscription_event(
  p_event_id text,
  p_event_type text,
  p_event_created bigint,
  p_user_id uuid,
  p_plan_key text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_status text,
  p_current_period_start timestamptz default null,
  p_current_period_end timestamptz default null,
  p_cancel_at_period_end boolean default false,
  p_grace_ends_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_last_event bigint;
begin
  if exists (select 1 from public.stripe_events where event_id = p_event_id and status = 'processed') then
    return 'duplicate';
  end if;

  insert into public.stripe_events(event_id, event_type, status)
  values (p_event_id, p_event_type, 'received')
  on conflict (event_id) do update set event_type = excluded.event_type;

  if not exists (select 1 from public.commerce_plans where plan_key = p_plan_key)
    or p_status not in ('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused') then
    update public.stripe_events set status = 'failed', processed_at = now(), failure_code = 'subscription_mismatch'
    where event_id = p_event_id;
    return 'subscription_mismatch';
  end if;

  insert into public.billing_customers(user_id, stripe_customer_id)
  values (p_user_id, p_stripe_customer_id)
  on conflict (stripe_customer_id) do update
    set user_id = coalesce(public.billing_customers.user_id, excluded.user_id)
  returning id into v_customer_id;

  select last_stripe_event_created into v_last_event
  from public.account_subscriptions
  where stripe_subscription_id = p_stripe_subscription_id
  for update;

  if v_last_event is not null and v_last_event > p_event_created then
    update public.stripe_events set status = 'processed', processed_at = now(), failure_code = null
    where event_id = p_event_id;
    return 'stale';
  end if;

  insert into public.account_subscriptions(
    user_id, billing_customer_id, plan_key, stripe_subscription_id, status,
    current_period_start, current_period_end, cancel_at_period_end,
    grace_ends_at, last_stripe_event_created
  ) values (
    p_user_id, v_customer_id, p_plan_key, p_stripe_subscription_id, p_status,
    p_current_period_start, p_current_period_end, p_cancel_at_period_end,
    p_grace_ends_at, p_event_created
  )
  on conflict (stripe_subscription_id) do update set
    user_id = excluded.user_id,
    billing_customer_id = excluded.billing_customer_id,
    plan_key = excluded.plan_key,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    grace_ends_at = excluded.grace_ends_at,
    last_stripe_event_created = excluded.last_stripe_event_created;

  update public.stripe_events set status = 'processed', processed_at = now(), failure_code = null
  where event_id = p_event_id;
  return 'processed';
exception when unique_violation then
  update public.stripe_events set status = 'failed', processed_at = now(), failure_code = 'customer_or_subscription_conflict'
  where event_id = p_event_id;
  return 'customer_or_subscription_conflict';
end;
$$;

revoke all on function public.process_subscription_event(
  text, text, bigint, uuid, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz
) from public, anon, authenticated;
grant execute on function public.process_subscription_event(
  text, text, bigint, uuid, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz
) to service_role;

comment on table public.billing_customers is 'Minimal Stripe customer mapping. Never expose provider IDs to browser clients.';
comment on table public.account_subscriptions is 'Normalized webhook-authoritative subscription state.';
comment on table public.capability_usage is 'Atomic, idempotent capability allowance consumption without private content.';
comment on function public.consume_capability(uuid, text, integer, timestamptz, timestamptz, text, text)
is 'Service-role-only atomic capability consumption. Unknown capabilities deny by default.';
comment on function public.process_subscription_event(text, text, bigint, uuid, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz)
is 'Service-role-only idempotent and out-of-order-safe Stripe subscription normalization.';
