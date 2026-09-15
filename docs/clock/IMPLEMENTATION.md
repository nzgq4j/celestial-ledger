# Celestial Clock

## Scope

Public `/clock` page, homepage invitation, desktop/mobile navigation and sitemap entry. No account, birth data, geolocation, paid-report flow, database migration or new runtime package is needed. No deployment is included in this change.

The first release includes UTC hours/minutes/seconds, weekday, day, month, lunar quarter events, equinoxes/solstices, northern/southern season labels, ten planetary longitudes and retrograde indicators. Visitors can explore 2000–2050 with a date/time input and a year slider, return to now, zoom, select evidence, read equivalent text lists, and download the astronomical calculation record. Optional NOAA Kp and solar-wind observations have separate seven-day rings.

Personal natal overlays, location-based sunrise/sunset, eclipses, exact station/ingress searches, automatic playback, image export and further external catalogs are future extensions. No unverified dates or placeholder feed observations are plotted. The homepage ring illustration is explicitly decorative and has no astronomical meaning.

## Design and rendering

An original SVG instrument follows Celestial Atlas's existing visual language: navy #081421, ivory #f2ead8, gold #c9a75d, cyan #88c6d4 and violet #b3a3d8. Georgia supplies the display type; the existing site sans-serif supplies controls. A large dial sits left of a detail panel on desktop; the same information stacks vertically on mobile. The dial is the focal point; surrounding controls remain quiet.

SVG was chosen over the reference's Canvas renderer because this release has a bounded number of marks and benefits from native labelled links, scalable text and inspectable evidence attributes. No 3D package is required. The reference's scripts, artwork and astronomy approximations were not incorporated into application code.

The implementation separates three scales:

- Calendar: actual UTC duration of the selected year, including leap days, January at twelve o'clock.
- Planetary longitude: equal tropical 30-degree signs, Aries zero at twelve o'clock; each planet has its own radial track to reduce overlap. Radial distance is not physical distance.
- NOAA: the seven days ending at the displayed time, with clockwise chronology. Only available observations are drawn. This is not an annual archive.

The season band uses calculated equinox/solstice boundaries. Its northern seasonal colours remain an orientation aid; the explicit season label follows the selected hemisphere. Solid/outlined event marks mean past/upcoming relative to the displayed moment. Dashed planet outlines indicate retrograde motion and are separately explained by text in the register. Reduced motion hides the seconds ring. Labelled controls, keyboard-operable marks, visible focus, zoom, and text event/observation lists provide alternatives to reading fine marks.

## Calculation and evidence

`lib/clock/calculation.ts` is server-only. It uses the pinned Astronomy Engine 2.1.19 and the existing geocentric longitude and motion helpers. Moon phase and illumination come from `MoonPhase` and `Illumination`; quarter events come from `SearchMoonQuarter` and `NextMoonQuarter`; seasonal events come from `Seasons`. No language-model inference supplies astronomical values.

Each snapshot, planet, Moon record, event and annual calendar receives a deterministic SHA-256-derived evidence ID incorporating the engine and calculation versions. The snapshot records UTC, engine/version, calculation version and tropical/geocentric coordinates; houses, nodes and observer coordinates are explicitly not applicable. SVG groups and text records reference these IDs. Civil clock marks use a `civil:<UTC timestamp>` reference. Downloaded JSON contains the immutable astronomical records for the displayed calculation time.

`GET /api/clock` accepts only an optional canonical ISO UTC `at` value, validates with a strict Zod schema, rejects duplicates and unknown parameters, and normalizes to minute precision. Planetary calculations refresh each minute in live mode. The client keeps the last successful snapshot with a visible error if a later request fails. Date changes are debounced and aborted when superseded. Annual calculations use a bounded eight-year process cache. At the 2050 boundary no next-year events are offered.

Clock API responses are deliberately public/cacheable and contain no personal information. Paid-report/private-chart trust rules are unaffected. The public query parameter is a global sky viewing instant, never a birth profile. Public endpoint input and response sizes are bounded; the year cache cannot grow with arbitrary dates.

