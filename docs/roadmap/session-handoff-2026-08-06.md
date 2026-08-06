# Celestial Atlas next-session handoff

Prepared 2026-08-05 for the next development session beginning on or after 2026-08-06.

## Build status

Production is live from `main` at commit `4fd8535` (`Refine social share controls`). The matching Vercel deployment completed successfully, and the live Gemini horoscope page returned HTTP 200 with all nine icon-only share controls present.

Latest verified release checks:

- formatting clean;
- TypeScript typecheck passed;
- ESLint passed with zero warnings;
- 15 test files and 96 tests passed;
- Next.js 16 production build passed;
- production share-control smoke test passed.

## What is now accomplished

### Public experience and content

- The site uses its dark Celestial Atlas visual system consistently, with the high-resolution night-sky hero used across the landing and account experiences.
- The landing page includes paths into daily horoscopes, weekly readings, detailed reports, membership, account creation, and the wider site footer.
- All twelve daily Sun-sign readings have differentiated Bottom Line Up Front, relationship, business, money, opportunity, reflection, and morning/afternoon/evening content.
- The public horoscope grid uses aligned button calls to action, and each detailed reading has a shareable canonical page.
- Sample and registered-user daily readings include BLUF-first structure, practical applications, and visual reading arcs.

### Social sharing and discovery

- Every detailed Sun-sign page generates a hero-backed 1200 × 630 landscape social card with its constellation, summary, date, and `celestialatlas.app` URL.
- Pinterest and Instagram receive a corresponding 1000 × 1500 portrait image.
- The share tray now provides icon-only controls for Facebook, X, Bluesky, Pinterest, Instagram, WhatsApp, Slack, email, and copy link.
- Supported compose flows receive a concise sign-specific caption with `#horoscope`, `#astrology`, `#dailyhoroscope`, and `#CelestialAtlas`; Instagram, Facebook, and Slack copy the prepared caption where the destination cannot accept a complete generic prefilled post.
- Sitemap, robots, `llms.txt`, Google verification, canonical metadata, multilingual discovery metadata, article cards, and SEO/GEO defaults are present.

### Accounts, private readings, and localization

- Supabase authentication supports password and Google OAuth account flows.
- Existing account holders have a separate first-natal-chart path that does not ask them to create another account.
- The account experience includes saved charts, localized settings, report-language selection, report progress, timeout/failure handling, printing, and confirmed deletion.
- Registered-user daily readings use server-authoritative calculated evidence, private storage, BLUF-first presentation, print support, and deletion.
- English, German, Spanish, and French site packs are wired through the language preference experience, with report-level override support.

### Administration, security, and operations

- `/admin` is role-protected and includes user access/role management, AI model selection, Google integration settings, SEO/GEO defaults, audit history, and journal authoring.
- `david@crucibleinsight.com` is the intended `site_admin`; authority comes from the server-controlled `admin_roles` table, not user-editable metadata.
- The security/SEO/GEO audit is recorded in `docs/audits/security-seo-geo-2026-08-05.md`.
- Private routes use owner authorization, hardened response headers, input schemas, same-origin mutation checks, and server-only secrets.
- Generated monetization outputs remain local and ignored by Git.

## Tomorrow's outcome

Prepare a production-safe membership and commerce foundation, expand the detailed-report catalogue, and turn the administration console into a practical operating dashboard. Work in Stripe test mode first. Production billing, production database migrations, and paid-report release remain explicit approval points.

## Priority 1 — Stripe and memberships

### Product decisions to confirm first

Use the currently published launch structure as the starting proposal, not as an immutable authorization model:

- **Free:** 1 saved natal chart, 1 personal daily reading each week, public horoscopes, samples, and optional reading-credit packs from $5.
- **Personal ($9.99 USD/month):** 2 saved charts, up to 10 personal daily readings monthly, primary-chart weekly reading, à-la-carte detailed reports, and a 10% detailed-report discount.
- **Premium ($19.99 USD/month):** 5 saved charts, a daily primary-chart reading with email delivery, 10 companion-chart daily readings monthly, weekly reading, one quarterly standard-report credit, and a 20% detailed-report discount.

Before implementation, confirm subscription prices, annual-plan policy, $5 credit-pack contents, report catalogue/prices, trial policy, taxes, supported currencies, cancellation timing, grace periods, refunds, and grandfathering.

### Required implementation sequence

1. Reconcile the published membership copy with an approved versioned plan/capability matrix.
2. Keep administrative RBAC separate from customer membership tiers.
3. Design additive tables for plans, subscriptions, capability grants, usage ledgers, credits, and Stripe identifiers; migrate existing users explicitly to Free.
4. Enforce stable capabilities such as `birth_profile.create`, `daily_reading.generate`, `daily_reading.email`, and `report.purchase` on the server, database, API, job, and UI boundaries.
5. Make allowance consumption atomic and concurrency-safe; cover renewal, expiry, cancellation, refund, grace, promotion, complimentary access, and plan changes.
6. Create Stripe products/prices in test mode, configure Checkout and Customer Portal, and synchronize subscription lifecycle events only through signed, idempotent webhooks.
7. Never grant access from a browser redirect or browser-provided tier value.
8. Add localized account membership, usage, renewal, upgrade, downgrade, cancellation, and credit history views.
9. Add test fixtures for cross-account access, allowance overspend, webhook replay/out-of-order delivery, cancellation, refund, failed payment, and plan migration.
10. Before any production migration: capture a managed backup, dry-run the additive migration, review RLS/grants/advisors, obtain manual approval, and document forward recovery.

