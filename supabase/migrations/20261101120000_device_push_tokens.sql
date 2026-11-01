-- Android app push tokens (Firebase Cloud Messaging) for the morning reading
-- alert. Additive. Rows are written by /api/devices with the service role
-- after the user is authenticated; owners may also read, change and delete
-- their own rows. A token moves to whichever account signs in on the device.
create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique check (char_length(token) between 32 and 4096),
  platform text not null default 'android' check (platform in ('android')),
  locale text not null default 'en-GB' check (locale in ('en-GB','es-ES','fr-FR','de-DE')),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  morning_alert_enabled boolean not null default true,
  morning_alert_local_time time not null default '06:30',
  last_notified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index device_push_tokens_user_idx on public.device_push_tokens(user_id);
create index device_push_tokens_morning_idx on public.device_push_tokens(last_notified_on, id)
  where morning_alert_enabled;

create trigger device_push_tokens_set_updated_at before update on public.device_push_tokens
for each row execute function private.set_updated_at();

alter table public.device_push_tokens enable row level security;
revoke all on public.device_push_tokens from public, anon, authenticated;
grant select, insert, update, delete on public.device_push_tokens to authenticated;
grant all on public.device_push_tokens to service_role;

create policy device_push_tokens_owner_select on public.device_push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
create policy device_push_tokens_owner_insert on public.device_push_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy device_push_tokens_owner_update on public.device_push_tokens
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy device_push_tokens_owner_delete on public.device_push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.device_push_tokens is
  'FCM registration tokens for the Android app. No birth data. last_notified_on is the device-local date of the last morning alert.';
