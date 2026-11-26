-- Atlas+ keeps the member's own chart plus up to 7 more (8 saved charts).
-- The allowance is enforced by private.enforce_saved_chart_allowance() on insert.
-- Free stays at 1. Forward recovery: set the allowance back to 5 with the same
-- statement; charts saved above a lowered allowance are kept (only inserts are checked).
update public.plan_capabilities
set allowance = 8
where plan_key = 'premium'
  and capability_key = 'birth_profiles.saved';
