# Registered-user daily reading architecture

## Architectural boundary

The registered-user Daily Astrological Reading is a private natal-transit intelligence brief. It is not the public twelve-sign horoscope, a natal-chart interpretation, or an entitlement-backed career/recovery report. It reuses their proven primitives while preserving separate product and data lifecycles.

## Target flow

```text
Private account UI
  -> verified Supabase user
  -> select owned birth profile, civil date, time zone, locale, structured context
  -> authenticated daily-reading API
  -> canonical request/cache key
  -> load owned raw birth profile
  -> server-authoritative natal recalculation
  -> current-sky/event-window calculation
  -> transit-to-natal and lunar analysis
  -> immutable evidence bundle
  -> versioned rule matching
  -> deterministic signals, themes, contradictions, temporal map
  -> persist Stage A analysis
  -> queued controlled narrative generation
  -> strict JSON + Zod + evidence + temporal + BLUF validation
  -> completed owner-scoped reading and evidence
  -> private viewer with BLUF first
```

## Responsibility boundaries

### Calculation

- Uses only the pinned Astronomy Engine adapter and Celestial Atlas-owned deterministic functions.
- Produces facts with explicit units, UTC timestamps, observation time zone, method versions, and uncertainty.
- Recalculates the natal chart from the authenticated user's owned raw birth-profile row.
- Never accepts browser-calculated placements or model-proposed facts.
- Performs bounded searches for exact aspects, ingresses, stations, lunar periods, and repeated passes.

### Analytical interpretation

- Matches calculated facts to explicit, reviewable, versioned rules.
- Creates signals, relevance/intensity scores, life-domain mappings, temporal states, applications, risks, and limits.
- Groups converging signals and records contradictions and moderating factors.
- Produces identical Stage A JSON for identical facts, rule versions, method profiles, and context.
- User context can reorder/emphasize signals but cannot change astronomy, aspect state, or evidence.

### Narrative generation

- Receives only the Stage A analytical payload, bounded display metadata, locale instruction, and immutable evidence IDs.
- Uses strict structured output and `store: false`.
- Does not receive a request to calculate astronomy, infer life events, or manufacture missing sections.
- Is validated as untrusted output before persistence or display.
- Produces a structured 425–575-word Bottom Line Up Front that summarizes the validated body sections and appears first.

### Persistence

- Uses new additive daily-reading storage rather than altering commercial report entitlements.
- Enforces ownership with RLS and again in server queries.
- Uses a unique canonical key to prevent duplicate model calls.
- Stores evidence, analysis, output, all method/schema/rule/model versions, status, attempts, lease timestamps, locale, time zone, completion, and expiry.
- Supports owner deletion and a maximum one-year expiry.

### Presentation

- Runs inside the established private account visual system.
- Defaults to account report locale and an explicit saved birth profile.
- Shows progress while preserving a recoverable failed state.
- Renders only content that passes the stored schema version.
- Places Bottom Line Up Front immediately after the report header and before themes, timelines, domains, or appendices.
- Provides evidence inspection, print, and confirmed delete.

## Proposed modules

Conceptual names define responsibilities; implementation should combine them when that improves cohesion.

```text
lib/daily-readings/
  domain.ts              canonical types and enums
  schemas.ts             request, analysis, content validation
  method.ts              versioned calculation/orb/VOC profiles
  calculation.ts         current positions and bounded celestial events
  transits.ts            transit-to-natal windows and repeated passes
  lunar.ts               phase, sign/house passages, VOC/final aspect
  evidence.ts            immutable facts and IDs
  rules/                 reviewed, versioned interpretation rules
  synthesis.ts           signals, scores, themes, contradictions
  context.ts             bounded structured context
  analysis.ts            Stage A payload orchestration
  content.ts             narrative schema and BLUF cross-validation
  generation.ts          controlled Stage B orchestration

lib/narrative/
  provider.ts            server-only OpenAI strict-output adapter

lib/jobs/
  runner.ts              claim/lease/timeout/failure orchestration
```

Do not create each conceptual name as a separate service class. Prefer pure functions and cohesive modules.

## API outline

All responses use `Cache-Control: private, no-store, max-age=0` and `X-Robots-Tag: noindex, nofollow, noarchive`.

```text
POST   /api/daily-readings            create or return canonical reading
GET    /api/daily-readings            list the owner's recent readings
GET    /api/daily-readings/:id        get owner summary or full typed record
POST   /api/daily-readings/:id/retry  retry an eligible failed reading
DELETE /api/daily-readings/:id        delete an owned reading
POST   /api/internal/reading-worker   cron-secret worker dispatch
```

Mutation routes require verified authentication, same-origin validation, strict body limits, and ownership. Birth data, coordinates, and context never appear in URLs.

## Queue and concurrency

- Claim one eligible row using `FOR UPDATE SKIP LOCKED` and a lease timestamp.
- Increment attempts atomically and persist the active stage.
- A stale lease becomes eligible for controlled recovery; it never remains `generating` indefinitely.
- Completion is compare-and-set and idempotent; duplicate workers cannot overwrite a completed reading.
- Retryability is based on a bounded failure taxonomy, not raw provider messages.
- The cron dispatcher must fairly service commercial and daily queues within the Vercel time budget.
- Provider timeout must end before the function timeout, leaving enough time to persist failure state.

## Caching and idempotency

The canonical key includes:

```text
user_id
birth_profile_id
civil_date
observation_time_zone
observation_location_version (when used)
locale
context_hash
calculation_version
ephemeris_version
method_profile_version
rule_version
analysis_schema_version
content_schema_version
prompt_version
```

A completed matching record is returned. An active matching record is reused. A failed matching record follows retry policy. A version or approved input change creates a new canonical key while preserving the old private reading until expiry/deletion.

## Trust and privacy boundaries

- Browser: untrusted request fields and presentation only.
- Next.js server: authentication, validation, calculation orchestration, owner checks, and private response controls.
- Supabase: private raw birth facts, RLS, canonical rows, evidence, lifecycle RPCs.
- OpenAI: constrained narrative boundary; no secrets, email, coordinates, raw birth data, or unsupported facts.
- Analytics: page-level operational events only; never IDs that can be joined to birth or reading content.
- Logs: event type, stage, report kind, versions, duration, and sanitized failure code only.

## Failure behavior

- Invalid/expired/unowned profile: reject before calculation.
- Calculation or validation failure: persist a sanitized non-retryable failure where appropriate.
- Provider timeout/rate limit/transient failure: persist a retryable failure and scheduled backoff.
- Narrative evidence/BLUF/schema failure: discard output, optionally perform one bounded fresh draft, then fail safely.
- Worker interruption: lease recovery returns the row to an eligible state.
- UI polling failure: retain current status and offer a refresh; never imply completion.
- Unsupported exact birth time: exclude dependent facts rather than substituting generic claims.
