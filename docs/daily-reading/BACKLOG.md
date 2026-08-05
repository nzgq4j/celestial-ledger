# Daily reading product backlog

These capabilities are explicitly deferred beyond the registered-user daily-reading release described in `IMPLEMENTATION_PLAN.md`. They require their own product decisions, architecture review, migrations, tests, and release approval. Their presence here does not authorize implementation or paid access.

## DR-B001 — User account levels and feature entitlements

### Objective

Introduce explicit account levels and capability entitlements so Celestial Atlas can consistently control which registered users may access daily readings, report types, generation frequency, historical archives, advanced techniques, visualizations, and future subscription benefits.

### Scope to design

- Product-defined account levels such as registered, member, and premium without hard-coding final commercial names into authorization logic.
- Capability-based entitlements rather than scattered checks for tier names.
- Free, trial, subscription, promotional, complimentary, one-time, administrative, and grandfathered grants.
- Effective and expiry dates, grace periods, revocation, refunds, cancellation, renewal, and plan migration.
- Per-period generation allowances and abuse-resistant usage accounting.
- Server-authoritative entitlement evaluation for pages, APIs, jobs, and generated content.
- Account UI showing the user's level, active benefits, usage, renewal/expiry state, and upgrade/downgrade paths.
- Administrative assignment and support tooling with privacy-minimized audit records.
- Stripe/webhook synchronization only after the existing commerce and legal release gates authorize it.

### Architecture constraints

- Authorization must use server-controlled database records or trusted app metadata, never user-editable metadata.
- Role-based administration and product account levels remain separate concepts. A `site_admin` role does not imply a paid product tier, and a premium tier grants no administrative authority.
- Feature code checks stable capability identifiers such as `daily_reading.generate`, `daily_reading.archive`, or `visualization.transit_timeline`, not display-level names.
- Every private query remains owner-scoped even after an entitlement check.
- Entitlement state must not be accepted from the browser or inferred from a Stripe redirect.
- Existing career/recovery entitlement and order records must be audited before consolidation; no destructive migration is assumed.
- Paid daily readings remain disabled until the required legal, licensing, security, commerce, and operational gates pass.

### Acceptance criteria

- A versioned account-level and capability-entitlement domain model is approved.
- Effective entitlement calculation is deterministic and independently tested.
- Page, API, background-job, and database checks agree for every capability.
- Concurrent usage accounting cannot overspend an allowance.
- Cancellation, expiry, refund, grace, and grandfathering fixtures pass.
- Cross-account and privilege-escalation tests pass.
- Admin actions are audited without report content, birth data, or secrets.
- Existing registered users receive an explicit, documented migration/default level.
- The UI is localized and accessible.

### Dependencies

- Product packaging and pricing decisions.
- Legal and tax review.
- Stripe catalog/webhook audit.
- Supabase additive migration, RLS, grants, advisors, backup, dry run, manual approval, and forward recovery plan.
- Usage/cost observability for AI generation.

## DR-B002 — Evidence-linked data visualizations

### Objective

Add accessible visual explanations of the deterministic analytical payload so users can see how current planetary conditions meet their natal chart and unfold across the day and coming cycles.

### Candidate visualizations

- Transit-to-natal aspect wheel or overlay.
- Applying/exact/separating transit timeline with exactness and active windows.
- Time-of-day map for lunar passages and short-lived conditions.
- Next-72-hour celestial sequence.
- Longer-term transit and repeated-pass arc.
- Theme-convergence matrix showing supporting, moderating, and contradictory signals.
- Life-domain emphasis map.
- Lunar phase, sign, natal-house, and void-of-course sequence.
- Opportunity/risk timing matrix derived from the validated reading analysis.
- Evidence constellation linking displayed themes to immutable evidence IDs.

### Architecture constraints

- Every mark, scale, label, date, strength, and relationship is derived from validated Stage A facts; the language model never supplies visualization coordinates or values.
- Visualizations use the same calculation, evidence, rule, and schema versions as the reading they accompany.
- Unknown birth time removes house, angle, and exact-time-dependent marks rather than estimating them.
- Visual encodings must not imply probability, certainty, causation, or unsupported precision.
- The underlying data contract is renderer-neutral so SVG, HTML, canvas, print, and future export views cannot drift.
- Private visualization payloads inherit owner authorization, no-store, noindex, deletion, and expiry controls.
- Charts must be responsive, localized, printable, and usable without color alone.
- Every chart has a text/table equivalent and meaningful keyboard/screen-reader navigation where interaction is provided.

### Acceptance criteria

- A visualization specification maps every mark to an immutable evidence ID and unit.
- Golden visual-data fixtures agree with calculation fixtures.
- Time zones, DST boundaries, wrapping at 0°/360°, repeated passes, and missing-time states render correctly.
- No visualization contains model-invented values or client-recalculated authoritative facts.
- Automated visual regression, accessibility, reduced-motion, responsive, localization, and print tests pass.
- The report remains complete and understandable when styles, motion, or interactive graphics are unavailable.
- Performance budgets cover initial render, interaction, and payload size on mobile devices.

### Dependencies

- Stable DailyReadingAnalysis and evidence schemas.
- Approved visualization information architecture and design tokens.
- Account-level capability entitlement decision if advanced visualizations vary by level.
- Browser accessibility and visual-regression test tooling.

## Recommended sequencing

1. Complete and stabilize the deterministic daily-reading analytical payload.
2. Design account levels and capability entitlements before gating any new visualization or generation feature.
3. Implement one accessible evidence-linked transit timeline as the visualization reference pattern.
4. Validate its data contract, accessibility, localization, print behavior, and performance.
5. Expand to the remaining visualizations only where each materially improves understanding.
