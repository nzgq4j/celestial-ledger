# Celestial Clock validation — 2026-09-15

## Completed

- TypeScript, ESLint and repository formatting checks passed.
- Full Vitest suite: 62 files, 338 tests passed, including 25 new clock checks. Existing recovery/safety and security suites passed.
- Explanatory tooltips: pointer highlighting, evidence association, keyboard focus, Escape dismissal, moving into the tooltip, tap activation and calculation-change dismissal passed interaction tests. Browser review confirmed planetary track highlighting and readable tooltip placement on desktop and a 390-pixel viewport.
- Optimized Next.js production build passed with `/clock`, `/api/clock` and `/api/clock/space-weather` present.
- Server ephemeris gate passed. Lunar/season event fixtures also match independently retrieved USNO references within two minutes.
- Production license inventory passed; no packages or lockfile changes were introduced. Astronomy Engine's existing MIT notice remains preserved.
- Browser: desktop and 390-pixel mobile viewport; no horizontal page overflow. Date exploration successfully displayed 29 February 2024 at 12:00 UTC. Event buttons, hemisphere selection, zoom, keyboard activation of zoom and return to live time were exercised.
- Real NOAA responses loaded through the application's server endpoint. Missing historical coverage is explicitly described, and old/invalid/failed responses are covered by adapter tests.
- SVG layout coordinates are rounded for rendering only, preventing insignificant server/browser floating-point differences from causing hydration warnings. Astronomical values remain unchanged.

## Environment

Local verification used Node 24.17.0; deployment configuration requests Node 22.x. The first build attempt was blocked by an inherited `NODE_OPTIONS=--use-system-ca` worker incompatibility; the build passed after removing that option only from the build process environment. No project configuration was changed to work around it.

Browser review used the site's existing demo mode because local public account-service configuration was unavailable. Saved environment files and production databases were not changed. The feature itself needs no account service or location data; the existing shared site shell retains its deployment configuration requirements.

## Release blocker: existing dependency advisories

Production audit: **3 affected packages, 1 critical and 2 high** (Next.js, Nodemailer and Sharp). Full audit including development tools: **20 affected packages, 1 critical, 17 high and 2 moderate**. The production audit reported no available fix for its installed dependency graph. These findings predate the clock's dependency changes (there are none); this does not constitute risk acceptance.

Representative advisories returned by the audit:

- Next.js: <https://github.com/advisories/GHSA-p293-qw3h-jr36>, <https://github.com/advisories/GHSA-2xp9-vwfh-vxw4>
- Nodemailer: <https://github.com/advisories/GHSA-8m3c-c648-2xjj>, <https://github.com/advisories/GHSA-wmmp-3585-3rmp>, <https://github.com/advisories/GHSA-2x7j-588g-ccc2>, <https://github.com/advisories/GHSA-cc9r-2j5m-2m83>
- Sharp: <https://github.com/advisories/GHSA-rgj7-g3m4-5g8c>

The existing dependency-advisory release gate remains blocked. Resolve or separately review the findings under the project's release process before production deployment. This change has not been deployed.