## NOAA data

- Kp: <https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json>
- Solar wind: <https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json>
- Documentation: <https://www.swpc.noaa.gov/content/data-access>

`GET /api/clock/space-weather` accepts no parameters. The server fetches only these fixed sources with timeouts, a 15-minute Next data cache of the small normalized result, a bounded process cache and concurrent-request coalescing. Raw multi-megabyte wind responses are not placed in the Next fetch cache. Responses have a five-minute CDN cache. Keys and browser-to-NOAA requests are unnecessary. A failed first load returns unavailable; subsequent failures retain last-good data marked stale. Process-local last-good data does not survive a cold start. There is no promised historical archive.

Adapters validate actual NOAA object schemas, reject malformed/future times and invalid values, and retain only the current eight-day source window. Solar wind accepts active observations with overall_quality 0 and a positive speed, retaining the latest observation in each hour. Kp zero is valid; missing values are not replaced with zero. Kp older than six hours and wind older than two hours are stale. Each observation ID includes its timestamp, value and source. Source time and retrieval time are shown separately. NOAA data can be revised; changed values receive new IDs.

The 2026-09-15 source inspection found stale solar-wind observations, demonstrating why freshness must be explicit. No feed is described as local aurora visibility or linked to personal behaviour or recovery.

## Verification

New suites: `clock-calculation.test.ts`, `clock-space-weather.test.ts`, `clock-interface.test.tsx`, `clock-tooltips.test.tsx`.

Clock marks and calendar rings highlight on pointer hover and keyboard focus. Explanatory tooltips describe the value, scale, interpretation limits, source and UTC timestamp where applicable, retaining the underlying evidence ID. Planetary tracks highlight alongside their marks. Tooltips remain open while the pointer is over them, dismiss with Escape, and clear when the calculation changes. Click/touch selection uses the same explanations in the persistent detail panel; calendar rings also open explanations on tap or Enter/Space. Tooltip cards are constrained to the viewport.

- Independent USNO API 4.0.1 lunar/season event references, within two minutes of their minute-resolution published times.
- Production-engine golden lunar phase/illumination fixtures for J2000, leap day 2024 and September 2026. These are regression fixtures, not independent validation.
- Evidence determinism, leap-year positioning, year rollover, unsupported and malformed dates, strict public API input.
- Quality filtering, hourly sampling, true zero values, stale/unavailable distinction, request coalescing and last-good preservation.
- Named and keyboard-accessible controls, selection details, failed date-change recovery.

Sources retrieved 2026-09-15:

- <https://aa.usno.navy.mil/api/seasons?year=2026>
- <https://aa.usno.navy.mil/api/moon/phases/year?year=2026>
- Reference design: <https://datapoems.io/clocks/cosmic/>

Run the repository-required format, typecheck, lint, full test suite, build, dependency audit, license review and server ephemeris gate. Perform desktop/mobile browser checks for navigation, date exploration, selection, zoom, hemisphere, reduced motion and NOAA states. No tests touch production database rows or Docker.

## Release and recovery

No new secrets, scheduler, database objects or paid feature flags are needed. NOAA is off until selected. If an upstream schema changes, its adapter fails closed and the astronomical clock remains usable. Remove the navigation/home invitation and `/clock` route to withdraw the feature; no data migration rollback is necessary. The initial clock UI is English, consistent with an explicitly English public feature; localization is a future extension.

## Time explorer modal

The Explore time button above the dial opens a native modal dialog styled as a floating bottom panel. It retains date entry, the year slider and return to live time, with optional playback advancing one server-calculated day at a time. Playback stops at the end of the selected year or when the panel closes. Escape, close button and backdrop dismiss the panel; focus returns to its trigger. Background controls are inert while open. No calculation algorithms or feeds change.

Modal validation: 339 tests pass, including open/close, focus return and playback reset. Browser checks confirmed server-backed playback and Escape dismissal; desktop and mobile layouts reviewed. Dependency audit findings remain unchanged.
