create unique index orders_one_pending_per_report_idx
on public.orders(user_id, report_type)
where status = 'pending';

comment on index public.orders_one_pending_per_report_idx
is 'Prevents concurrent Checkout requests from creating multiple pending orders for the same user and report type.';
