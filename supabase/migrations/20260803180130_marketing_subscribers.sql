create table public.marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  consent_version text not null,
  consent_source text not null check (char_length(consent_source) between 1 and 80),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  linked_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(email)),
  check ((status = 'unsubscribed' and unsubscribed_at is not null) or status = 'subscribed')
);

create unique index marketing_subscribers_email_key
on public.marketing_subscribers (lower(email));

create index marketing_subscribers_status_idx
on public.marketing_subscribers (status, consented_at desc);

alter table public.marketing_subscribers enable row level security;
revoke all on public.marketing_subscribers from public, anon, authenticated;

create trigger marketing_subscribers_set_updated_at
before update on public.marketing_subscribers
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'display_name'), ''));

  update public.marketing_subscribers
  set linked_user_id = new.id
  where email = lower(new.email)
    and status = 'subscribed';

  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

comment on table public.marketing_subscribers is
  'Consent-based marketing list stored separately from authenticated accounts. Contains no birth data.';
