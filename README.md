# Celestial Atlas

Astrology, numerology and tarot for personal reflection. Astrology here is a
symbolic tradition, not scientifically validated prediction.

One app serves the website (celestialatlas.app) and Android:

| Part     | Where                      | What it does                                                                                                                                                                    |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App      | `celestial-atlas/`         | Vite, React and Ionic (Material Design). All calculation runs on the device with astronomy-engine; places come from bundled GeoNames data. English, Spanish, French and German. |
| Android  | `celestial-atlas/android/` | Capacitor 8 build of the same app (`com.celestialatlas.app`).                                                                                                                   |
| Server   | `app/api/`, `lib/`         | Next.js route handlers only: Stripe and Google Play billing, account deletion, contact, email-link hand-off, push notifications and the daily retention job.                    |
| Database | `supabase/migrations/`     | Supabase Postgres with owner-only row-level security.                                                                                                                           |

The website build copies the app into `public/`; Next.js serves it and falls
back to `index.html` for every path that is not an API route or a file.

## Privacy and security

- Birth details, journal and settings are stored on the device. Signing in
  syncs the birth profile (`birth_profiles`) and journal
  (`atlas_journal_entries`) to the member's account. Both expire one year after
  they were last saved; `/api/internal/purge-journal` removes expired journal
  entries daily.
- Birth data never appears in URLs, logs or analytics.
- The app authenticates to the server with the member's Supabase access token
  (bearer). Cookie sessions are accepted only from the same origin. CORS is
  granted only to the Capacitor origins, without credentials.
- Private responses are `no-store` and `noindex`. Service-role, Stripe,
  Google Play and cron secrets exist only on the server; a test checks that the
  app source never references them.
- Email links pass their token to the app in the URL fragment, which is never
  sent to a server.

## Calculation and evidence

Every chart, sky, numerology result and card draw produces a sealed
calculation record (engine, version, zodiac, house system, node type, time
zone, UTC, coordinates, calculation version) and evidence entries with
content-hash IDs. Report sections and chart marks reference those IDs.
Translations change only the words a reader sees, never records or evidence,
so IDs are identical in every language. Unknown birth times exclude houses,
angles and time-dependent claims. Golden fixtures in `__tests__/*.json` are
shared with the app's engine tests.

## Membership

Atlas+ is one yearly plan at USD 6.99 with a 3-day free trial. The web sells it
through Stripe Checkout (`/api/app/checkout`, which refuses any other active
price); Android through Google Play (`/api/google-play/verify`). Membership is
read with the `atlas_membership()` database function.

Atlas+ members can keep up to 7 more birth charts (family and friends) in
**Account > Charts** and view any of them on Today, Stars and Numbers. The
database enforces the allowance: 1 saved chart on the free plan, 8 on Atlas+.

## Development

```bash
npm install
npm --prefix celestial-atlas install
npm --prefix celestial-atlas run dev
```

Server routes: `npm run dev` (Next.js) after `npm run build:app`.

## Checks

```bash
npm run verify
```

This runs the server typecheck, lint and tests, the app tests, and the full
build. The app also has `npm --prefix celestial-atlas run lint` and a browser
walkthrough with accessibility checks (`celestial-atlas/e2e/smoke.mjs`).

## Environment

Server: `NEXT_PUBLIC_APP_URL`, Supabase URL and publishable key, Supabase
service-role key, Stripe secret and webhook secret, Google Play service
account and package name, `CRON_SECRET`. Push notifications add
`WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`,
`FIREBASE_SERVICE_ACCOUNT_JSON` and `PUSH_ADMIN_SECRET` (see
`docs/operations/push-notifications.md`). The app build reads only
`VITE_*` and `NEXT_PUBLIC_*` variables.

## Production changes

Database migrations are additive and need a backup, a dry run
(`__tests__/atlas-app-backend-migration.test.ts` applies every migration in
PGlite) and owner approval before they are applied.
