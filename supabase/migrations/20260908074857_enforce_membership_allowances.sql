-- Quotas are reserved before generation. Completed usage survives report deletion.
-- Existing readings remain accessible and are not charged retrospectively.
create function private.membership_allowance(p_user_id uuid, p_capability text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_plan text := 'free';
  v_plan_allowance integer;
  v_plan_period text;
  v_has_plan boolean;
  v_grant public.capability_grants%rowtype;
begin
  if exists (select 1 from public.admin_roles where user_id = p_user_id and role = 'site_admin') then
    return jsonb_build_object('plan', 'premium', 'allowance', null, 'period', 'none', 'allowed', true);
  end if;
  select s.plan_key into v_plan from public.account_subscriptions s
  join public.commerce_plans p on p.plan_key = s.plan_key and p.active
  where s.user_id = p_user_id and (
    (s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end > now()))
    or (s.status = 'past_due' and s.grace_ends_at > now())
  ) order by p.rank desc limit 1;
  v_plan := coalesce(v_plan, 'free');
  select allowance, period into v_plan_allowance, v_plan_period
  from public.plan_capabilities where plan_key = v_plan and capability_key = p_capability;
  v_has_plan := found;
  select * into v_grant from public.capability_grants
  where user_id = p_user_id and capability_key = p_capability and status = 'active'
    and starts_at <= now() and (ends_at is null or ends_at > now())
  order by priority desc, created_at desc, id limit 1;
  return jsonb_build_object(
    'plan', v_plan, 'allowed', v_has_plan or v_grant.id is not null,
    'allowance', case when (v_has_plan and v_plan_allowance is null)
      or (v_grant.id is not null and v_grant.allowance is null) then null
      else greatest(coalesce(v_plan_allowance, 0), coalesce(v_grant.allowance, 0)) end,
    'period', coalesce(v_grant.period, v_plan_period, 'none')
  );
end;
$$;
revoke all on function private.membership_allowance(uuid, text) from public, anon, authenticated;

create function private.enforce_saved_chart_allowance()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_access jsonb; v_count integer;
begin
  if new.expires_at <= now() then return new; end if;
  if tg_op = 'UPDATE' then
    if old.user_id = new.user_id and old.expires_at > now() then return new; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('saved-charts:' || new.user_id::text, 0));
  v_access := private.membership_allowance(new.user_id, 'birth_profiles.saved');
  select count(*) into v_count from public.birth_profiles
  where user_id = new.user_id and expires_at > now() and id <> new.id;
  if not (v_access->>'allowed')::boolean
    or v_count >= (v_access->>'allowance')::integer then
    raise exception using errcode = 'P0001', message = 'SAVED_CHART_ALLOWANCE_EXHAUSTED';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_saved_chart_allowance() from public, anon, authenticated;
create trigger birth_profiles_enforce_allowance
before insert or update of user_id, expires_at on public.birth_profiles
for each row execute function private.enforce_saved_chart_allowance();

create table public.daily_reading_reservations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_profile_id uuid not null,
  cache_key text not null check (cache_key ~ '^[a-f0-9]{64}$'),
  capability_key text not null,
  created_at timestamptz not null default now(),
  lease_expires_at timestamptz not null default (now() + interval '10 minutes'),
  completed boolean not null default false
);
create index daily_reading_reservations_quota_idx
on public.daily_reading_reservations(user_id, capability_key, created_at);
create index daily_reading_reservations_cache_idx
on public.daily_reading_reservations(user_id, cache_key);
alter table public.daily_reading_reservations enable row level security;
revoke all on public.daily_reading_reservations from public, anon, authenticated;
grant all on public.daily_reading_reservations to service_role;

-- Only trusted server callers may inspect another account's allowance.
create function public.daily_reading_allowance(p_user_id uuid, p_birth_profile_id uuid)
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
  if v_period = 'day' then
    v_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
    v_end := v_start + interval '1 day';
  elsif v_period = 'week' then
    v_start := date_trunc('week', now() at time zone 'UTC') at time zone 'UTC';
    v_end := v_start + interval '7 days';
  elsif v_period = 'billing_month' then
    select current_period_start, current_period_end into v_start, v_end
    from public.account_subscriptions where user_id = p_user_id
      and plan_key = v_access->>'plan' and status in ('active','trialing','past_due')
      and current_period_start <= now() and current_period_end > now()
    order by current_period_start desc limit 1;
    if v_start is null then
      v_start := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
      v_end := v_start + interval '1 month';
    end if;
  elsif v_period = 'quarter' then
    v_start := date_trunc('quarter', now() at time zone 'UTC') at time zone 'UTC';
    v_end := v_start + interval '3 months';
  else
    v_start := '1970-01-01 UTC'::timestamptz;
    v_end := '9999-01-01 UTC'::timestamptz;
  end if;
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

