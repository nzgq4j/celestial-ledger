create index entitlements_report_type_idx on public.entitlements(report_type);
create index orders_report_type_idx on public.orders(report_type);
create index reports_report_type_idx on public.reports(report_type);

create policy stripe_events_deny_client_access on public.stripe_events
for all to anon, authenticated
using (false)
with check (false);

create policy audit_events_deny_client_access on public.audit_events
for all to anon, authenticated
using (false)
with check (false);

