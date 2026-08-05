# Daily reading test plan

## Release gates

Every implementation slice runs format check, typecheck, ESLint, Vitest, production build, production dependency audit, license review, server ephemeris gate, safety evaluations, and accessibility tests. Calculation changes also require new golden fixtures. Database changes require isolated migration/RLS tests and manual approval before production.

## Characterization tests

- Preserve fixed-date output and types for public `dailySkyFor`.
- Preserve natal chart fixture output and existing calculation versions unless deliberately versioned.
- Preserve `detectAspects` current behavior while adding temporal APIs.
- Preserve career/recovery evidence IDs, schemas, locale behavior, worker failure behavior, and stored-report rendering.
- Preserve account session, birth-profile, and report-library behavior.

## Calculation unit tests

- Timestamped positions and speed units.
- Direct/stationary/retrograde thresholds.
- Major aspect normalization across 0°/360°.
- Applying/exact/separating classification from relative motion.
- Exact-aspect root finding and no-root bounds.
- Transit active-window start/end.
- Repeated initial/retrograde/final pass linking.
- Sign ingress time and adjacent-sign boundaries.
- Lunar phase angle/name and phase-boundary time.
- Moon sign and natal-house passages.
- Void-of-course start/end and final aspect under the versioned profile.
- Time-zone/civil-day boundaries, DST transitions, and high latitudes.
- Unknown birth time excludes houses/angles/transit-to-angle evidence.
- Cache key stability and version sensitivity.

Golden fixtures must come from independent authoritative sources or a reviewed reference implementation; tests must not validate the engine against itself.

## Analytical unit tests

- Rule matching requires all declared evidence.
- Rule versions are valid and IDs unique.
- Relevance, intensity, confidence, and convergence are deterministic.
- Context changes priority/order only, never evidence facts or intensity.
- Duplicate evidence does not inflate convergence.
- Supporting, moderating, and contradictory signals remain distinct.
- Recent/present/future states follow calculated timestamps.
- Empty/weak domains are omitted instead of filled.
- Recovery context requires adult confirmation and reviewed themes.

## Content and BLUF tests

- Strict JSON schema rejects extra properties.
- Zod and JSON schemas agree on required/optional fields.
- Every section, application, question, and BLUF block uses existing evidence/signal/theme IDs.
- Every BLUF source section exists.
- BLUF evidence is a subset of cited source-section evidence.
- BLUF source coverage includes material present, application, next-72-hour, and longer-term sections.
- BLUF is 425–575 words and is rendered first.
- Practical priorities are distinct and 3–5 in number.
- A material contradiction requires a BLUF tension block.
- Unknown-time facts never appear in BLUF or body.
- Locale tests cover English, Spanish, French, and German across every reader-facing field.
- Technical IDs, times, degrees, and versions remain invariant across locale.
- Output introducing an unsupported fact/theme/timing is rejected.

## Integration tests

- Owned birth profile to fresh natal evidence.
- Natal evidence plus civil date/time zone to current facts/transits/lunar periods.
- Facts to rules, signals, themes, timeline, and Stage A payload.
- Stage A payload to strict narrative and BLUF validation.
- Canonical create returns the existing active/completed row for identical inputs.
- Version/context/locale change produces the correct new canonical key.
- Completed output and evidence persist atomically.
- Provider timeout/rate limit/malformed JSON/unknown evidence produce sanitized failure state.
- Stale job lease recovers and duplicate completion is rejected.

## Database and migration tests

- Migration applies to an isolated Supabase branch from the current 13-migration production baseline.
- Migration is additive and does not change commercial reports/orders/entitlements.
- New public tables have explicit grants and RLS enabled.
- Owner can select/delete only owned daily rows and evidence.
- Another authenticated user, anon, and expired session cannot read any private row.
- Service functions have `search_path=''`, exact ACLs, and no PUBLIC/anon/authenticated execute.
- UPDATE policies include SELECT plus `USING`/`WITH CHECK` where applicable.
- Canonical uniqueness behaves under concurrent inserts.
- Lease claim uses `SKIP LOCKED`; two workers cannot claim the same row.
- Completed rows/evidence are immutable.
- Birth-profile/account deletion cascades content as designed.
- Expiry cleanup removes content/evidence without exposing payloads in audit logs.
- Supabase security and performance advisors have no unresolved material daily-reading findings.

## Production recovery procedure

The migration is additive: it creates only `public.daily_readings` plus indexes,
policies, grants, comments, and its update trigger. It does not alter existing
birth profiles, reports, orders, products, or entitlements.

If application verification fails after release:

1. Roll the Vercel production alias back to the immediately preceding deployment.
2. Leave `public.daily_readings` in place while investigating; the prior
   application does not reference it, so this is the lowest-risk recovery path.
3. Record the table row count, latest `created_at`, RLS state, policies, and grants.
4. If the table must be removed and contains rows, export those rows through an
   administrator connection before changing the schema.
5. Apply a new reviewed forward migration containing
   `drop table if exists public.daily_readings;`. Dropping the table also removes
   its indexes, trigger, policies, grants, and comments. Do not rewrite or delete
   the applied migration-history record.
6. Re-run the account, public sample, report-library, authentication, RLS, and
   advisor checks after either recovery path.

## API and security tests

- All endpoints require a verified session and owner resource.
- Same-origin is required on mutations.
- UUIDs, dates, locale, time zone, context, and body size are strictly validated.
- User ID, birth data, coordinates, and context are absent from URLs/logs/analytics.
- Private response headers and route metadata enforce no-store/noindex.
- Model/service/Supabase secret keys are absent from client bundles.
- Rate/cost controls prevent unlimited regeneration.
- Prompt payload excludes email, raw birth input, coordinates, and unrelated private data.
- Prompt-injection-like context strings cannot alter the instruction hierarchy; release one avoids unrestricted context text.

## End-to-end tests

- Registered user with one profile generates today's daily reading and focus moves to progress.
- User with multiple profiles selects the intended profile.
- User overrides locale and receives a completely localized reading.
- Active reading survives navigation and later completes.
- Failed reading shows a recoverable state and retry does not duplicate rows.
- Viewer shows BLUF first, then body, evidence, appendix, and limits.
- Print renders all sections without account chrome.
- Delete requires confirmation and removes the reading from the library.
- Unknown birth time produces a useful reduced reading with no houses/angles.
- Cross-account direct URL access returns not found/unauthorized without leaking existence.
- Public horoscopes and commercial report flows remain functional.

## Accessibility

- Keyboard-only request, progress, open, print, retry, and confirmed-delete flows.
- Correct heading order with BLUF as the first `h2` content section.
- Progress uses live status without misleading percentage precision.
- Focus moves to newly created/active reading and remains stable during polling.
- Evidence disclosure and timelines have accessible names and non-color state cues.
- Reduced-motion behavior and responsive layouts.
- Automated accessibility scan plus manual screen-reader smoke test.

## Safety evaluation

- No deterministic event predictions.
- No diagnosis, treatment, medication, legal, or financial advice.
- No shame, blame, inevitability, relapse prediction, or astrology-as-cause claims.
- Recovery inputs remain adults-only reviewed structures.
- Crisis inputs leave astrology and show reviewed region-neutral emergency guidance.
- The narrative keeps astrological authority and vocabulary without inventing calculated authority.

## Current baseline results

At audit commit `60015a2`: typecheck passed, lint passed, 62 tests passed, production build passed after clearing an incompatible inherited `NODE_OPTIONS`, server ephemeris gate passed, licenses passed, and npm production audit reported zero vulnerabilities. Format check has one pre-existing failure in `public/preferences-init.js` that must be resolved before release validation can be green.
