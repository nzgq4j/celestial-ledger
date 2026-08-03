create index marketing_subscribers_linked_user_id_idx
on public.marketing_subscribers (linked_user_id)
where linked_user_id is not null;
