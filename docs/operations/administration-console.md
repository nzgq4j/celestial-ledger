# Administration console

The private `/admin` console provides role-based user management, generation-model selection, Google integration controls, SEO/GEO defaults, audit history, and journal authoring. The route is marked `noindex` and every mutation verifies the current Supabase user against the server-only `admin_roles` table.

## Roles

- `site_admin`: all console operations, including model and integration configuration.
- `user_admin`: assign roles and suspend or restore user access.
- `content_admin`: edit SEO/GEO defaults and create, edit, publish, or delete journal entries.
- `analyst`: read-only operational visibility.

The additive migration seeds `david@crucibleinsight.com` as `site_admin` when that Auth user exists. Administrative authority is never read from editable user metadata. Privileged tables are service-role only; public clients can select only published journal entries through RLS.

## Configuration

Non-secret values are stored in `site_settings` and changed from the console:

- report and interpretation model IDs;
- reCAPTCHA enablement and public site key;
- GA4 enablement and measurement ID;
- Google Search Console verification token;
- canonical URL, default title/description, and indexing switch;
- organisation description and verified `sameAs` profiles for structured data.

Secrets remain in the deployment secret store. Set `RECAPTCHA_SECRET_KEY` in Vercel before enabling reCAPTCHA. Keep OpenAI and Supabase privileged keys server-only. Changes to administrative settings and access are recorded in `admin_audit_log` without private report content or secrets.

## Journal publishing

Site and content administrators can save drafts or publish entries from the Journal section. Each entry has a stable slug, excerpt, plain-text body, and optional SEO title and description. Published entries appear under `/journal`, in the XML sitemap, and in `llms.txt`; drafts remain service-role only.

## Migration and recovery

`20260804095847_administration_console.sql` is additive: it creates new tables, indexes, policies, grants, seed settings, and the initial role. Before production application, capture a managed database backup and dry-run the migration against the linked project. Verify the seeded role, RLS state, and Supabase security advisors after application.

Forward recovery is preferred: correct an invalid configuration in the console, revoke an incorrect role in `admin_roles`, or add a corrective migration. If application code must be rolled back, the new tables can remain unused safely. Do not drop them during an incident; preserve audit and editorial data until a separately approved retention review.

## Release verification

Run formatting, type checking, lint, unit/integration tests, production build, license review, ephemeris gate, security advisors, and accessibility checks. Confirm `/admin` redirects ordinary members, each role has the expected controls, reCAPTCHA fails closed when enabled without a secret, journal drafts are inaccessible publicly, and published entries have canonical metadata.
