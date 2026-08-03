# Celestial Atlas Development Controls

## Product boundary

- Astrology is symbolic reflection, not scientifically validated prediction.
- The language model must never calculate or alter astronomical facts.
- Browser chart payloads are untrusted; paid reports require independent server calculation.
- Do not implement or enable paid reports until both release gates in `docs/legal/licensing-review.md` are approved.

## Privacy and security

- Minimize birth data and never place it in URLs, logs, analytics, or public metadata.
- Validate API input with strict runtime schemas and authenticate every private operation.
- Private reports require owner authorization, one-year expiry, deletion support, `no-store`, and `noindex`.
- Never expose service-role, OpenAI, Stripe, webhook, or cron secrets to browser bundles.

## Calculation and evidence

- Record engine, package/data version, zodiac, house system, node type, timezone, UTC, coordinates, and calculation version.
- Every report claim and visual mark must reference immutable evidence IDs.
- Unknown times exclude houses, angles, and claims dependent on exact timing.
- Calculation changes require production-engine golden fixtures.

## Recovery language

- Adults only; structured reviewed themes only; no free-text recovery narrative.
- No diagnosis, treatment or medication advice, shame, blame, inevitability, or relapse prediction.
- Never claim astrology causes substance use or predicts recovery.
- Crisis signals leave the astrology flow and show reviewed region-neutral emergency guidance.

## Change and release protocol

- Use focused changes, migrations, tests, and documentation together.
- Required checks: format, typecheck, lint, unit/integration tests, build, security audit, license review, ephemeris gate, safety evaluations, and accessibility tests.
- Production database changes require backup, dry-run validation, manual approval, additive migrations, and a forward recovery plan.
- Never use or modify the previously inspected Docker container for this project.
