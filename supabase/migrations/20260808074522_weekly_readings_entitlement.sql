-- Additive, disabled-by-default weekly reading persistence and capability correction.
-- Production execution requires the documented backup, dry run, manual approval,
-- and forward-recovery procedure. This migration does not enable the application flag.

create table public.weekly_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  week_start_date date not null check (extract(isodow from week_start_date) = 1),
  week_end_date date generated always as (week_start_date + 6) stored,
  observation_time_zone text not null check (char_length(observation_time_zone) between 1 and 100),
  locale text not null check (locale in ('en-GB','es-ES','fr-FR','de-DE')),
  capability text not null default 'weekly_reading.primary' check (capability = 'weekly_reading.primary'),
  status text not null default 'completed' check (status in ('completed','failed')),
  cache_key text not null check (cache_key ~ '^[a-f0-9]{64}$'),
  schema_version text not null,
  content_schema_version text not null,
  method_version text not null,
  rule_version text not null,
  prompt_version text not null,
  calculation_version text not null,
  ephemeris_version text not null,
  context_hash text not null default repeat('0', 64) check (context_hash ~ '^[a-f0-9]{64}$'),
  analysis jsonb not null,
  content jsonb not null,
  evidence jsonb not null,
  failure_code text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cache_key),
  unique (user_id, birth_profile_id, week_start_date, locale)
);

create index weekly_readings_user_week_idx
  on public.weekly_readings(user_id, week_start_date desc, created_at desc);
create index weekly_readings_profile_week_idx
  on public.weekly_readings(birth_profile_id, week_start_date desc);
create index weekly_readings_expiry_idx on public.weekly_readings(expires_at);

create trigger weekly_readings_set_updated_at
before update on public.weekly_readings
for each row execute function private.set_updated_at();

alter table public.weekly_readings enable row level security;
revoke all on public.weekly_readings from public, anon;
grant select, delete on public.weekly_readings to authenticated;
revoke insert, update on public.weekly_readings from authenticated;
grant all on public.weekly_readings to service_role;

create policy weekly_readings_select_own on public.weekly_readings
for select to authenticated
using ((select auth.uid()) = user_id and expires_at > now());

create policy weekly_readings_delete_own on public.weekly_readings
for delete to authenticated
using ((select auth.uid()) = user_id);

update public.plan_capabilities
set allowance = 1, period = 'week', configuration = jsonb_build_object('profile_scope', 'primary')
where capability_key = 'weekly_reading.primary'
  and plan_key in ('personal', 'premium');

comment on table public.weekly_readings is
  'Private, one-year weekly readings generated from the account primary birth profile.';
comment on column public.weekly_readings.cache_key is
  'Canonical hash including owner, primary profile revision, ISO week, time zone, locale, calculation, ephemeris, method, rule, content schema, prompt and context versions.';
