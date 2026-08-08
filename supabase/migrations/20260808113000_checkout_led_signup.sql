create table public.pending_chart_claims (
  claim_token_hash text primary key check (claim_token_hash ~ '^[a-f0-9]{64}$'),
  requested_plan_key text not null references public.commerce_plans(plan_key) on delete restrict
    check (requested_plan_key in ('personal', 'premium')),
  display_name text check (display_name is null or char_length(display_name) between 2 and 50),
  birth_input jsonb not null check (jsonb_typeof(birth_input) = 'object'),
  chart jsonb not null check (jsonb_typeof(chart) = 'object'),
  natal_reading text not null check (char_length(natal_reading) between 200 and 60000),
  natal_reading_model_version text not null check (char_length(natal_reading_model_version) between 1 and 100),
  natal_reading_prompt_version text not null check (char_length(natal_reading_prompt_version) between 1 and 100),
  request_fingerprint_hash text not null check (request_fingerprint_hash ~ '^[a-f0-9]{64}$'),
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  user_id uuid references auth.users(id) on delete set null,
  birth_profile_id uuid references public.birth_profiles(id) on delete set null,
  claimed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((claimed_at is null and birth_profile_id is null) or (claimed_at is not null and birth_profile_id is not null))
);

create index pending_chart_claims_expiry_idx
on public.pending_chart_claims(expires_at);

create index pending_chart_claims_rate_limit_idx
on public.pending_chart_claims(request_fingerprint_hash, created_at desc);

create table public.subscription_signin_claims (
  checkout_session_hash text primary key check (checkout_session_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  locked_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index subscription_signin_claims_expiry_idx
on public.subscription_signin_claims(expires_at);

alter table public.pending_chart_claims enable row level security;
alter table public.subscription_signin_claims enable row level security;

revoke all on public.pending_chart_claims from public, anon, authenticated;
revoke all on public.subscription_signin_claims from public, anon, authenticated;

create or replace function public.attach_pending_chart_claim(
  p_claim_token_hash text,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.pending_chart_claims;
  v_profile_id uuid;
begin
  select * into v_claim
  from public.pending_chart_claims
  where claim_token_hash = p_claim_token_hash
  for update;

  if v_claim.claim_token_hash is null then
    return null;
  end if;
  if v_claim.expires_at <= now() then
    return null;
  end if;
  if v_claim.birth_profile_id is not null then
    return v_claim.birth_profile_id;
  end if;

  insert into public.birth_profiles (
    user_id, label, birth_date, birth_time, time_unknown, disambiguation,
    city, region, country, display_name, latitude, longitude, time_zone,
    chart, calculation_version, natal_reading, natal_reading_model_version,
    natal_reading_prompt_version, natal_reading_generated_at
  ) values (
    p_user_id,
    'My birth chart',
    (v_claim.birth_input->>'date')::date,
    case when (v_claim.birth_input->>'timeUnknown')::boolean
      then null else (v_claim.birth_input->>'time')::time end,
    (v_claim.birth_input->>'timeUnknown')::boolean,
    nullif(v_claim.birth_input->>'disambiguation', ''),
    v_claim.birth_input#>>'{place,city}',
    nullif(v_claim.birth_input#>>'{place,region}', ''),
    v_claim.birth_input#>>'{place,country}',
    v_claim.birth_input#>>'{place,displayName}',
    (v_claim.birth_input#>>'{place,latitude}')::double precision,
    (v_claim.birth_input#>>'{place,longitude}')::double precision,
    v_claim.birth_input#>>'{place,timeZone}',
    v_claim.chart,
    v_claim.chart#>>'{calculation,calculationVersion}',
    v_claim.natal_reading,
    v_claim.natal_reading_model_version,
    v_claim.natal_reading_prompt_version,
    now()
  ) returning id into v_profile_id;

  update public.pending_chart_claims
  set user_id = p_user_id,
      birth_profile_id = v_profile_id,
      stripe_customer_id = p_stripe_customer_id,
      stripe_subscription_id = p_stripe_subscription_id,
      claimed_at = now()
  where claim_token_hash = p_claim_token_hash;

  return v_profile_id;
end;
$$;

revoke all on function public.attach_pending_chart_claim(text, uuid, text, text)
from public, anon, authenticated;
grant execute on function public.attach_pending_chart_claim(text, uuid, text, text)
to service_role;

comment on table public.pending_chart_claims is
  'Short-lived server-only chart state for checkout-led signup. Raw tokens, birth data, and chart data must never be logged or copied to Stripe metadata.';
comment on table public.subscription_signin_claims is
  'Short-lived single-use server claim used to hydrate a paid subscriber session after webhook-confirmed provisioning.';
comment on function public.attach_pending_chart_claim(text, uuid, text, text) is
  'Service-role-only, idempotent attachment of a validated pending chart to its webhook-provisioned owner.';
