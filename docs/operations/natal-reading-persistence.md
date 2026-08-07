# Natal reading persistence

Authenticated chart generation stores the server-calculated natal chart and its
generated interpretation together on the owner's `birth_profiles` row. The
reading inherits the profile's one-year expiry, owner-only RLS policies,
deletion path, private cache controls, and `noindex` account presentation.

The stored provenance includes the calculation version already recorded on the
profile plus the interpretation model, prompt version, and generation time.
The browser cannot submit reading text for persistence; the interpretation
route writes only the text returned by the configured model after independently
calculating the chart on the server.

Marketing consent remains purpose-limited. A marketing subscriber record does
not own a chart and contains no birth data or natal reading. An anonymous person
must create or sign in to a verified account before a private reading can be
persisted.

## Production migration gate

Before applying `20260807062951_save_natal_interpretations.sql`:

1. Confirm a current managed Supabase backup is recoverable.
2. Dry-run the migration on an isolated branch or disposable clone.
3. Verify existing birth-profile rows receive null reading fields unchanged.
4. Run security and performance advisors and confirm the existing owner-only
   RLS policies and grants remain unchanged.
5. Obtain manual approval, apply the migration, generate types, then deploy the
   matching application revision.

## Forward recovery

If application persistence fails, revert the application to chart-only saves
while leaving the nullable columns in place. Correct constraints or write
behavior with a forward migration; do not drop or rewrite existing private
readings during an incident. Owner deletion and the existing expiry process
remain the recovery path for stored content.
