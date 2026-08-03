create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  adult_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  report_type text primary key check (report_type in ('career_purpose','future_trends','recovery_reflection')),
  name text not null,
  description text not null,
  stripe_product_id text unique,
  stripe_price_id text unique,
  currency text check (currency is null or currency ~ '^[a-z]{3}$'),
  unit_amount integer check (unit_amount is null or unit_amount >= 0),
  active boolean not null default false,
  catalog_version integer not null default 1 check (catalog_version > 0),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (not active)
    or (stripe_product_id is not null and stripe_price_id is not null and currency is not null and unit_amount is not null)
  )
);

create table public.birth_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  birth_date date not null,
  birth_time time,
  time_unknown boolean not null default false,
  disambiguation text check (disambiguation in ('earlier','later')),
  city text not null check (char_length(city) between 1 and 160),
  region text check (region is null or char_length(region) <= 160),
  country text not null check (char_length(country) between 1 and 160),
  display_name text not null check (char_length(display_name) between 1 and 500),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  time_zone text not null check (char_length(time_zone) between 1 and 100),
  chart jsonb,
  calculation_version text,
  expires_at timestamptz not null default (now() + interval '1 year'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((time_unknown and birth_time is null) or (not time_unknown and birth_time is not null)),
  check (chart is null or jsonb_typeof(chart) = 'object')
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  report_type text not null references public.products(report_type),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  idempotency_key text not null,
  amount_total integer check (amount_total is null or amount_total >= 0),
  currency text check (currency is null or currency ~ '^[a-z]{3}$'),
  status text not null default 'pending' check (status in ('pending','paid','expired','refunded','disputed','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  report_type text not null references public.products(report_type),
  status text not null default 'unused' check (status in ('unused','queued','consumed','refunded')),
  granted_at timestamptz not null default now(),
  consumed_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status = 'consumed' and consumed_at is not null) or (status <> 'consumed' and consumed_at is null))
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  entitlement_id uuid not null unique references public.entitlements(id) on delete restrict,
  report_type text not null references public.products(report_type),
  status text not null default 'queued' check (status in ('queued','generating','completed','failed','deleted')),
  recovery_themes jsonb,
  schema_version text not null,
  model_version text,
  prompt_version text not null,
  safety_version text not null,
  output jsonb,
  failure_code text,
  attempts smallint not null default 0 check (attempts between 0 and 10),
  next_attempt_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recovery_themes is null or jsonb_typeof(recovery_themes) = 'array'),
  check (output is null or jsonb_typeof(output) = 'object'),
  check (
    (status = 'completed' and output is not null and completed_at is not null and expires_at is not null)
    or status <> 'completed'
  )
);

create table public.report_evidence (
  report_id uuid primary key references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence jsonb not null check (jsonb_typeof(evidence) = 'object'),
  calculation_version text not null,
  ephemeris_version text not null,
  timezone_name text not null,
  generated_at timestamptz not null default now()
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'received' check (status in ('received','processed','failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_code text
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index birth_profiles_user_id_idx on public.birth_profiles(user_id);
create index birth_profiles_expiry_idx on public.birth_profiles(expires_at);
create index orders_user_id_created_idx on public.orders(user_id, created_at desc);
create index orders_status_idx on public.orders(status);
create index entitlements_user_id_status_idx on public.entitlements(user_id, status);
create index reports_user_id_created_idx on public.reports(user_id, created_at desc);
create index reports_birth_profile_id_idx on public.reports(birth_profile_id);
create index reports_queue_idx on public.reports(next_attempt_at, created_at)
  where status in ('queued','failed') and attempts < 10;
create index reports_expiry_idx on public.reports(expires_at)
  where expires_at is not null;
create index report_evidence_user_id_idx on public.report_evidence(user_id);
create index stripe_events_status_idx on public.stripe_events(status, received_at);
create index audit_events_user_id_created_idx on public.audit_events(user_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger birth_profiles_set_updated_at before update on public.birth_profiles
for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function private.set_updated_at();
create trigger entitlements_set_updated_at before update on public.entitlements
for each row execute function private.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id) values (new.id);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.protect_completed_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'completed' then
    raise exception 'Completed reports are immutable';
  end if;
  return new;
end;
$$;

create trigger reports_protect_completed
before update on public.reports
for each row execute function private.protect_completed_report();

create function private.claim_report_job()
returns setof public.reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.reports;
begin
  select *
  into claimed
  from public.reports
  where status in ('queued','failed')
    and next_attempt_at <= now()
    and attempts < 10
  order by next_attempt_at, created_at
  for update skip locked
  limit 1;

  if claimed.id is null then
    return;
  end if;

  update public.reports
  set status = 'generating',
      attempts = attempts + 1,
      started_at = now(),
      failure_code = null
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;
revoke all on function private.claim_report_job() from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_report_job() to service_role;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.reports enable row level security;
alter table public.report_evidence enable row level security;
alter table public.stripe_events enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.birth_profiles to authenticated;
grant select on public.orders, public.entitlements, public.reports, public.report_evidence to authenticated;
grant delete on public.reports to authenticated;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy products_select_active on public.products
for select to anon, authenticated
using (active);

create policy birth_profiles_select_own on public.birth_profiles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy birth_profiles_insert_own on public.birth_profiles
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy birth_profiles_update_own on public.birth_profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy birth_profiles_delete_own on public.birth_profiles
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy orders_select_own on public.orders
for select to authenticated
using ((select auth.uid()) = user_id);

create policy entitlements_select_own on public.entitlements
for select to authenticated
using ((select auth.uid()) = user_id);

create policy reports_select_own on public.reports
for select to authenticated
using ((select auth.uid()) = user_id);

create policy reports_delete_own on public.reports
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy report_evidence_select_own on public.report_evidence
for select to authenticated
using ((select auth.uid()) = user_id);

insert into public.products(report_type, name, description)
values
  ('career_purpose', 'Career and Purpose', 'A reflective report about motivation, values, contribution, and work environments.'),
  ('future_trends', 'Future Trends', 'A twelve-month symbolic transit report based on deterministic evidence.'),
  ('recovery_reflection', 'Recovery Reflection', 'An adults-only reflection using reviewed structured themes.')
on conflict (report_type) do nothing;

comment on table public.stripe_events is 'Stores Stripe event identifiers and processing state only; raw webhook payloads are not retained.';
comment on table public.audit_events is 'Privacy-minimized operational events. Never store birth data, prompts, report output, tokens, or secrets in metadata.';
comment on function private.claim_report_job() is 'Service-role-only atomic report queue claim using SKIP LOCKED.';

