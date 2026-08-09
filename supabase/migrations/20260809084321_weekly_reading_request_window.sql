-- Preserve the ISO Monday bucket for weekly entitlement accounting while
-- recording the reader-facing seven-day window from the day it is requested.
-- The default keeps the preceding application version write-compatible during
-- deployment; the new application always supplies the profile-local date.

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.weekly_readings
  add column reading_start_date date not null default current_date;

update public.weekly_readings
set reading_start_date = week_start_date;

alter table public.weekly_readings
  add column reading_end_date date
  generated always as (reading_start_date + 6) stored;

create index weekly_readings_user_window_idx
  on public.weekly_readings(user_id, reading_start_date desc, created_at desc);

comment on column public.weekly_readings.week_start_date is
  'ISO Monday entitlement bucket; it is not necessarily the reader-facing start date.';
comment on column public.weekly_readings.reading_start_date is
  'Profile-local calendar date on which the seven-day reading was first requested.';
comment on column public.weekly_readings.reading_end_date is
  'Inclusive seventh calendar date in the reader-facing reading window.';
