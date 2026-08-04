alter table public.profiles
add column report_locale text
check (report_locale is null or report_locale in ('en-GB','es-ES','fr-FR','de-DE'));

alter table public.reports
add column locale text not null default 'en-GB'
check (locale in ('en-GB','es-ES','fr-FR','de-DE'));

drop function if exists public.queue_complimentary_report(uuid,text,uuid,text,text,text,jsonb);
drop function if exists public.queue_paid_report(uuid,uuid,uuid,text,text,text,jsonb);

create function public.queue_paid_report(
  p_user_id uuid,
  p_entitlement_id uuid,
  p_birth_profile_id uuid,
  p_schema_version text,
  p_prompt_version text,
  p_safety_version text,
  p_locale text,
  p_recovery_themes jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  entitlement public.entitlements;
  report_id uuid;
begin
  if p_locale not in ('en-GB','es-ES','fr-FR','de-DE') then
    raise exception 'unsupported_report_locale';
  end if;

  select * into entitlement
  from public.entitlements
  where id = p_entitlement_id and user_id = p_user_id
  for update;

  if entitlement.id is null then raise exception 'entitlement_not_found'; end if;
  if entitlement.status <> 'unused' then
    select id into report_id from public.reports where entitlement_id = p_entitlement_id;
    if report_id is not null then return report_id; end if;
    raise exception 'entitlement_unavailable';
  end if;
  if entitlement.report_type not in ('career_purpose', 'recovery_reflection') then
    raise exception 'unsupported_report_type';
  end if;
  if not exists (
    select 1 from public.birth_profiles
    where id = p_birth_profile_id and user_id = p_user_id and expires_at > now()
  ) then raise exception 'birth_profile_not_found'; end if;
  if entitlement.report_type = 'recovery_reflection' then
    if not exists (
      select 1 from public.profiles
      where id = p_user_id and adult_confirmed_at is not null
    ) then raise exception 'adult_confirmation_required'; end if;
    if p_recovery_themes is null
      or jsonb_typeof(p_recovery_themes) <> 'array'
      or jsonb_array_length(p_recovery_themes) < 1
      or jsonb_array_length(p_recovery_themes) > 6
      or exists (
        select 1 from jsonb_array_elements_text(p_recovery_themes) theme
        where theme not in ('grounding','relationships','self_trust','daily_rhythms','boundaries','renewal')
      ) then raise exception 'invalid_recovery_themes'; end if;
  elsif p_recovery_themes is not null then
    raise exception 'recovery_themes_not_allowed';
  end if;

  insert into public.reports(
    user_id, birth_profile_id, entitlement_id, report_type, recovery_themes,
    schema_version, prompt_version, safety_version, locale
  ) values (
    p_user_id, p_birth_profile_id, p_entitlement_id, entitlement.report_type,
    p_recovery_themes, p_schema_version, p_prompt_version, p_safety_version, p_locale
  ) returning id into report_id;

  update public.entitlements set status = 'queued' where id = p_entitlement_id;
  insert into public.audit_events(user_id, event_type, resource_type, resource_id)
  values (p_user_id, 'report_queued', 'report', report_id);
  return report_id;
end;
$$;

create function public.queue_complimentary_report(
  p_user_id uuid,
  p_report_type text,
  p_birth_profile_id uuid,
  p_schema_version text,
  p_prompt_version text,
  p_safety_version text,
  p_locale text,
  p_recovery_themes jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  complimentary_order_id uuid;
  complimentary_entitlement_id uuid;
begin
  if p_report_type not in ('career_purpose', 'recovery_reflection') then
    raise exception 'unsupported_report_type';
  end if;

  insert into public.orders(
    user_id, report_type, idempotency_key, amount_total, currency, status
  ) values (
    p_user_id, p_report_type, 'complimentary:' || gen_random_uuid()::text,
    0, 'usd', 'paid'
  ) returning id into complimentary_order_id;

  insert into public.entitlements(user_id, order_id, report_type)
  values (p_user_id, complimentary_order_id, p_report_type)
  returning id into complimentary_entitlement_id;

  return public.queue_paid_report(
    p_user_id, complimentary_entitlement_id, p_birth_profile_id,
    p_schema_version, p_prompt_version, p_safety_version, p_locale,
    p_recovery_themes
  );
end;
$$;

revoke all on function public.queue_paid_report(uuid,uuid,uuid,text,text,text,text,jsonb)
from public, anon, authenticated;
grant execute on function public.queue_paid_report(uuid,uuid,uuid,text,text,text,text,jsonb)
to service_role;

revoke all on function public.queue_complimentary_report(uuid,text,uuid,text,text,text,text,jsonb)
from public, anon, authenticated;
grant execute on function public.queue_complimentary_report(uuid,text,uuid,text,text,text,text,jsonb)
to service_role;

comment on column public.profiles.report_locale
is 'Optional account-level default locale for generated reports.';
comment on column public.reports.locale
is 'Immutable locale requested when this report was queued.';
