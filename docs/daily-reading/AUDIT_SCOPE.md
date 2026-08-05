# Daily reading audit scope

## Objective

Determine the smallest coherent set of changes required to add a private, personalized Daily Astrological Reading for registered Celestial Atlas users. The reading must be calculated server-side from an owned birth profile, preserve immutable evidence and provenance, separate deterministic analysis from narrative generation, and begin with a structured **Bottom Line Up Front** summary of approximately 500 words.

This pass is an audit and implementation plan only. It does not authorize production code, database migrations, or deployment.

## Repository baseline

- Audit date: 2026-08-05 (Europe/London)
- Branch: `main`
- Commit: `60015a21cf10044943a0832c40a423af070e4f3a`
- Remote state: `main`, `origin/main`, and `origin/HEAD` point to the same commit.
- Framework: Next.js 16.2.12 App Router, React 19.2.8, TypeScript 5.9.3.
- Runtime contract: Node 22.x in `package.json`; the audit host ran Node 24.17.0 and should not be treated as proof of the production Node 22 runtime.
- Data and identity: Supabase Auth and Postgres through `@supabase/ssr` 0.12.4 and `@supabase/supabase-js` 2.111.0.
- Calculation engine: `astronomy-engine` 2.1.19 plus Celestial Atlas-owned tropical zodiac, mean node, angle, equal-house, aspect, and historical-time logic.
- Narrative provider: OpenAI Responses API through `openai` 5.23.2.

## Protected pre-existing work

The following changes existed before this audit and are outside the audit-document change set:

- `app/api/internal/report-worker/route.ts`: local OpenAI timeout and retry controls.
- `app/api/reports/[id]/route.ts`: local maximum-duration change.
- `supabase/migrations/20260804204500_recover_stale_report_jobs.sql`: untracked stale-job recovery migration.
- `tsconfig.tsbuildinfo`: modified generated build cache.

They were inspected only to understand the working tree and were not edited, staged, reverted, or treated as completed daily-reading work.

## Live database baseline

- Supabase project: `celestial-atlas` (`jyguyvpbstskpuwqwrok`), eu-west-2, Postgres 17.6.
- Live migration history contains 13 migrations, from `initial_celestial_atlas_backend` through `administration_indexes`.
- The local stale-report recovery migration is not present in the live migration history.
- Live tables relevant to this audit: `profiles`, `birth_profiles`, `reports`, `report_evidence`, `products`, `orders`, `entitlements`, and `audit_events`.
- All relevant public tables have RLS enabled. Owner policies exist for birth profiles, reports, evidence, profiles, orders, and entitlements.
- No live `daily_readings`, `daily_contexts`, interpretation-rule, signal, theme, transit, or celestial-calculation table exists.
- Supabase security advisors report one warning unrelated to the proposed daily-reading design: leaked-password protection is disabled. Four server-only/RLS-deny tables are reported as having no policies at informational severity.

## Baseline commands and results

| Check                                  | Result                              | Notes                                                                                                                                                                       |
| -------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                 | Failed                              | Pre-existing Prettier finding in `public/preferences-init.js`. The initial `npm` invocation was also blocked by PowerShell execution policy; `npm.cmd` was used thereafter. |
| `npx tsc --noEmit --incremental false` | Passed                              | Incremental output was disabled to preserve the existing build cache.                                                                                                       |
| `npm run lint`                         | Passed                              | ESLint, zero warnings.                                                                                                                                                      |
| `npm test`                             | Passed                              | 12 files, 62 tests.                                                                                                                                                         |
| `npm run build`                        | Passed after environment correction | The inherited `NODE_OPTIONS=--use-system-ca` is invalid for a Next.js worker. Clearing it for the command produced a successful 38-route build.                             |
| `npm run test:ephemeris-server`        | Passed                              | Server ephemeris gate passed.                                                                                                                                               |
| `npm run licenses`                     | Passed                              | 70 production packages reviewed.                                                                                                                                            |
| `npm audit --omit=dev`                 | Passed                              | Zero reported vulnerabilities.                                                                                                                                              |

## Included areas

- Registered-user account and birth-profile flows.
- Natal and current-sky calculation code.
- Public daily horoscope code where it may provide reusable calculation or presentation patterns.
- Private report schemas, evidence, workers, APIs, persistence, localization, and viewers.
- Supabase schema, functions, RLS, grants, and live migration state.
- Model-selection settings, scheduled jobs, caching, observability, and tests.
- Proposed registered-user daily-reading experience and content contract.

## Excluded areas

- Implementing or enabling paid daily readings.
- Stripe catalog or entitlement changes.
- The unrelated career/recovery worker recovery changes already present locally.
- A professional JPL ephemeris, new house systems, sidereal systems, minor bodies, or advanced annual techniques.
- Production database changes, backfills, or deletion.
- Calendar-provider integrations and free-text recovery narratives.

## Constraints

- The language model must never calculate or alter astronomical facts.
- Browser chart payloads are untrusted; registered readings must recalculate from owned server data.
- Birth data must not enter URLs, logs, analytics, public metadata, or model telemetry.
- Private readings require owner authorization, `private, no-store`, `noindex`, deletion, and a maximum one-year retention period.
- Unknown birth times exclude houses, angles, and exact-time claims.
- Every material interpretive claim must link to immutable evidence IDs.
- Recovery context is adults-only and limited to reviewed structured themes.
- Production schema work requires backup, dry-run validation, manual approval, additive migrations, and a forward recovery plan.

## Assumptions requiring product confirmation

1. The first daily-reading release is included for registered users and is not a paid report product.
2. A user selects a saved birth profile when more than one exists; no default profile exists today.
3. The saved profile's time zone is the default reading time zone. A current-location override, if offered, is explicit and private.
4. One reading is canonical per user, birth profile, civil date, locale, method version, and observation time zone.
5. The user may regenerate only when evidence, locale, method version, or approved context changes; regeneration is not an unlimited model-call endpoint.
6. Approximately 500 words for the Bottom Line Up Front means a validated target range of 425–575 words across supported European-language locales.
