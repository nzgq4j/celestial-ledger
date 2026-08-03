create function public.queue_complimentary_report(
  p_user_id uuid,
  p_report_type text,
  p_birth_profile_id uuid,
  p_schema_version text,
  p_prompt_version text,
  p_safety_version text,
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
    p_user_id,
    p_report_type,
    'complimentary:' || gen_random_uuid()::text,
    0,
    'usd',
    'paid'
  ) returning id into complimentary_order_id;

  insert into public.entitlements(user_id, order_id, report_type)
  values (p_user_id, complimentary_order_id, p_report_type)
  returning id into complimentary_entitlement_id;

  return public.queue_paid_report(
    p_user_id,
    complimentary_entitlement_id,
    p_birth_profile_id,
    p_schema_version,
    p_prompt_version,
    p_safety_version,
    p_recovery_themes
  );
end;
$$;

revoke all on function public.queue_complimentary_report(uuid,text,uuid,text,text,text,jsonb)
from public, anon, authenticated;
grant execute on function public.queue_complimentary_report(uuid,text,uuid,text,text,text,jsonb)
to service_role;

comment on function public.queue_complimentary_report(uuid,text,uuid,text,text,text,jsonb)
is 'Creates an auditable zero-value order and entitlement before queueing a complimentary report.';
