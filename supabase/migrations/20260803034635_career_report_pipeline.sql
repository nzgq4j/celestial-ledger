create function public.queue_paid_report(
  p_user_id uuid,
  p_entitlement_id uuid,
  p_birth_profile_id uuid,
  p_schema_version text,
  p_prompt_version text,
  p_safety_version text
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
  if entitlement.report_type <> 'career_purpose' then raise exception 'unsupported_report_type'; end if;
  if not exists (
    select 1 from public.birth_profiles
    where id = p_birth_profile_id and user_id = p_user_id and expires_at > now()
  ) then raise exception 'birth_profile_not_found'; end if;

  insert into public.reports(
    user_id, birth_profile_id, entitlement_id, report_type,
    schema_version, prompt_version, safety_version
  ) values (
    p_user_id, p_birth_profile_id, p_entitlement_id, entitlement.report_type,
    p_schema_version, p_prompt_version, p_safety_version
  ) returning id into report_id;

  update public.entitlements set status = 'queued' where id = p_entitlement_id;
  insert into public.audit_events(user_id, event_type, resource_type, resource_id)
  values (p_user_id, 'report_queued', 'report', report_id);
  return report_id;
end;
$$;

create function public.claim_report_job()
returns setof public.reports
language sql
security definer
set search_path = ''
as $$ select * from private.claim_report_job(); $$;

create function public.complete_report_job(
  p_report_id uuid,
  p_output jsonb,
  p_evidence jsonb,
  p_model_version text,
  p_calculation_version text,
  p_ephemeris_version text,
  p_timezone_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare claimed public.reports;
begin
  select * into claimed from public.reports where id = p_report_id and status = 'generating' for update;
  if claimed.id is null then raise exception 'report_not_generating'; end if;
  insert into public.report_evidence(report_id, user_id, evidence, calculation_version, ephemeris_version, timezone_name)
  values (claimed.id, claimed.user_id, p_evidence, p_calculation_version, p_ephemeris_version, p_timezone_name);
  update public.reports set status='completed', output=p_output, model_version=p_model_version,
    completed_at=now(), expires_at=now() + interval '1 year' where id=claimed.id;
  update public.entitlements set status='consumed', consumed_at=now() where id=claimed.entitlement_id;
  insert into public.audit_events(user_id,event_type,resource_type,resource_id)
  values (claimed.user_id,'report_completed','report',claimed.id);
end;
$$;

create function public.fail_report_job(p_report_id uuid, p_failure_code text, p_retryable boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reports set status='failed', failure_code=left(p_failure_code,80),
    next_attempt_at=case when p_retryable then now() + make_interval(mins => least(60, attempts * attempts)) else 'infinity'::timestamptz end
  where id=p_report_id and status='generating';
end;
$$;

revoke all on function public.queue_paid_report(uuid,uuid,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.claim_report_job() from public, anon, authenticated;
revoke all on function public.complete_report_job(uuid,jsonb,jsonb,text,text,text,text) from public, anon, authenticated;
revoke all on function public.fail_report_job(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.queue_paid_report(uuid,uuid,uuid,text,text,text) to service_role;
grant execute on function public.claim_report_job() to service_role;
grant execute on function public.complete_report_job(uuid,jsonb,jsonb,text,text,text,text) to service_role;
grant execute on function public.fail_report_job(uuid,text,boolean) to service_role;