create function public.reserve_daily_reading(p_user_id uuid, p_birth_profile_id uuid, p_cache_key text, p_reading_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_access jsonb; v_cached uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('daily-reading:' || p_user_id::text, 0));
  select id into v_cached from public.daily_readings where user_id = p_user_id
    and birth_profile_id = p_birth_profile_id and cache_key = p_cache_key and expires_at > now();
  if v_cached is not null then return jsonb_build_object('status', 'cached', 'readingId', v_cached); end if;
  if exists (select 1 from public.daily_reading_reservations where user_id = p_user_id
    and cache_key = p_cache_key and not completed and lease_expires_at > now()) then
    return jsonb_build_object('status', 'in_progress');
  end if;
  v_access := public.daily_reading_allowance(p_user_id, p_birth_profile_id);
  if v_access->>'status' <> 'available' then return v_access; end if;
  insert into public.daily_reading_reservations(id, user_id, birth_profile_id, cache_key, capability_key)
  values (p_reading_id, p_user_id, p_birth_profile_id, p_cache_key, v_access->>'capability');
  return v_access || jsonb_build_object('status', 'reserved');
end;
$$;
revoke all on function public.reserve_daily_reading(uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_daily_reading(uuid, uuid, text, uuid) to service_role;

create function public.release_daily_reading(p_user_id uuid, p_reading_id uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.daily_reading_reservations where id = p_reading_id and user_id = p_user_id and not completed;
$$;
revoke all on function public.release_daily_reading(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_daily_reading(uuid, uuid) to service_role;

-- Finalizing and saving happen in one transaction; failed saves do not consume quota.
create function private.complete_daily_reading_reservation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_access jsonb;
begin
  -- Compatibility with the currently deployed API during rollout or rollback:
  -- legacy callers still consume the same allowance atomically at save time.
  if not exists (select 1 from public.daily_reading_reservations where id = new.id) then
    v_access := public.reserve_daily_reading(new.user_id, new.birth_profile_id, new.cache_key, new.id);
    if v_access->>'status' <> 'reserved' then
      raise exception using errcode = 'P0001', message = 'DAILY_READING_ALLOWANCE_EXHAUSTED';
    end if;
  end if;
  update public.daily_reading_reservations set completed = true
  where id = new.id and user_id = new.user_id and birth_profile_id = new.birth_profile_id
    and cache_key = new.cache_key and not completed and lease_expires_at > now();
  if not found then
    raise exception using errcode = 'P0001', message = 'DAILY_READING_RESERVATION_REQUIRED';
  end if;
  return new;
end;
$$;
revoke all on function private.complete_daily_reading_reservation() from public, anon, authenticated;
create trigger daily_readings_complete_reservation before insert on public.daily_readings
for each row execute function private.complete_daily_reading_reservation();

-- Retire obsolete Premium pricing/quarterly issuance without revoking earned credits.
update public.plan_capabilities set allowance = 0,
  configuration = configuration || '{"retired":true,"replaced_by":"included_reports"}'::jsonb
where plan_key = 'premium' and capability_key in ('report.discount_percent', 'report.standard_credit');
update public.report_prices set active = false where plan_key = 'premium';

create or replace function public.record_paid_subscription_invoice(
  p_stripe_invoice_id text, p_stripe_payment_intent_id text,
  p_stripe_subscription_id text, p_user_id uuid, p_paid_at timestamptz
) returns text language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('paid-invoice:' || p_stripe_subscription_id, 0));
  if exists (select 1 from public.subscription_paid_invoices where stripe_invoice_id = p_stripe_invoice_id) then return 'duplicate'; end if;
  if not exists (select 1 from public.account_subscriptions where stripe_subscription_id = p_stripe_subscription_id
    and user_id = p_user_id and plan_key = 'premium' and status in ('active','trialing')) then return 'ineligible'; end if;
  insert into public.subscription_paid_invoices(stripe_invoice_id, stripe_payment_intent_id, stripe_subscription_id, user_id, paid_at)
  values (p_stripe_invoice_id, p_stripe_payment_intent_id, p_stripe_subscription_id, p_user_id, p_paid_at);
  return 'recorded';
end;
$$;
revoke all on function public.record_paid_subscription_invoice(text, text, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.record_paid_subscription_invoice(text, text, text, uuid, timestamptz) to service_role;
comment on function public.record_paid_subscription_invoice(text, text, text, uuid, timestamptz)
is 'Idempotent Premium invoice ledger. Reports are included; no new quarterly credits are issued.';
