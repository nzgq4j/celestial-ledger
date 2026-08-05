create or replace function public.claim_report_job()
returns setof public.reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.reports;
begin
  update public.reports
  set status = 'failed',
      failure_code = 'WORKER_TIMEOUT',
      next_attempt_at = now()
  where status = 'generating'
    and started_at < now() - interval '6 minutes';

  select *
  into claimed
  from public.reports
  where status in ('queued', 'failed')
    and next_attempt_at <= now()
    and attempts < 10
  order by next_attempt_at, created_at
  for update skip locked
  limit 1;

  if claimed.id is null then
    return;
  end if;

  update public.reports
  set status = 'generating',
      attempts = attempts + 1,
      started_at = now(),
      failure_code = null
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

revoke all on function public.claim_report_job() from public, anon, authenticated;
grant execute on function public.claim_report_job() to service_role;

comment on function public.claim_report_job() is
  'Claims the next report job and requeues jobs abandoned by terminated workers.';
