# Paid account entitlements and Stripe enablement plan

Status: **planning only; production paid access remains disabled**.

This plan implements paid account capabilities and Stripe billing without changing astronomical facts, weakening owner authorization, or treating a browser redirect as proof of payment. It preserves the existing one-time report commerce model and adds subscription/account access as a separate, additive domain.

## 1. Current state and decisions

### Existing foundations to retain

- Authenticated Supabase accounts, owner-scoped RLS, private account pages, and server-only administrative access already exist.
- `products`, `orders`, and `entitlements` implement one-time report purchases. A signed Stripe webhook calls the service-role-only, transactional `process_stripe_event` RPC to create one report entitlement.
- Checkout is authenticated, same-origin, schema-validated, server-created, amount-checked, and idempotent at the order and Stripe request layers.
- Stripe secrets are server-only and preview/demo mode disables checkout.
- Career and Recovery report generation already consumes an unused report entitlement or creates an auditable complimentary zero-value order and entitlement.

### Gaps to close

- No account-plan, subscription, capability-grant, effective-entitlement, or usage-ledger model exists.
- No Stripe customer or subscription lifecycle is stored.
- Existing `entitlements` mean “one report credit”; they cannot safely represent recurring account benefits or quotas.
- The checkout button is not wired into the current account product UI, which presents reports as complimentary.
- Webhook tests, disposable-database migration/RLS tests, authenticated ownership tests, refund/cancellation fixtures, accessibility tests, and operational reconciliation are still deferred.
- Documentation still declares production paid reports blocked by identity/commerce/safety/security/operations controls. Licensing approval alone is not launch authorization.

### Domain decision

Keep two explicit access systems:

1. **Report entitlements** — the existing one-time, single-use `entitlements` rows tied to `orders` and paid/complimentary reports.
2. **Account capabilities** — additive account plans and grants evaluated by stable capability keys, independent of administrative roles.

Feature code must ask questions such as `can(user, "daily_reading.generate")`, never `plan === "premium"`. A `site_admin` role grants no paid capabilities, and a paid plan grants no administrative authority.

## 2. Release gates before implementation or enablement

Record explicit owners and evidence for each gate. No production catalog activation, live-mode secret, production webhook fulfilment, or paid UI is allowed until all required gates are approved.

1. **Product gate** — approve plan packaging, billing intervals, trial/grace policy, report-credit behavior, upgrade/downgrade rules, refund policy, regional availability, and customer-facing copy.
2. **Commercial compliance checklist (owner-cleared; not a legal blocker)** — publish accurate terms and privacy disclosures, cancellation/refund language, tax configuration, invoices/receipts, and any applicable renewal notices. The former astronomy licensing issue is resolved by the approved MIT-licensed Astronomy Engine replacement.
3. **Safety gate** — approve Career and Recovery schemas, Recovery evaluations, adults-only enforcement, crisis exit behavior, and prohibited-claim tests.
4. **Calculation/evidence gate** — retain passing production-engine golden fixtures and ensure every paid claim and visual mark references immutable evidence IDs; unknown times omit dependent facts.
5. **Security/privacy gate** — complete threat model, BOLA/owner tests, secret scan, dependency audit, rate limits, data retention/deletion, `no-store`, and `noindex` verification.
6. **Commerce gate** — pass Stripe test-mode catalog, Checkout, webhook signature, duplicate/out-of-order event, refund, dispute, cancellation, renewal, and reconciliation tests.
7. **Operations gate** — approve backup, migration dry run, forward recovery, alerts, support procedures, reconciliation job, incident kill switches, and manual production change.

## 3. Additive data model

Create one reviewed Supabase migration; do not alter or repurpose existing report entitlement rows.

### Catalog and account tables

- `billing_plans`: stable internal key, version, display metadata, active/sellable flags, and effective dates. Commercial names remain presentation data.
- `billing_prices`: plan/version, Stripe product and price IDs, currency, amount, interval, environment (`test`/`live`), active dates, and catalog sync timestamp. Never accept a browser-supplied price ID as authoritative.
- `billing_customers`: one owner-scoped mapping from Supabase user ID to Stripe customer ID; service-role write, owner read only if actually needed by UI.
- `billing_subscriptions`: Stripe subscription/customer/price identifiers, normalized lifecycle status, period dates, cancel-at-period-end, trial/grace dates, ended date, and last Stripe event creation time.
- `capabilities`: stable identifiers and value type (`boolean`, `count`, or bounded configuration).
- `plan_capabilities`: versioned plan-to-capability definitions, allowance and period where applicable.
- `capability_grants`: user, capability, source (`subscription`, `trial`, `promotion`, `complimentary`, `grandfathered`, `admin`), source reference, effective/expiry/revoked dates, allowance overrides, and privacy-minimized reason code.
- `capability_usage_periods`: user, capability, canonical period start/end, allowed amount, consumed amount, and version. A database RPC performs atomic check-and-consume under row lock.

