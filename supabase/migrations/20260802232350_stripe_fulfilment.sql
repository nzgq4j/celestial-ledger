create or replace function public.process_stripe_event(
  p_event_id text,
  p_event_type text,
  p_action text,
  p_order_id uuid,
  p_user_id uuid default null,
  p_report_type text default null,
  p_checkout_session_id text default null,
  p_payment_intent_id text default null,
  p_amount_total integer default null,
  p_currency text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if exists (select 1 from public.stripe_events where event_id = p_event_id and status = 'processed') then
    return 'duplicate';
  end if;

  insert into public.stripe_events(event_id, event_type, status)
  values (p_event_id, p_event_type, 'received')
  on conflict (event_id) do update set event_type = excluded.event_type;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    update public.stripe_events set status = 'failed', processed_at = now(), failure_code = 'order_not_found' where event_id = p_event_id;
    return 'order_not_found';
  end if;

  if p_action = 'paid' then
    if p_user_id is null or p_report_type is null or p_checkout_session_id is null
      or p_amount_total is null or p_currency is null
      or v_order.user_id <> p_user_id or v_order.report_type <> p_report_type
      or v_order.amount_total <> p_amount_total or v_order.currency <> lower(p_currency)
      or (v_order.stripe_checkout_session_id is not null and v_order.stripe_checkout_session_id <> p_checkout_session_id) then
      update public.stripe_events set status = 'failed', processed_at = now(), failure_code = 'purchase_mismatch' where event_id = p_event_id;
      return 'purchase_mismatch';
    end if;

    update public.orders set status = 'paid', stripe_checkout_session_id = p_checkout_session_id,
      stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id)
    where id = p_order_id and status in ('pending', 'paid');
    insert into public.entitlements(user_id, order_id, report_type)
    values (p_user_id, p_order_id, p_report_type)
    on conflict (order_id) do nothing;
  elsif p_action = 'expired' then
    update public.orders set status = 'expired', stripe_checkout_session_id = coalesce(p_checkout_session_id, stripe_checkout_session_id)
    where id = p_order_id and status = 'pending';
  elsif p_action = 'failed' then
    update public.orders set status = 'failed' where id = p_order_id and status = 'pending';
  elsif p_action = 'refunded' then
    update public.orders set status = 'refunded' where id = p_order_id and status in ('paid', 'refunded');
    update public.entitlements set status = 'refunded'
    where order_id = p_order_id and status = 'unused';
  elsif p_action = 'disputed' then
    update public.orders set status = 'disputed' where id = p_order_id and status in ('paid', 'disputed');
    update public.entitlements set status = 'refunded'
    where order_id = p_order_id and status = 'unused';
  else
    update public.stripe_events set status = 'failed', processed_at = now(), failure_code = 'unsupported_action' where event_id = p_event_id;
    return 'unsupported_action';
  end if;

  update public.stripe_events set status = 'processed', processed_at = now(), failure_code = null where event_id = p_event_id;
  return 'processed';
end;
$$;

revoke all on function public.process_stripe_event(text, text, text, uuid, uuid, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.process_stripe_event(text, text, text, uuid, uuid, text, text, text, integer, text) to service_role;

comment on function public.process_stripe_event(text, text, text, uuid, uuid, text, text, text, integer, text)
is 'Service-role-only, transactional Stripe event reconciliation and entitlement fulfilment.';
