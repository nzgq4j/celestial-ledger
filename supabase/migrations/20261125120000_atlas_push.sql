-- Push notifications for the Celestial Atlas app (additive only).
--
-- Devices register a push address: a Firebase Cloud Messaging token (Android
-- app) or a Web Push subscription (website and iPhone home-screen app). The
-- app composes its own daily-insight texts for the next two weeks and uploads
-- them with their send times, so no birth data reaches the server. A scheduled
-- job delivers due messages and deletes them after sending.
--
-- Only the server (service role) reads or writes these tables. A device is
-- identified by the SHA-256 hash of a random key that only the device holds.

create table public.atlas_push_devices (
  id uuid primary key default gen_random_uuid(),
  device_key_hash text not null unique check (device_key_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('android', 'web')),
  fcm_token text check (fcm_token is null or char_length(fcm_token) between 32 and 4096),
  endpoint text check (endpoint is null or (char_length(endpoint) <= 2048 and endpoint like 'https://%')),
  p256dh text check (p256dh is null or char_length(p256dh) between 80 and 120),
  auth_secret text check (auth_secret is null or char_length(auth_secret) between 16 and 32),
  locale text not null default 'en' check (locale in ('en', 'es', 'fr', 'de')),
  announcements boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  check (
    (platform = 'android' and fcm_token is not null and endpoint is null)
    or (platform = 'web' and endpoint is not null and p256dh is not null and auth_secret is not null and fcm_token is null)
  )
);

create index atlas_push_devices_last_seen_idx on public.atlas_push_devices(last_seen_at);
create index atlas_push_devices_announcements_idx on public.atlas_push_devices(id) where announcements;

comment on table public.atlas_push_devices is
  'Push addresses for the Celestial Atlas app. No birth data. Server-only; removed when notifications are turned off or after 60 days unseen.';

create table public.atlas_push_messages (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.atlas_push_devices(id) on delete cascade,
  send_at timestamptz not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 400),
  url text not null default '/today' check (url ~ '^/[A-Za-z0-9/_-]*$' and char_length(url) <= 100),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (device_id, send_at)
);

create index atlas_push_messages_due_idx on public.atlas_push_messages(send_at) where sent_at is null;

comment on table public.atlas_push_messages is
  'Daily-insight texts composed on the device, delivered at send_at and deleted soon after. Server-only.';

create table public.atlas_push_announcements (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null check (jsonb_typeof(title) = 'object'),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  url text not null default '/today' check (url ~ '^/[A-Za-z0-9/_-]*$' and char_length(url) <= 100),
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.atlas_push_announcements is
  'Record of announcements sent to opted-in devices (text per language and delivery counts). Server-only.';

alter table public.atlas_push_devices enable row level security;
alter table public.atlas_push_messages enable row level security;
alter table public.atlas_push_announcements enable row level security;
revoke all on public.atlas_push_devices, public.atlas_push_messages, public.atlas_push_announcements
  from public, anon, authenticated;
grant all on public.atlas_push_devices, public.atlas_push_messages, public.atlas_push_announcements
  to service_role;

create trigger atlas_push_devices_set_updated_at before update on public.atlas_push_devices
for each row execute function private.set_updated_at();

-- Retention: sent or stale messages after two days; devices unseen for 60 days.
create function public.purge_atlas_push()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_messages integer; v_devices integer;
begin
  delete from public.atlas_push_messages
  where (sent_at is not null and sent_at < now() - interval '2 days')
     or send_at < now() - interval '2 days';
  get diagnostics v_messages = row_count;
  delete from public.atlas_push_devices where last_seen_at < now() - interval '60 days';
  get diagnostics v_devices = row_count;
  return jsonb_build_object('messages', v_messages, 'devices', v_devices);
end;
$$;
revoke all on function public.purge_atlas_push() from public, anon, authenticated;
grant execute on function public.purge_atlas_push() to service_role;
