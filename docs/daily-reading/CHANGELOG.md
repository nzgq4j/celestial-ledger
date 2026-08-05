# Daily reading changelog

## 2026-08-05 — Registered-user foundation implementation

- Added the first server-authoritative daily calculation slice: current planetary positions, motion, lunar phase, transit-to-natal major aspects, applying/exact/separating state, strength, provenance and unknown-time exclusions.
- Added strict runtime schemas for analysis, evidence, signals, themes, BLUF-first content, API input and stored output.
- Added deterministic rule-based synthesis and a 425–575-word Bottom Line Up Front contract for the English foundation output.
- Added the `registered_daily_reading` capability derived from an authenticated account and an active owned birth profile; it does not consume a paid-report entitlement and remains separate from future account tiers.
- Authored, but did not apply, an additive `daily_readings` Supabase migration with one-year expiry, owner-only RLS, service-only writes and reproducible cache uniqueness.
- Added authenticated create/list/get/delete endpoints, an account generator and history, a private evidence-linked viewer with print and confirmed deletion, and a public sample generated through the same schemas.
- Added focused tests for time-zone resolution, deterministic output, evidence links, temporal state, unknown-time suppression, BLUF length, cache invalidation and entitlement enforcement.
- Recorded exact-event search, full narrative localization, lunar sequencing, repeated passes, advanced visualization and production database validation as remaining work; no production migration was applied.

## 2026-08-05 — Audit and implementation plan

- Recorded repository, command, route, and live Supabase baselines.
- Protected four pre-existing local changes from the audit change set.
- Inventoried current architecture, natal calculations, public daily horoscopes, private report evidence/generation, account localization, persistence, and operations.
- Confirmed that no registered-user daily transit reading, daily context, deterministic rule/signal/theme engine, or daily persistence exists.
- Classified existing components using retain/augment/refactor/consolidate/deprecate/add/defer decisions.
- Preserved the public Sun-sign horoscope and commercial entitlement-backed report boundaries.
- Defined the target server-authoritative calculation, deterministic Stage A analysis, controlled Stage B narrative, owner-scoped persistence, and private account/viewer architecture.
- Added the registered daily reading content contract.
- Added the required first-position **Bottom Line Up Front**: structured, localized, evidence-linked, cross-referenced to body sections, and targeted at 425–575 words.
- Added calculation, analysis, schema, migration/RLS, API, E2E, localization, accessibility, and safety test plans.
- No production code, database object, package, API route, or UI component was changed.
- Added a deferred user account-level and capability-entitlement epic, explicitly separated from administrative RBAC and current report-specific entitlements.
- Added a deferred evidence-linked data-visualization epic covering transit, lunar, temporal, theme, domain, and opportunity/risk views with accessibility and deterministic-data requirements.
