create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  reason text not null check (reason in ('general','account','billing','privacy','technical','partnership','other')),
  message text not null check (char_length(message) between 10 and 5000),
  notification_status text not null default 'pending' check (notification_status in ('pending','sent','failed','not_configured')),
  notification_id text,
  notification_attempted_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages(created_at desc);
create index contact_messages_notification_idx on public.contact_messages(notification_status, created_at);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from public, anon, authenticated;
grant all on public.contact_messages to service_role;

comment on table public.contact_messages is 'Private contact submissions. Service-role only; messages are visible in the administration console.';

