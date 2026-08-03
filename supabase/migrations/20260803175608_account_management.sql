alter table public.profiles
add column display_name text
check (display_name is null or char_length(display_name) between 2 and 50);

alter table public.orders drop constraint orders_user_id_fkey;
alter table public.orders alter column user_id drop not null;
alter table public.orders
add constraint orders_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table public.entitlements drop constraint entitlements_user_id_fkey;
alter table public.entitlements alter column user_id drop not null;
alter table public.entitlements
add constraint entitlements_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

comment on column public.profiles.display_name is
  'Optional user-selected account name. Never used for authorization.';
comment on column public.orders.user_id is
  'Set to null when an account is deleted so minimized payment records can be retained.';
comment on column public.entitlements.user_id is
  'Set to null when an account is deleted; the entitlement is no longer user-accessible.';
