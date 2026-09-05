-- Additive private snapshots. Server-generated only; clients may read/delete their own.
create table public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id text not null,
  reading_id text not null check (reading_id in ('daily','ppf','love5','celtic','grand')),
  title text not null,
  locale text not null check (locale in ('en-GB','es-ES','fr-FR','de-DE')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  content_version text not null default 'tarot-reviewed-v1',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  constraint tarot_reading_retention check (expires_at > created_at and expires_at <= created_at + interval '1 year')
);
create index tarot_readings_owner_created on public.tarot_readings(user_id, created_at desc);
alter table public.tarot_readings enable row level security;
revoke all on public.tarot_readings from anon, authenticated;
grant select, delete on public.tarot_readings to authenticated;
grant all on public.tarot_readings to service_role;
create policy tarot_readings_owner_read on public.tarot_readings for select to authenticated
  using ((select auth.uid()) = user_id and expires_at > now());
create policy tarot_readings_owner_delete on public.tarot_readings for delete to authenticated
  using ((select auth.uid()) = user_id);
