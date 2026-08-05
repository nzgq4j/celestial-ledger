# Daily reading decisions

## DR-ADR-001 — Audit before implementation

Status: accepted.

The current repository has substantial reusable astrology, identity, evidence, and private-report capability. Production implementation is blocked until this audit and a derived plan are reviewed.

## DR-ADR-002 — Registered daily reading is distinct from public horoscopes

Status: accepted.

The public horoscope remains a generic tropical whole-sign Sun-chart product. The registered daily reading is based on a selected owned natal chart, current celestial windows, and transit-to-natal evidence. Copy and persistence are not shared.

## DR-ADR-003 — Server-authoritative natal and daily calculation

Status: accepted.

Raw owned birth-profile fields are loaded server-side and recalculated. Cached/browser chart JSON is never authoritative evidence. The model receives calculated analysis and never calculates or alters astronomy.

## DR-ADR-004 — Preserve commercial report boundary

Status: accepted.

Daily readings do not become `products`, consume `entitlements`, create synthetic `orders`, or make `reports.entitlement_id` nullable. A distinct owner-scoped daily lifecycle is justified by cadence, uniqueness, caching, and non-commercial access. Shared worker/provider primitives may be refactored safely.

## DR-ADR-005 — Bottom Line Up Front is mandatory and first

Status: accepted.

Every registered daily reading begins with a structured Bottom Line Up Front. The target is 425–575 words, with overview, active conditions, 3–5 practical priorities, forward look, and a tension block when material. It must summarize cited body sections, use only their evidence, and appear before all other interpretive sections.

## DR-ADR-006 — Deterministic Stage A precedes narrative Stage B

Status: accepted.

Stage A contains calculated facts, rules, signals, scores, themes, contradictions, time horizons, applications, risks, and limits. Stage B only expresses that payload in the selected language. The completed reading persists both provenance and validated output.

## DR-ADR-007 — Structured context first

Status: accepted for plan.

Release one uses bounded context categories and event types. Calendar connections and unrestricted journal text are deferred. Recovery uses adult confirmation and reviewed themes only. Context affects relevance/order and never calculated facts.

## DR-ADR-008 — Locale inheritance and snapshot

Status: accepted for plan.

The existing account report locale is the default registered-reading language; a per-reading override is supported. The locale is immutable on the reading record. Every reader-facing field, including BLUF and technical labels, is localized.

## DR-ADR-009 — Time-zone and location behavior

Status: requires product validation.

The selected birth profile's IANA zone is the safe default for the civil day. A current-location override is private and explicit if introduced. Current angles are deferred until location behavior, privacy, and independent fixtures are approved.

## DR-ADR-010 — Versioned canonical caching

Status: accepted for plan.

Identical user/profile/date/time-zone/locale/context/method/rule/schema versions resolve to one active or completed reading. Version or approved input changes create a new canonical record. This controls cost and ensures reproducibility.

## DR-ADR-011 — No generic disclaimer section

Status: accepted within governing controls.

Reader-facing copy uses the site's astrological register. Actual method limitations—unknown birth time, omitted evidence, bounded search, unavailable current location—are stated precisely in a technical limitations structure. System prompts and safety validation still prohibit unsupported deterministic, medical, legal, financial, or recovery claims.

## DR-ADR-012 — Deferred techniques

Status: accepted.

Annual techniques, current angles/houses, calendar integrations, unrestricted user text, new celestial bodies, new house systems, and professional ephemeris expansion do not enter release one. Long-term context uses validated slow-moving transit windows and repeated passes.

## DR-ADR-013 — No deletion in audit phase

Status: accepted.

Every inspected component has an active consumer or unresolved migration dependency. Direct imports of route modules as services may be deprecated only after a service extraction and consumer migration. Nothing is deleted now.

## DR-ADR-014 — Account levels and visualizations are post-release epics

Status: accepted for backlog.

User account levels and capability entitlements will be designed as a product-access system separate from administrative RBAC and the current report-specific entitlements. Evidence-linked visualizations will be derived only from the deterministic Stage A payload and will require accessible text equivalents. Neither capability expands the registered daily-reading release-one scope. Account-level design precedes tier-gated visualization or generation features.
