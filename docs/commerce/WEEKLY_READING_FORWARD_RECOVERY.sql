-- Forward recovery for 20260808074522_weekly_readings_entitlement.sql.
-- Use only after diagnosing the failed migration and preserving any generated rows.

create table if not exists public.weekly_readings_recovery
(like public.weekly_readings including all);

insert into public.weekly_readings_recovery
select * from public.weekly_readings
on conflict do nothing;

-- If application rollback is required, leave the table and capability rows in place,
-- set WEEKLY_READING_GENERATION_ENABLED=false, and deploy the preceding application
-- version. Additive schema is intentionally retained until a separately approved
-- cleanup window.
