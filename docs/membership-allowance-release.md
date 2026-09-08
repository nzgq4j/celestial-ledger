# Membership allowance alignment — 8 September 2026

Status: implemented locally; production migration and deployment pending manual approval.

## Behavior

- Saved active charts: Free 1, Personal 2, Premium 5. An atomic database trigger covers direct saves, interpreted-chart saves and pending-chart claims. Existing charts above a downgraded allowance remain accessible; new saves wait until space is available. Expired charts do not occupy a slot. Administrators and explicit grants retain access.
- Daily readings: Free 1 per UTC week, Personal 10 per billing period shared across charts, Premium 1 per UTC day for the oldest active chart plus 10 per billing period shared across companion charts. Weekly boundaries are Monday midnight UTC. Access without a current billing period uses calendar months. Existing weekly-reading behavior is unchanged.
- The server reserves an allowance before calculation/generation. Requests for the same reading cannot run simultaneously. Failed saves release their reservation; crashed requests have a ten-minute lease. Saving and committing usage are atomic. Cached readings do not consume another allowance. Deleting a saved reading does not replenish usage. Previously generated readings are not charged retrospectively.
- The dashboard displays remaining allowance and reset time for the selected chart. Cached links match the selected chart and language. Exhausted allowances disable new generation while saved readings remain accessible.
- Membership copy in all four languages includes the five tarot spreads and removes unavailable email delivery and credit-pack sales. Personal report pricing remains 10% off. Premium Career and Recovery reports remain included.
- Obsolete Premium discount/quarterly-credit capabilities are marked retired with zero allowance, and obsolete Premium paid report prices become inactive. Invoice recording remains idempotent, without new quarterly credit issuance. Previously earned credits, payment history, purchased entitlements and private reports are preserved.

## Database release

Migration: `supabase/migrations/20260908074857_enforce_membership_allowances.sql`.

This adds a private usage ledger, service-role-only RPCs, and quota triggers. It replaces the invoice recorder and updates only obsolete Premium catalog settings. It does not modify birth data or existing readings. RLS and explicit privilege revocations prevent browser roles from accessing the reservation ledger or calling the quota RPCs. Usage metadata is deleted when its account is deleted.

A targeted pre-migration backup of every existing function/configuration changed by this migration is stored locally at `outputs/membership-pre-migration-backup.json`, captured through the Supabase MCP. It contains Premium capability/price rows and the complete original invoice function definition; no birth data was exported. Re-capture this backup immediately before applying the migration if production configuration has changed.

The migration is dry-run against isolated PostgreSQL using PGlite in `__tests__/membership-allowances.test.ts`. The test suite uses actual supporting table migrations plus minimal auth/chart fixtures. It tests limits, resets, ownership, expiry, grants, browser privileges, idempotency, failure recovery, deletion accounting, and compatibility with the previous API. PGlite is single-connection, so the per-account PostgreSQL advisory locks are reviewed rather than tested using simultaneous database sessions. No Docker container or production test accounts are used.

After manual approval:

1. Apply the migration through Supabase MCP to project `jyguyvpbstskpuwqwrok`.
2. Read back the function privileges, triggers, retired catalog configuration and reservation-table RLS. Run Supabase security advisors. Do not log private account contents.
3. Push the tested main commit. Use the Vercel MCP to confirm the resulting production deployment is READY and matches the commit. The save trigger supports the previous API during rollout, enforcing the same allowance atomically at save time.
4. Check the live membership page in each language and the account reading controls. Ask the owner to test with a non-administrator account: Free's second chart/reading must be blocked, saved readings must reopen, and the reset/remaining display must update. Administrator accounts intentionally bypass normal quotas.

## Forward recovery

If application verification fails, roll the application back to the previous deployment while retaining the additive schema. The compatibility trigger allows the previous daily-reading API to save under the same quota. Preserve reservations and completed usage so a deployment rollback cannot grant extra readings.

If database behavior requires correction, apply a focused follow-up migration to the affected function/trigger; do not drop the ledger, delete user content, or revoke existing credits. The backed-up invoice function and Premium catalog rows allow the prior commercial settings to be restored explicitly if the owner requests it. Re-enabling quarterly credits requires a deliberate commercial decision, not an automatic app rollback.

Local authenticated browser verification is unavailable because the workspace lacks Supabase public configuration. Production account verification must follow migration/deployment; database and API tests run independently of those credentials.

## Validation results

All 313 tests in 58 files passed, including 13 PostgreSQL quota cases, five API cases and two new interface cases. Typecheck, lint, build, formatting, license review, server ephemeris gate and the existing safety/accessibility tests passed. Dependency audit found zero vulnerabilities.

The pre-change Supabase security advisor reports existing service-only tables with RLS and no client policies (intentional) and the existing [disabled leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). This migration does not change Auth configuration. Re-run advisors after applying it.
