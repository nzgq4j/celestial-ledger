create table public.daily_horoscope_editions (
  id uuid primary key default gen_random_uuid(),
  edition_date date not null,
  locale text not null check (locale in ('en-GB','es-ES','fr-FR','de-DE')),
  status text not null default 'generating' check (status in ('generating','published','failed')),
  daily_summary text,
  readings jsonb,
  evidence jsonb not null,
  editorial_plan jsonb,
  validation jsonb,
  calculation_version text not null,
  prompt_version text not null,
  model_version text,
  failure_code text,
  generated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_date, locale)
);

alter table public.daily_horoscope_editions enable row level security;

create index daily_horoscope_editions_published_idx
  on public.daily_horoscope_editions(locale, edition_date desc)
  where status = 'published';

create trigger daily_horoscope_editions_set_updated_at
before update on public.daily_horoscope_editions
for each row execute function private.set_updated_at();

revoke all on table public.daily_horoscope_editions from public, anon, authenticated;
grant all on table public.daily_horoscope_editions to service_role;

comment on table public.daily_horoscope_editions is
  'Server-generated, evidence-bound daily horoscope editions. Public pages access these only through trusted server rendering.';
