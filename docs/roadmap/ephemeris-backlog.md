# Celestial Atlas ephemeris roadmap

This roadmap separates the committed Celestial Atlas report launch from the directional professional-ephemeris extensions. Backlog placement does not imply a delivery date. Every extension requires its own accuracy, licensing, privacy, safety, and operational review before implementation or release.

## Now — committed launch foundation

Status: **In progress**

The current product remains focused on the free deterministic natal chart and three private reports.

1. Complete Supabase authentication and private birth-profile persistence.
2. Synchronize the Stripe test catalog and implement webhook-backed entitlements.
3. Build Career and Purpose as the first evidence-linked paid report.
4. Add twelve-month Future Trends.
5. Release Recovery Reflection only after its recovery-language safety evaluation passes.

The validated calculation baseline is tropical Sun through Pluto plus mean North Node, apparent geocentric ecliptic longitude, velocity/retrograde state, Ascendant, Midheaven, equal houses, major aspects, and explicit unknown-time exclusions for birth years 1800–2050.

## Next — product ephemeris extensions

Status: **Not started**  
Priority: **Should have after initial report launch**  
Owner: **TBD**

These extensions deepen the current reports without turning the project into a general-purpose astrology platform.

### Richer transform output

- Ecliptic latitude, right ascension, and declination for every supported body.
- Explicit TT, UTC, UT1, ΔT, leap-second, obliquity, frame, correction, and uncertainty metadata.
- Antiscia and contra-antiscia.
- Interpolated station timestamps rather than sampled daily flags.
- Applying/separating aspects derived from velocity.
- Exact-aspect and return root-finding.

Dependencies: versioned time-scale policy, JPL cross-validation harness, output-schema migration, performance budget.

### Initial catalog expansion

- Mean and true lunar nodes.
- Chiron, Ceres, Pallas, Juno, and Vesta.
- A reviewed starter fixed-star catalog with proper motion.
- Part of Fortune, a deliberately limited reviewed set of lots, and direct midpoints.
- Data-driven catalog registration instead of new hard-coded branches.

Dependencies: permissive source-data licensing, stable identifiers, kernel/orbital-element provenance, uncertainty model.

### Initial framework expansion

- Equal and Whole Sign houses as supported production systems.
- Porphyry, Regiomontanus, and Campanus only after independent golden fixtures.
- Configurable major and selected minor aspects.
- Fixed, planet-weighted, and moiety-based orb profiles.
- Saved configuration profiles instead of global defaults.
- A small reviewed sidereal/ayanamsa set rather than broad unverified coverage.

Dependencies: tradition-specific product requirements, polar fallback policy, reference implementations, schema versioning.

### Search and relational primitives

- Time-series transit queries.
- Next exact aspect, station, return, ingress, and eclipse queries.
- Synastry cross-aspects.
- Composite midpoint calculations.
- Harmonic, 90-degree dial, draconic, and heliocentric transforms.

Dependencies: bounded search contracts, cancellation and timeout behavior, batch performance tests, deterministic caching.

## Later — professional ephemeris platform

Status: **Directional backlog**  
Priority: **Could have; not required for current reports**  
Owner: **TBD**

### High-precision authoritative engine

- Evaluate an offline JPL DE440/DE441 kernel-backed server engine.
- Target sub-arcsecond inner-body precision only after the engine and reference data demonstrate it.
- Preserve Astronomy Engine as a fast preview engine if dual-engine drift can be controlled.
- Add per-position uncertainty and accuracy-regime metadata.
- Extend beyond 1800–2050 only with explicit ΔT, civil-time, calendar, and validation policies.

Dependencies: kernel and reader licensing, storage/runtime architecture, reproducible data snapshots, specialist astronomical review, independent cross-validation.

### Extended and specialist catalog

- Lilith/apogee variants with unambiguous definitions.
- Pholus, Nessus, Eris, Sedna, Haumea, Makemake, and Quaoar.
- Versioned asteroid and comet catalogs.
- A 1,000-plus fixed-star catalog with proper motion and catalog provenance.
- Hypothetical Uranian/Hamburg points, clearly labeled as formula-based rather than observed bodies.
- Extensible lots, indirect/composite midpoints, Vertex, Anti-Vertex, and East Point.

Dependencies: catalog governance, source-data licensing, naming/versioning policy, distinction between observed and hypothetical points.

### Broad cross-tradition framework

- Placidus, Koch, Topocentric, Alcabitius, Morinus, Meridian, and further house systems, each with polar behavior and golden fixtures.
- A broad ayanamsa catalog including Lahiri, Krishnamurti, Raman, Fagan-Bradley, true Citra, true Revati, and custom definitions.
- Western tropical, selected sidereal/Jyotish, Hellenistic, cosmobiology, and Uranian configuration profiles.
- Declination parallels/contraparallels and harmonic aspect families.

Dependencies: qualified tradition-specific review, source-table licensing, configuration governance, clear user-facing methodology.

### Advanced technique modules

- Secondary progressions, solar arc directions, and solar/lunar returns.
- Primary directions only after right-ascension, pole, and historical ΔT accuracy is independently approved.
- Profections, firdaria, zodiacal releasing, and reviewed time-lord tables.
- Davison relationship charts.
- Electional window search and horary computation primitives.
- Mundane ingresses, eclipses, stations, heliacal events, and long-cycle searches.

Dependencies: technique-specific schemas, exact-event search engine, extensive regression corpus, specialist review, bounded compute/cost controls.

### Delivery platform

- Stateless point-in-time and search APIs.
- Batch/vectorized execution for multi-year scans.
- Reproducible ephemeris-data snapshots and cache keys.
- Gregorian/Julian switching with explicit calendar metadata.
- Sub-100ms targets only where measured and compatible with the selected engine.
- Public extension contracts for catalogs, house systems, ayanamsas, aspects, and techniques.

Dependencies: service-level objectives, workload isolation, abuse prevention, observability without sensitive chart data, compatibility policy.

## Explicit boundaries

- Computation remains separate from interpretation.
- Language models never calculate or alter astronomical evidence.
- “Professional grade,” “sub-arcsecond,” and similar claims cannot ship until demonstrated by the selected engine and independent fixtures.
- Medical and financial interpretation or advice is not part of the Celestial Atlas product. Neutral astronomical timing primitives do not authorize those uses.
- Hypothetical points must never be presented as observed astronomical bodies.
- The long-term backlog must not delay the committed report launch unless a future product requirement makes a listed capability a direct dependency.

## Principal risks

- Astronomy Engine’s documented approximately one-arcminute target cannot satisfy a future sub-arcsecond requirement by itself.
- JPL kernels improve precision but materially increase runtime, data, reproducibility, and operations complexity.
- Broad catalogs and historical data introduce licensing and provenance risks.
- House systems and ayanamsas encode contested tradition-specific choices and require explicit profiles, not hidden defaults.
- Advanced search techniques can create unbounded workloads without strict query limits.
- The full “Later” scope is a multi-quarter platform initiative, not an extension of the initial report sprint.
