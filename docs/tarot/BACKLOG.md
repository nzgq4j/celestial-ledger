# Tarot expansion backlog

Status: **deferred product backlog; no implementation or paid access is authorized by this document**.

## Product boundary

Tarot is offered as a symbolic reflection practice, not fortune-telling, factual divination, diagnosis, or prediction. It must not claim that cards cause events, reveal hidden facts, determine another person's thoughts, predict relapse, replace professional advice, or make inevitable claims. Crisis signals leave the tarot flow and show reviewed region-neutral emergency guidance.

Tarot content and evidence remain separate from astronomical calculation evidence. A card draw must never alter natal, transit, house, aspect, time-zone, or ephemeris facts.

## TAR-B001 — Domain model and evidence

- Define versioned decks, cards, orientations, spreads, positions, themes, and immutable draw evidence IDs.
- Use a cryptographically suitable server-side draw when a generated draw is requested; record algorithm/version and the ordered candidate set.
- Distinguish user-selected physical cards from server-generated cards in provenance.
- Never accept a browser draw as authoritative for a paid/private reading without server validation or explicit user-selected provenance.
- Define reproducible fixtures for deck completeness, uniqueness, orientation, spread ordering, and evidence IDs.

## TAR-B002 — Reviewed interpretation system

- Create reviewed card and position meanings with supporting, moderating, and contradictory themes.
- Generate bounded structured reflections from validated draw evidence only.
- Require every displayed claim to cite card/position evidence IDs and interpretation-rule versions.
- Include uncertainty and agency language; prohibit certainty, causation, mind-reading, shame, blame, diagnosis, and prescriptive medical/legal/financial advice.
- Add adversarial and safety evaluation suites, including Recovery and crisis-language scenarios.

## TAR-B003 — Reading experiences

- Single-card reflection with a user-stated, non-sensitive focus.
- Three-card spread with configurable reviewed position sets such as situation / tension / next constructive step.
- Larger spreads only after usability and interpretation-density review.
- Accessible text-first presentation, keyboard operation, reduced motion, printable views, and non-colour-only orientation cues.
- Private saved readings with owner authorization, `no-store`, `noindex`, deletion, and documented expiry.

## TAR-B004 — User context and privacy

- Prefer reviewed focus categories over unrestricted personal narratives.
- If bounded free text is later approved, apply strict length limits, prompt-injection isolation, retention disclosure, deletion, and safety routing.
- Do not collect third-party personal data or encourage readings that claim another person's private thoughts, health, fidelity, or future actions.
- Keep tarot input and output out of URLs, analytics, public metadata, and operational logs.

## TAR-B005 — Entitlements and commerce

- Define stable capabilities such as `tarot.single.generate`, `tarot.spread.three_card`, and `tarot.archive` after the account-capability system is approved.
- Decide whether tarot is registered access, subscription allowance, one-time purchase, or complimentary promotion without hard-coding plan names into feature checks.
- Use server-authoritative, concurrency-safe usage accounting.
- Stripe redirects never grant access; only normalized database entitlement state may authorize a paid reading.
- Keep tarot commerce disabled until product, safety, privacy, security, payment, and operational checks pass.

## TAR-B006 — Administration and editorial controls

- Version and review decks, card meanings, spread definitions, prompt/schema versions, and safety profiles.
- Add draft/published/retired lifecycle without changing historical completed readings.
- Audit administrative changes without storing reading content or sensitive user context in audit metadata.
- Provide support-safe visibility into job state, entitlement state, and deletion without exposing unnecessary private content.

## TAR-B007 — Testing and release

- Unit tests for deck integrity, draw uniqueness, provenance, evidence stability, schema rejection, and unknown/retired versions.
- Database/RLS and BOLA tests for saved readings, evidence, deletion, expiry, and capability usage.
- Safety tests for determinism, dependency, coercion, mental-health diagnosis, substance-use/recovery prediction, third-party mind-reading, and crisis exits.
- Accessibility, localization, responsive, print, and reduced-motion tests.
- Required project checks: format, typecheck, lint, tests, build, security audit, license review, safety evaluations, and accessibility tests.

## Recommended sequence

1. Approve the symbolic-reflection boundary and reviewed safety language.
2. Define the deck/spread/evidence domain and golden fixtures.
3. Build deterministic draw and structured interpretation modules without UI exposure.
4. Validate a single-card reference experience for registered users behind a disabled flag.
5. Add private persistence and three-card spreads only after security, privacy, and safety acceptance.
6. Integrate paid capabilities only after the general account-entitlement system is operational.