### Required invariants

- Unique Stripe IDs and one active canonical customer per user.
- Subscription updates ignore older Stripe events using event creation time plus deterministic tie handling.
- Grants are append/audit friendly; revocation is explicit rather than destructive.
- Usage cannot exceed its allowance under concurrent requests.
- Effective access is evaluated from server time, active grants, plan rules, grace policy, revocations, and usage—not client state or redirect parameters.
- All private rows use RLS and owner-scoped reads; only service-role functions mutate billing state.
- Audit metadata excludes birth data, report content, raw Stripe payloads, secrets, and unnecessary payment details.

## 4. Entitlement service

Add a server-only module (for example `lib/entitlements/`) with strict schemas and a small stable API:

- `getAccountAccess(userId, at)` returns effective plan presentation plus capabilities and usage summaries.
- `hasCapability(userId, capability, at)` performs a read-only decision.
- `consumeCapability(userId, capability, idempotencyKey, at)` calls a security-definer RPC that atomically evaluates and spends allowance.
- `grantCapability` and `revokeCapability` are service/admin-only and always audited.
- `syncSubscriptionAccess` translates normalized Stripe state into deterministic grants; webhook routes do not scatter feature logic.

Pages, APIs, workers, and database queue functions must use the same rules. Owner authorization remains a separate check after capability evaluation.

Recommended initial capability keys:

- `daily_reading.generate`
- `daily_reading.archive`
- `report.career.generate`
- `report.recovery.generate`
- `report.future_trends.generate`
- `visualization.transit_timeline`
- `account.birth_profile.limit`

Only keys for approved, implemented products should be enabled. Paid daily readings and advanced visualizations remain off until their own implementation plans and gates pass.

## 5. Stripe integration

### Catalog synchronization

- Create separate Stripe test products/prices for subscriptions and existing one-time reports.
- Store Stripe IDs only through an audited catalog sync/admin operation; application requests use stable internal plan/report keys.
- Verify Stripe price currency, amount, interval, active state, and environment against the database before making a plan sellable.
- Never mix test and live identifiers. Preview remains fixture-backed and cannot fulfil payments.

### Checkout

- Keep `/api/checkout` for one-time reports, but place it behind a server-side commerce feature flag and add full contract coverage.
- Add a distinct authenticated subscription Checkout endpoint accepting only a strict internal `planKey` and billing interval.
- Server resolves the approved price, creates or reuses the Stripe customer, and creates Checkout with `client_reference_id` and minimal metadata containing opaque internal IDs only.
- Use server-configured success/cancel URLs. The return page only displays “processing/active” state read from the database; it never grants access.
- Add a Stripe Billing Portal endpoint that derives the customer from the authenticated user. Never accept `customerId` from the browser.

### Webhooks

- Continue reading the raw request body and verifying `Stripe-Signature` before parsing.
- Expand supported events for subscriptions: Checkout completion, subscription created/updated/deleted, invoice paid/payment failed, trial ending if surfaced, refunds, and disputes.
- Persist only minimal normalized event metadata. Process events idempotently in a transactional service-role RPC.
- Retrieve authoritative Stripe objects when event data is incomplete or expansion/version differences matter.
- Map Stripe lifecycle into local normalized state, then reconcile grants. Cancellation normally retains access until the paid-through date; payment failure follows the approved grace policy; refund/dispute behavior follows the approved policy.
- Return retryable 5xx responses only for transient/internal failures. Unsupported valid events return 2xx as unhandled. Permanent mismatches are recorded for operator review without leaking details.

### Reconciliation

- Add a scheduled, privacy-minimized reconciliation job that compares active local subscriptions with Stripe and repairs missed events idempotently.
- Alert on webhook age/failure, catalog mismatch, orphan customer/subscription, duplicate customer, negative/overspent allowance, and reconciliation drift.

## 6. Product and account experience

- Replace complimentary product presentation only after its paid equivalent is approved and test-mode verification passes.
- Account page shows current level, benefits, allowance usage, renewal/trial/cancellation state, invoices/portal action, and available upgrades without exposing Stripe identifiers.
- Checkout return state polls or refreshes server-authoritative account access and explains that payment confirmation may take a moment.
- Preserve the existing “purchased and ready to generate” flow for one-time reports.
- Add localized, accessible states for pending, active, trial, grace, cancel-at-period-end, expired, refunded, disputed, and support-required outcomes.
- Administrative support tools may grant/revoke promotional or complimentary capabilities, inspect normalized billing state, and trigger reconciliation. They must not display full payment instruments, birth data, or report content.

