create table public.daily_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  reading_date date not null,
  observation_time_zone text not null check (
    char_length(observation_time_zone) between 1 and 100
  ),
  locale text not null check (locale in ('en-GB','es-ES','fr-FR','de-DE')),
  capability text not null default 'registered_daily_reading' check (
    capability = 'registered_daily_reading'
  ),
  status text not null default 'completed' check (status in ('completed','failed')),
  cache_key text not null check (cache_key ~ '^[a-f0-9]{64}$'),
  schema_version text not null,
  method_version text not null,
  rule_version text not null,
  calculation_version text not null,
  ephemeris_version text not null,
  analysis jsonb not null,
  content jsonb not null,
  evidence jsonb not null,
  failure_code text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cache_key)
);

create index daily_readings_user_date_idx
  on public.daily_readings(user_id, reading_date desc, created_at desc);
create index daily_readings_profile_date_idx
  on public.daily_readings(birth_profile_id, reading_date desc);
create index daily_readings_expiry_idx on public.daily_readings(expires_at);

create trigger daily_readings_set_updated_at
before update on public.daily_readings
for each row execute function private.set_updated_at();

alter table public.daily_readings enable row level security;

revoke all on public.daily_readings from anon;
grant select, delete on public.daily_readings to authenticated;
revoke insert, update on public.daily_readings from authenticated;
grant all on public.daily_readings to service_role;

create policy daily_readings_select_own on public.daily_readings
for select to authenticated
using (user_id = (select auth.uid()) and expires_at > now());

create policy daily_readings_delete_own on public.daily_readings
for delete to authenticated
using (user_id = (select auth.uid()));

comment on table public.daily_readings is
  'Private, one-year registered-user daily readings generated from an owned birth profile.';
comment on column public.daily_readings.capability is
  'Server-derived access basis. This release grants the capability only to authenticated registered users with an owned active birth profile.';
comment on column public.daily_readings.cache_key is
  'Hash of owned profile revision, civil date, time zone, locale, method, rule, calculation and ephemeris versions.';
