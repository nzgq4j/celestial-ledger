# Daily reading dependency map

## Current runtime flows

### Saved natal chart

```text
HoroscopeApp
  -> /api/geocode
  -> /api/chart
     -> chartRequestSchema
     -> calculateNatalChart
        -> localBirthTimeToUtc
        -> astronomy-engine + Celestial Atlas astronomy helpers
        -> equal houses
        -> detectAspects
        -> validateChart
  -> /api/birth-profiles (authenticated save)
     -> recalculateNatalChart
     -> birth_profiles (owner RLS)
```

### Public daily horoscope

```text
/horoscopes and /horoscopes/[sign]
  -> getServerTranslationPack (locale cookie)
  -> dailySkyFor(date, locale)
     -> geocentricLongitude + longitudeSpeed
     -> detectAspects
     -> hard-coded localized topic/copy functions
  -> public, unpersisted Sun-sign output
```

### Private career/recovery report

```text
Account GenerateReportButton
  -> POST /api/reports
     -> verified session + same-origin + strict JSON
     -> owner birth-profile and entitlement/complimentary RPC
     -> reports row (queued)
     -> immediate after() worker attempt
        -> runNextReportJob
           -> service-only claim_report_job RPC
           -> owned birth-profile raw fields
           -> calculateNatalChart
           -> product evidence builder
           -> configured report model
           -> OpenAI strict JSON schema
           -> Zod + evidence/safety validation
           -> complete_report_job RPC
              -> immutable output + report_evidence + audit event + expiry
  -> AccountReportList polls /api/reports/[id]?summary=1
  -> /reports/[id] owner read + schema validation + evidence viewer
```

## Candidate daily-reading dependency graph

```text
Authenticated account UI
  -> daily-reading request schema
  -> verified user + owner-scoped birth profile
  -> server natal recalculation
  -> current-sky and event-window calculator
  -> transit-to-natal calculator
  -> lunar sequence calculator
  -> immutable daily evidence bundle
  -> versioned interpretation rules
  -> deterministic signals, scores, themes, contradictions, timeline
  -> persisted Stage A analytical payload
  -> shared narrative provider adapter
  -> strict DailyReadingContent schema
  -> BLUF and cross-section validators
  -> owner-scoped completed daily reading
  -> private viewer, evidence map, print, delete
```

## Dependency and consumer register

| Candidate                       | Direct consumers                                               | Indirect/runtime consumers                         | External/config dependencies                     | Change risk                                                                                                   |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `lib/types.ts` natal structures | Chart, validation, wheel, reports, tests                       | Saved chart JSON and old completed report evidence | None                                             | High. Prefer adapters or backward-compatible augmentation.                                                    |
| `lib/astronomy.ts`              | Natal chart, public daily horoscope, fixtures                  | All chart/report flows                             | `astronomy-engine` 2.1.19                        | High domain impact; every new search/root routine needs fixtures.                                             |
| `lib/aspects.ts`                | Natal chart, public horoscope, tests                           | Evidence labels and model claims                   | Orb constants                                    | High if existing return shape changes. Add temporal APIs alongside current snapshot behavior first.           |
| `lib/chart.ts`                  | Chart/profile/interpret APIs, samples, private report evidence | Account charts and report generation               | Time, astronomy, houses, aspects                 | High. Retain current public contract.                                                                         |
| `lib/horoscopes/daily.ts`       | Two public pages and tests                                     | Sitemap sign list                                  | I18n and astrology helpers                       | Medium. Do not couple private daily schema to public copy.                                                    |
| Career/recovery evidence types  | Product prompts, worker, viewer, tests                         | Stored report evidence expiring up to one year     | Zod/OpenAI/Supabase                              | High compatibility risk. Extract shared types with adapters; never reinterpret stored schema versions.        |
| Report worker route             | Report POST/retry/page `after()` calls, Vercel cron            | User progress polling                              | OpenAI, service-role, CRON_SECRET, model setting | High. Route imports are used as an internal service; refactor behind a module before adding another job kind. |
| `public.reports` and RPCs       | Report APIs, account, viewer, worker                           | Stripe entitlement state and audit events          | RLS, grants, service role                        | Critical commercial boundary. Retain unchanged for daily release.                                             |
| `public.birth_profiles`         | Account, profile APIs, report worker                           | Cascade deletion of reports                        | Auth users and RLS                               | Critical private source. Daily reads must check owner and expiry.                                             |
| `profiles.report_locale`        | Account setting and report default                             | Generated report language                          | I18n registry                                    | Low. Reuse as the default daily narrative locale unless product chooses a separate preference.                |
| Admin `ai.models`               | Report and natal interpretation                                | OpenAI request cost/behavior                       | Site settings                                    | Medium. Schema and UI must be compatible if a daily model key is added.                                       |
| Account dashboard               | Account server query and multiple client components            | Locale provider, private APIs                      | Supabase SSR                                     | Medium UI impact. Add a separate daily panel/route rather than increasing report-product coupling.            |
| `vercel.json` cron              | Report worker                                                  | Queue recovery                                     | Vercel Cron and CRON_SECRET                      | High operational impact. Fair claiming and time budgets are required before adding daily volume.              |

## Database relationships relevant to daily reads

```text
auth.users
  1 -> 1 profiles
  1 -> N birth_profiles
  1 -> N reports -> 1 report_evidence
  1 -> N daily_readings (proposed)

birth_profiles
  1 -> N reports (existing, cascade delete)
  1 -> N daily_readings (proposed, cascade delete)

reports
  1 -> 1 entitlements -> 1 orders -> 1 products

daily_readings (proposed)
  no product, order, entitlement, or Stripe dependency
  1 -> 1 daily_reading_evidence
  0..1 -> 1 daily_context snapshot or embedded context
```

## Dynamic/configuration-driven references checked

- App Router filesystem routes are confirmed by the successful production build.
- The report worker is invoked by direct import from three request/page paths and by Vercel Cron; lack of a conventional service import would otherwise make it appear route-only.
- Queue behavior is also invoked through Supabase RPC names (`claim_report_job`, `queue_*`, `complete_report_job`, `fail_report_job`).
- The public daily horoscope is indirectly consumed by `app/sitemap.ts` through `zodiacSlugs`.
- Locale packs are dynamically imported through `localeRegistry`.
- Admin model IDs are configuration-driven through `site_settings` and environment fallbacks.
- No Edge Functions, materialized views, database views, Supabase Realtime subscription, external calendar integration, or daily-reading feature flag exists.

## Deletion impact conclusion

No deletion is justified in the audit phase. The public horoscope, natal interpretation, commercial report pipeline, and cached birth-profile chart each serve active flows. Potential consolidation of evidence primitives and worker orchestration must first add compatibility tests and migrate every current consumer. The only deprecation candidate is direct importing of route-handler modules as services, and removal is deferred until a service module exists and all callers migrate.