## 7. Ordered delivery slices

| Slice | Work                                                                                                   | Exit criteria                                                                            | Production exposure   |
| ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------- |
| PE-00 | Gate register, approved product rules, threat model, event/state matrix, rollback plan                 | Named approvals and unambiguous lifecycle rules                                          | None                  |
| PE-01 | Characterize existing one-time orders, report entitlements, Checkout, webhook RPC, complimentary flows | Existing behavior captured by tests                                                      | None                  |
| PE-02 | Add plan/catalog/capability/subscription/usage schema, RLS, ACLs, generated types                      | Disposable DB migration, RLS, concurrency, advisor tests pass                            | None                  |
| PE-03 | Implement deterministic entitlement service and atomic usage RPC                                       | Table-driven lifecycle and concurrency fixtures pass                                     | None                  |
| PE-04 | Add Stripe test catalog sync, subscription Checkout, portal, expanded webhook, reconciliation          | Stripe CLI/test-mode contracts including duplicates and out-of-order events pass         | Test mode only        |
| PE-05 | Integrate account/API/worker capability checks and accessible account billing UI                       | Page/API/job decisions agree; BOLA and accessibility tests pass                          | Disabled feature flag |
| PE-06 | Complete one-time report purchase UI and test-mode end-to-end fulfilment                               | Paid webhook creates exactly one usable report entitlement; refund/dispute fixtures pass | Controlled test users |
| PE-07 | Full release gates, backup, dry run, live catalog verification, manual approval                        | All required checks and smoke tests recorded                                             | Cohort rollout        |
| PE-08 | Monitor, reconcile, expand cohort, then general availability                                           | Error/drift/support thresholds remain acceptable                                         | Gradual enablement    |

## 8. Verification matrix

Required automated coverage:

- Unit: capability precedence, effective/expiry boundaries, cancellation, grace, refund, dispute, grandfathering, plan migration, and unknown capability denial.
- Database: additive migration, constraints, grants, RLS/BOLA, security-definer ACLs, audit minimization, concurrent allowance consumption, idempotent grant reconciliation, and forward-recovery rehearsal.
- API: authentication, same-origin, payload limits, stable-key lookup, inactive plan denial, price mismatch denial, customer derivation, private headers, and rate limits.
- Stripe contracts: valid/invalid signatures, raw body, duplicate and out-of-order events, delayed payment, renewal, failure recovery, cancellation, refund, partial/full refund policy, dispute, missing object, and transient retry.
- End to end: subscribe → webhook → capability; cancel → paid-through access → expiry; buy report → webhook → exactly one report entitlement → consume once; portal ownership; account deletion behavior.
- Safety/evidence: paid generation cannot bypass server calculation, evidence links, unknown-time exclusions, Recovery policy, or crisis routing.
- Release: format check, typecheck, lint, unit/integration tests, production build, dependency/security audit, secret scan, license review, ephemeris gate, safety evaluations, and accessibility tests.

Tests must use Stripe test mode and disposable Supabase infrastructure, never production rows or the prohibited previously inspected Docker container.

## 9. Deployment and forward recovery

1. Keep `commerce.checkout_enabled`, `commerce.webhook_fulfilment_enabled`, `commerce.subscriptions_enabled`, and each paid capability disabled by default in server-controlled settings.
2. Capture a recoverable production backup and record its timestamp.
3. Apply the additive migration to an isolated Supabase branch/clone; validate schema, data defaults for existing users, types, advisors, and forward-recovery SQL.
4. Deploy code with all flags off; configure test/live secrets only in the correct provider environment.
5. Register and verify the production webhook, but keep fulfilment disabled until the manual approval checkpoint.
6. Sync and independently verify the live catalog; activate only explicitly approved prices.
7. Enable a controlled internal cohort, run privacy-safe purchase/cancel/refund smoke tests, and monitor reconciliation.
8. Expand gradually. Any anomaly disables Checkout or fulfilment flags; preserve rows and repair state with forward migrations/reconciliation rather than destructive rollback.

## 10. Immediate next actions

1. Approve the two-domain model: existing single-use report entitlements plus additive account capabilities.
2. Produce the product lifecycle matrix for plans, trials, grace, cancellation, refunds, upgrades, included report credits, and existing-user defaults.
3. Create PE-01 characterization tests before modifying migrations or Stripe routes.
4. Draft the additive PE-02 migration and its matching forward-recovery script for review; do not apply it to production.
5. Build PE-03 and PE-04 behind disabled flags, using Stripe test mode only.