### Existing foundation to audit rather than recreate

- `app/api/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/stripe.ts`
- `lib/membership/content.ts`
- `app/membership/page.tsx`
- existing `products`, `orders`, and `entitlements` usage
- `docs/daily-reading/BACKLOG.md` item DR-B001

## Priority 2 — More detailed reports

1. Inventory the existing Career and Purpose and Recovery Reflection contracts, prompts, evidence schemas, persistence, pricing, localization, print, and deletion behavior.
2. Decide the next report catalogue and release order before adding checkout products. `future_trends` exists as a reserved API value but is not currently purchasable.
3. Give every detailed report a structured BLUF, evidence-linked chapters, distinct section-specific practical applications, and appropriate visuals derived only from deterministic evidence.
4. Keep each section substantive and written in plain, confident astrological language; avoid repetitive generic applications across chapters.
5. Localize every generated field, label, visualization, print view, progress state, and failure state in the selected report language.
6. Enforce owner authorization, one-year expiry, deletion, `no-store`, `noindex`, generation timeout, retry policy, and model-output schema validation.
7. Price reports through products and entitlements rather than hard-coded UI rules, including member discounts and Premium credits.
8. Do not allow the language model to calculate or modify astronomical facts or visual coordinates; every claim and mark must retain immutable evidence IDs.

9. Add native, server-generated PDF downloads for private readings and reports; do not rely on browser printing or print-to-PDF. Track the detailed requirements as `DR-B003` in `docs/daily-reading/BACKLOG.md`.

## Priority 3 — Administration console improvements

### Membership and customer operations

- Add user search, pagination, filters, account detail, membership level, capability grants, allowance usage, credits, subscription state, and renewal dates.
- Add audited complimentary grants, revocation, and support corrections without exposing Stripe secrets or card data.
- Surface Stripe customer/subscription links for authorized operators and provide safe paths into refunds/cancellations through Stripe rather than duplicating payment controls.

### Generation operations

- Add report and daily-reading queue health, status counts, age, timeouts, failures, retry controls, model used, token/cost totals, and error classification without showing report content or birth data.
- Add configurable generation limits and cost guardrails with an audit trail.

### Content and discovery operations

- Improve journal authoring with featured-image management, preview, scheduling, localization, social-card preview, slug validation, and publication history.
- Add clear integration-health checks for GA4, Search Console verification, reCAPTCHA, sitemap/robots/`llms.txt`, and SEO/GEO defaults.
- Add overview metrics useful for operations: active memberships, conversion, churn, generation volume, failure rate, AI cost, report revenue, and entitlement liability.

### Administration safeguards

- Preserve role separation (`site_admin`, `user_admin`, `content_admin`, `analyst`).
- Require confirmation for destructive or financially meaningful actions.
- Audit all privilege, entitlement, subscription-support, model, integration, and publishing changes without secrets or private content.
- Add pagination and server-side filtering before the user base exceeds the current first-100-user view.

## Recommended execution order

1. Read this handoff, `docs/daily-reading/BACKLOG.md`, `docs/operations/administration-console.md`, `docs/architecture/trust-boundaries.md`, and `docs/legal/licensing-review.md`.
2. Audit current Stripe code, database objects, environment-variable names, webhook coverage, and test fixtures without changing production state.
3. Present the final plan/capability matrix, product catalogue, migration design, and test-mode Stripe mapping for approval.
4. Implement and verify the entitlement domain and test-mode subscription lifecycle.
5. Extend the account and admin experiences.
6. Expand the first approved detailed report end to end.
7. Run formatting, typecheck, lint, all tests, production build, dependency/security audit, licence review, ephemeris fixtures, safety evaluations, accessibility checks, and Stripe webhook tests.
8. Request the separate manual approvals required for production database migration and billing activation.

## Definition of done for the next milestone

- A new registered user deterministically receives Free capabilities.
- Personal and Premium test subscriptions grant exactly the approved capabilities and limits.
- Renewal, cancellation, failed payment, refund, webhook replay, and out-of-order events reconcile correctly.
- Usage cannot be overspent by concurrent requests.
- The account page accurately shows plan, usage, credits, renewal/cancellation state, and available actions in all four languages.
- The admin console can safely locate a user, inspect membership/usage, manage authorized grants, and diagnose generation failures with a complete audit trail.
- At least one expanded detailed report passes calculation, evidence, localization, safety, privacy, print, deletion, timeout, and entitlement tests.
- No production secret appears in the browser, repository, logs, analytics, or admin output.

## Important release boundaries

- Do not infer production-change authority from this handoff.
- Paid access must remain server-authoritative and webhook-confirmed.
- Production database changes require backup, dry-run validation, manual approval, additive migration, and forward recovery.
- Recheck every current legal, licensing, security, commerce, safety, and operations gate before enabling production billing or paid reports.
- Never use or modify the previously inspected Docker container for this project.
