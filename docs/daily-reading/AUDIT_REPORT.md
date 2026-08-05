# Daily reading pre-implementation audit report

## Existing architecture

- Next.js 16 App Router with React 19, strict TypeScript, Tailwind/PostCSS styling, server and client components, and route handlers.
- Supabase SSR Auth provides cookie sessions; RLS and server ownership queries protect private rows.
- Astronomy Engine 2.1.19 plus Celestial Atlas-owned deterministic code supplies tropical natal positions, mean North Node, angles, equal houses, major aspects, historical time conversion, validation, and provenance.
- Public daily horoscopes calculate a noon-UTC sky and apply localized Sun-sign templates; they are not natal-personalized.
- Career/recovery reports recalculate natal evidence server-side, use immutable evidence IDs, call OpenAI strict JSON output, validate with Zod/evidence/safety checks, and persist privately through a Supabase queue.
- Vitest provides 62 unit/integration tests; there is no browser E2E or automated accessibility suite.

## Existing capabilities to retain

- Historical birth-time resolution and unknown-time rules.
- Astronomy Engine adapter, validated natal chart, equal houses, angles, and current snapshot aspect behavior.
- Supabase Auth, owner RLS patterns, private response headers, same-origin checks, and bounded JSON reads.
- Raw birth-profile storage and server recalculation.
- Public daily Sun-sign product as a separate experience.
- Career/recovery report schemas and commercial entitlement lifecycle.
- Account/report locale preference and translation registry.
- Existing account and private report visual patterns.

Validation evidence: typecheck, lint, 62 tests, production build, server ephemeris gate, license review, and production dependency audit pass at the audited commit. Format check has one pre-existing public JavaScript finding.

## Existing capabilities to augment

- Timestamped positions with explicit speed/motion/provenance.
- Aspect calculation with applying/exact/separating state, active windows, exactness, and strength.
- Shared provenance-aware current-position creation.
- Locale preference as the daily default and immutable reading snapshot.
- Privacy-safe job observability and audit events.

## Components to refactor or consolidate

- Extract generic evidence primitives from career-named types while keeping compatibility adapters.
- Extract queue/provider/strict-output orchestration from the report route module before adding daily volume.
- Deprecate direct service imports from route-handler modules after all consumers migrate.

## Components proposed for replacement

None. The audit found no active component whose responsibility is so unsound that replacement is safer than reuse, augmentation, or refactoring.

## Components proposed for deprecation or deletion

- Deprecation only: direct importing of `app/api/internal/report-worker/route.ts` as a service, after a server-only job module exists.
- Deletion: none.

## Missing capabilities to add

- Current/event-window calculation, lunar sequencing, transits to natal placements/angles, stations, ingresses, exactness, and repeated passes.
- Versioned interpretation rules, signals, scoring, theme convergence, contradictions, and temporal classification.
- Bounded structured daily context.
- Deterministic DailyReadingAnalysis and immutable daily evidence.
- Strict localized DailyReadingContent with technical appendix and limits.
- A structured 425–575-word Bottom Line Up Front as the first report section.
- Owner-scoped daily persistence, idempotent cache key, leased queue, APIs, account UI, viewer, print, delete, and monitoring.

## Deferred capabilities

- Annual techniques, current angles/current-house ingress, calendar integrations, unrestricted journal text, professional ephemeris expansion, new bodies, new house systems, and database-authored rule editing.

## Recommended implementation order

1. Characterize current behavior.
2. Define the daily domain and runtime schemas.
3. Add and fixture time-window calculations.
4. Add transit/lunar evidence.
5. Add reviewed rules and deterministic synthesis.
6. Add Stage A and the BLUF-enhanced content contract.
7. Refactor reusable job/provider primitives.
8. Add private persistence in an approved isolated migration workflow.
9. Add worker, APIs, account controls, and viewer behind a disabled flag.
10. Run all release gates, controlled cohort validation, and operational monitoring.

## Audit conclusion

Celestial Atlas has a strong natal/evidence/private-report foundation but no registered-user daily-reading engine. The smallest coherent solution is not a larger public horoscope and not another commercial report type. It is a separate private daily lifecycle that reuses server calculation, evidence, auth, locale, and validated narrative primitives while adding the missing temporal calculation and deterministic synthesis layers. Implementation should begin only after this report and the plan are approved.
