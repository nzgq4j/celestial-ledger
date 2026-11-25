-- Celestial Atlas app backend (additive only).
--
-- The redesigned app (web and Android) keeps calculations on the device and
-- stores only what a member chooses to keep:
--   * the birth profile, in the existing owner-only public.birth_profiles
--     (now with the full birth name for name numerology and the GeoNames ID);
--   * saved readings, in the new owner-only public.atlas_journal_entries;
--   * the Atlas+ membership, read through public.atlas_membership(), which uses
--     the same plan rule as the existing allowance checks.
-- Legacy tables are left in place and untouched.

-- ---------------------------------------------------------------------------
-- Birth profile additions
-- ---------------------------------------------------------------------------

alter table public.birth_profiles
  add column full_name text
    check (full_name is null or char_length(btrim(full_name)) between 2 and 200),
  add column geoname_id integer
    check (geoname_id is null or geoname_id > 0);

comment on column public.birth_profiles.full_name is
  'Full birth name for numerology (Expression, Soul Urge, Personality). Optional; owner-only through RLS.';
comment on column public.birth_profiles.geoname_id is
  'GeoNames ID of the birthplace chosen in the app. Coordinates and time zone are stored alongside it.';

-- ---------------------------------------------------------------------------
-- Journal
-- ---------------------------------------------------------------------------

create table public.atlas_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null
    check (entry_type in ('card_of_day', 'horoscope', 'numerology', 'compatibility', 'tarot', 'atlas_report')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  -- Calculation records and evidence the entry's claims rest on.
  record_ids text[] not null default '{}'
    check (cardinality(record_ids) <= 10),
  evidence jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence) = 'object' and pg_column_size(evidence) <= 65536),
  created_at timestamptz not null default now(),
  -- Private readings are kept for at most one year.
  expires_at timestamptz not null default (now() + interval '1 year'),
  check (expires_at > created_at and expires_at <= created_at + interval '1 year')
);

create index atlas_journal_entries_user_created_idx
  on public.atlas_journal_entries(user_id, created_at desc);
create index atlas_journal_entries_expiry_idx
  on public.atlas_journal_entries(expires_at);

comment on table public.atlas_journal_entries is
  'Readings a member saved in the Celestial Atlas app. Owner-only, immutable, deleted by the owner or after one year.';

alter table public.atlas_journal_entries enable row level security;
revoke all on public.atlas_journal_entries from public, anon, authenticated;
grant select, insert, delete on public.atlas_journal_entries to authenticated;
grant all on public.atlas_journal_entries to service_role;

create policy atlas_journal_entries_select_own on public.atlas_journal_entries
for select to authenticated
using ((select auth.uid()) = user_id and expires_at > now());

create policy atlas_journal_entries_insert_own on public.atlas_journal_entries
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy atlas_journal_entries_delete_own on public.atlas_journal_entries
for delete to authenticated
using ((select auth.uid()) = user_id);

-- Entries are written once by the app; created_at and expiry are server-set.
create function private.atlas_journal_entry_defaults()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  new.created_at := now();
  new.expires_at := now() + interval '1 year';
  perform pg_advisory_xact_lock(hashtextextended('atlas-journal:' || new.user_id::text, 0));
  select count(*) into v_count from public.atlas_journal_entries
  where user_id = new.user_id and expires_at > now();
  if v_count >= 2000 then
    raise exception using errcode = 'P0001', message = 'JOURNAL_LIMIT_REACHED';
  end if;
  return new;
end;
$$;
revoke all on function private.atlas_journal_entry_defaults() from public, anon, authenticated;

create trigger atlas_journal_entries_defaults
before insert on public.atlas_journal_entries
for each row execute function private.atlas_journal_entry_defaults();

-- Removes expired entries; called by the existing scheduled maintenance.
create function public.purge_expired_atlas_journal_entries()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_deleted integer;
begin
  delete from public.atlas_journal_entries where expires_at <= now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.purge_expired_atlas_journal_entries() from public, anon, authenticated;
grant execute on function public.purge_expired_atlas_journal_entries() to service_role;

-- ---------------------------------------------------------------------------
-- Membership for the signed-in member
-- ---------------------------------------------------------------------------

create function public.atlas_membership()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_sub record;
begin
  if v_user is null then
    return jsonb_build_object('plan', 'free');
  end if;
  v_plan := coalesce(private.membership_allowance(v_user, 'birth_profiles.saved')->>'plan', 'free');
  select s.status, s.current_period_end, s.cancel_at_period_end, s.provider
  into v_sub
  from public.account_subscriptions s
  join public.commerce_plans p on p.plan_key = s.plan_key and p.active
  where s.user_id = v_user and s.plan_key = v_plan and (
    (s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
    or (s.status = 'past_due' and s.grace_ends_at > now())
  )
  order by s.updated_at desc
  limit 1;
  return jsonb_build_object(
    'plan', v_plan,
    'status', v_sub.status,
    'currentPeriodEnd', v_sub.current_period_end,
    'cancelAtPeriodEnd', coalesce(v_sub.cancel_at_period_end, false),
    'provider', v_sub.provider
  );
end;
$$;
revoke all on function public.atlas_membership() from public, anon;
grant execute on function public.atlas_membership() to authenticated;

comment on function public.atlas_membership() is
  'The signed-in member''s plan (free or premium, shown as Atlas+) and the subscription behind it.';

-- ---------------------------------------------------------------------------
-- Atlas+ price: USD 6.99 a year with a 3-day trial
-- ---------------------------------------------------------------------------

-- Inserted inactive. It is activated (and the legacy monthly and yearly prices
-- deactivated) in a separate, approved step once the Stripe price exists.
insert into public.commerce_plan_prices(
  plan_key, billing_interval, stripe_price_id, currency, unit_amount, trial_days, active, catalog_version
) values ('premium', 'year', null, 'usd', 699, 3, false, 2)
on conflict (plan_key, billing_interval, catalog_version) do nothing;
