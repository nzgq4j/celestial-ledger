# Weekly astrological reading architecture

## Boundary

The weekly reading is one private, evidence-linked brief for an authenticated Personal or Premium member's primary owned birth profile. Its reader-facing window starts on the profile-local date it is requested and includes that date plus the next six calendar dates. The ISO Monday–Sunday week remains only the entitlement bucket. It is not seven public Sun-sign horoscopes and does not introduce another astronomy engine.

## Flow

```text
Account server component
  -> verified user and server-derived capability decision
  -> primary owned active birth profile
  -> authenticated same-origin POST
  -> profile-local request date, ISO entitlement bucket, and canonical cache key
  -> server-authoritative natal recalculation
  -> seven daily calculation windows through the existing daily engine
  -> week-scoped evidence aggregation and day emphasis map
  -> interpretation-first model prose with practical guidance, bound to deterministic evidence
  -> same-type and rolling seven-day/period-overlap cross-type similarity validation
  -> private one-year persistence
  -> atomic weekly capability consumption after successful persistence
  -> owner-only viewer and PDF
```

## Trust and calculation boundaries

- Birth data is loaded by owner and profile ID on the server and never enters a URL, log, or public metadata.
- `calculateNatalChart` recalculates natal facts. Seven calls to `buildDailyReadingAnalysis` provide bounded daily transit/lunar windows.
- The weekly layer ranks and groups daily evidence; it does not calculate or modify positions, aspects, houses, or timestamps.
- Unknown birth time remains unknown throughout all seven windows, excluding houses, angles, and exact-time claims.
- Evidence IDs, provider/version, calculation version, time zone, zodiac, house system, and node type remain immutable.

## Canonical identity

The SHA-256 key includes owner, primary profile and revision, request date, ISO entitlement week, time zone, locale, weekly analysis/content/method/rule/prompt versions, calculation and ephemeris versions, and context hash. A unique owner/profile/entitlement-week/locale constraint adds concurrency protection.

## Persistence, entitlement, and failure

`weekly_readings` is additive, RLS-protected, owner-readable/deletable, service-role writable, `no-store`, `noindex`, and expires after at most one year. `week_start_date` is the ISO entitlement bucket; `reading_start_date` and `reading_end_date` are the inclusive reader-facing window. The stable capability is `weekly_reading.primary`; Personal and Premium receive one use per ISO week. The app validates and persists first, then consumes usage atomically. A consumption failure removes the inserted row, so unsuccessful generation does not spend the allowance.

`WEEKLY_READING_GENERATION_ENABLED` defaults false. When false, the account shows a release-pending state and the generation API returns unavailable.

## API

- `POST /api/weekly-readings` — create or return the canonical current-week reading.
- `GET /api/weekly-readings` — list owner readings.
- `GET /api/weekly-readings/:id` — retrieve an owner record.
- `DELETE /api/weekly-readings/:id` — delete an owner record.
- `POST /api/weekly-readings/:id/retry` — controlled conflict in synchronous v1.
- `GET /api/weekly-readings/:id/pdf` — native private PDF download.

V1 is synchronous because the deterministic reused pipeline fits the function budget. A future model-backed narrative must extend the shared leased job runner rather than create another queue.
