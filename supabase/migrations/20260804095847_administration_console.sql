create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('site_admin','user_admin','content_admin','analyst')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  value jsonb not null default '{}'::jsonb check (jsonb_typeof(value) = 'object'),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (char_length(action) between 3 and 80),
  target_user_id uuid references auth.users(id) on delete set null,
  setting_key text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  author_name text not null check (char_length(author_name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 140),
  excerpt text not null check (char_length(excerpt) between 20 and 360),
  body text not null check (char_length(body) between 50 and 50000),
  seo_title text check (seo_title is null or char_length(seo_title) between 3 and 80),
  seo_description text check (seo_description is null or char_length(seo_description) between 20 and 220),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status = 'draft')
);

create index admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor_id, created_at desc);
create index blog_posts_published_idx on public.blog_posts(published_at desc) where status = 'published';

alter table public.admin_roles enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.blog_posts enable row level security;

revoke all on public.admin_roles, public.site_settings, public.admin_audit_log
from public, anon, authenticated;
grant all on public.admin_roles, public.site_settings, public.admin_audit_log to service_role;
grant usage, select on sequence public.admin_audit_log_id_seq to service_role;
revoke all on public.blog_posts from public, anon, authenticated;
grant all on public.blog_posts to service_role;
grant select on public.blog_posts to anon, authenticated;
create policy blog_posts_public_read on public.blog_posts for select
to anon, authenticated using (status = 'published' and published_at <= now());

insert into public.admin_roles(user_id, role)
select id, 'site_admin' from auth.users
where lower(email) = 'david@crucibleinsight.com'
on conflict (user_id) do update set role = excluded.role, updated_at = now();

insert into public.site_settings(key, value) values
  ('ai.models', '{"report":"gpt-5-mini","interpretation":"gpt-5-mini"}'),
  ('security.recaptcha', '{"enabled":false,"siteKey":""}'),
  ('analytics.google', '{"enabled":false,"measurementId":""}'),
  ('search.google', '{"verificationToken":""}'),
  ('seo.defaults', '{"title":"Celestial Atlas","description":"Personal astrology charts and evidence-linked private readings.","canonicalBase":"https://www.celestialatlas.app","indexingEnabled":true}'),
  ('geo.defaults', '{"enabled":true,"organizationDescription":"Celestial Atlas creates personal astrology charts and evidence-linked private readings.","sameAs":[]}')
on conflict (key) do nothing;

comment on table public.admin_roles is 'Server-only application RBAC assignments. Never authorize from user_metadata.';
comment on table public.site_settings is 'Server-managed non-secret operational settings. Credentials remain in the deployment secret store.';
comment on table public.admin_audit_log is 'Privacy-minimized log of privileged administrative changes. Never store secrets or private report content.';
comment on table public.blog_posts is 'Public editorial journal with server-only authoring and published-only RLS access.';
