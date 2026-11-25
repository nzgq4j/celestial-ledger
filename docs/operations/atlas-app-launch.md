# Celestial Atlas app launch runbook

Every step that changes production needs the owner's approval first.

## 1. Preview review

- The branch preview runs in demo mode (no sign-in, no payment).
- Review every screen in English, Spanish, French and German. Check that legacy
  addresses redirect.

## 2. Database (backup, dry run, approval)

1. Take a backup of the production project, or confirm point-in-time recovery.
2. Dry run: `npx vitest run __tests__/atlas-app-backend-migration.test.ts`
   applies every migration to PGlite and tests RLS, expiry and limits.
3. Apply `supabase/migrations/20261125090000_atlas_app_backend.sql`. The
   migration is additive: new columns, a new table and new functions. The
   new USD 6.99 price row is inserted inactive.
4. **Forward recovery:** the app tolerates a missing journal table (entries
   stay on the device). If the migration fails part-way, fix it and re-run;
   do not drop tables.

## 3. Stripe

1. Create the Atlas+ yearly price: USD 6.99, recurring yearly, on the
   existing Atlas product.
2. Set its ID on the catalog_version 2 row in `commerce_plan_prices`, then mark
   that row active. `/api/app/checkout` refuses any other price.
3. Deactivate the legacy monthly ($12.99) and yearly ($99) rows for new
   sales. The webhook still maps their existing subscriptions to Atlas+.
4. Existing subscribers move to $6.99/year at renewal:
   - Dry run:
     `node scripts/migrate-atlas-subscribers.mjs`
     with `STRIPE_SECRET_KEY`, `ATLAS_APP_PRICE_ID` and
     `ATLAS_LEGACY_PRICE_IDS` set.
   - Then the same command with `--apply`, after approval.
   - Send a short notice to affected members first. The change lowers
     their price.

## 4. Supabase Auth

- Email: follow `docs/operations/email-setup.md` (custom SMTP sender, URL
  configuration, and the branded templates with the 6-digit code the app uses).
- Add `https://celestialatlas.app/profile` and `/today` to the allowed redirect
  URLs.

## 5. Vercel

- Set `CRON_SECRET` if it is not set already. The only cron is
  `/api/internal/purge-journal`, which runs daily.
- Merge to `main`. The production deployment then serves the app.

## 6. Android

- Build with `-PversionCode=N`, where N is above the last version uploaded for
  `com.celestialatlas.app`.
- Connect Google Play Billing in `celestial-atlas/src/platform/billing.ts`
  before release; until then the Android build uses the demo service.
