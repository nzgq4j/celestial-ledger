# Weekly reading request-window forward recovery

Migration `20260809075936_weekly_reading_request_window.sql` is additive. The
preceding application version ignores the new columns and remains
write-compatible because `reading_start_date` has a database default.

If the release needs to be reversed:

1. Disable weekly-reading generation with the existing production flag.
2. Redeploy the preceding application version. Do not remove the additive
   columns while either application version may still be running.
3. Identify affected rows by `reading_start_date`, retain their owner and
   expiry controls, and regenerate only those rows after deploying a corrective
   application version.
4. Re-enable generation after verifying one owner-authorized reading whose
   request date and inclusive end date span exactly seven profile-local
   calendar dates.

Use the managed database point-in-time backup for recovery. Do not copy private
report payloads into an unmanaged recovery table, because copies would bypass
the report's deletion and one-year expiry controls.
