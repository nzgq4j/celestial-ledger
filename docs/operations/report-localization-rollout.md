# Report localization rollout

## Resolution order

Report language is resolved in this order:

1. The per-report selector submitted with the generation request.
2. The authenticated account's `profiles.report_locale` setting.
3. `en-GB` as the server fallback.

The report row stores the resolved locale. Completed output is never silently
retranslated or relabelled as another language.

## Production migration gate

Migration `20260804084858_add_report_locale.sql` is additive. Before applying it:

1. Confirm the latest managed Supabase backup is available.
2. Review the new column constraints and replacement queue-function signatures.
3. Apply the migration during a low-traffic window with manual approval.
4. Verify both new columns, the two service-role-only function grants, and the
   existing profile/report RLS policies before deploying application code.

## Verification

- Save each supported locale on a test account and read it back as that owner.
- Queue a complimentary report with a per-report override.
- Confirm the report row stores the requested locale.
- Confirm another authenticated user cannot read or change that preference or report.
- Confirm the generated prompt names the requested language and preserves evidence IDs.

### Theme-contract correction

Migration `20260807072000_allow_career_report_themes.sql` replaces only the
service-role queue function. Before production application, capture a managed
backup, dry-run it on a disposable branch, and obtain manual approval. Verify
that a career report with one and several selected themes queues successfully,
invalid career or recovery theme IDs roll back the transaction, and recovery
adult-confirmation and birth-profile ownership checks remain enforced.

## Forward recovery

If application generation fails after release, deploy the previous application
commit while leaving the nullable profile column and defaulted report column in
place. Follow with a new forward migration to restore the previous queue-function
signatures if required. Do not drop locale data during incident recovery.
If the theme-contract migration needs correction, leave queued and completed
rows intact and deploy a forward migration that replaces `queue_paid_report`
with the reviewed function body. Do not rewrite stored report theme snapshots.
