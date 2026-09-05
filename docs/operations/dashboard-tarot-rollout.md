# Dashboard and tarot rollout — 5 September 2026

The owner authorized implementation on main and full access to make the approved dashboard/tarot plan happen in this task. Production baseline: a7a31dc. The former local main is preserved at codex/dashboard-pre-update-20260905; its build cache is in a named Git stash.

## Interface

Account destinations use explicit `view` parameters, with old fragment links forwarded to the corresponding destination. Overview shows actual access, recent available work and a getting-started guide. Library keeps saved ownership separate from new-generation access. Administrator Premium access is identified separately from the billing plan.

Tarot transitions focus and scroll to the active heading. Available spreads appear first, shuffle has an explicit action, and results use an indexed card reader. Deck IDs passed from the dashboard are checked against the active catalogue and effective plan.

## Additive private tarot migration

Migration: `20260905194223_private_tarot_readings.sql`, matching the version recorded by the Supabase MCP. No existing tables, rows, grants, or storage objects are modified. A scoped pre-change backup of existing tarot deck configuration, card-face metadata, columns and policies is stored in ignored `outputs/tarot-backup-20260905.json`. This is a logical backup of the affected tarot subsystem, not a full database or storage-object backup; existing artwork objects are unchanged.

Dry run: migration applied in a transaction, inserted a temporary reading for an existing owner, verified owner read/delete and cross-owner read/delete denial, then rolled back. Verified the new table did not exist after rollback. The owner's explicit instruction to implement private tarot saving with full access is the manual authorization for this additive change.

Server-created snapshots preserve card identity, orientation, meanings, locale and content version. Signed image URLs are not persisted. Private reads enforce owner and expiry; deletes enforce owner. Browser clients receive no insert/update grant. Authentication-user deletion cascades to readings. Expired snapshots are not readable and remain deletable by the owner through the authenticated API.

Forward recovery: revert the application saving/reading integration if necessary while leaving the additive table in place. Keep existing snapshots; repair and redeploy forward. Do not drop the table or change existing data as a rollback. A failed save must still return the drawn reading with an explicit unsaved notice, preventing an accidental redraw being presented as the original.

## Verification and user test

Check desktop/mobile deck → spread → shuffle → result, keyboard focus, long spreads, locked choices, failures, and dashboard shortcut selection. Check account view navigation and legacy links, library visibility after saving, refresh/reopen, expiry, and deletion confirmation. Run format, typecheck, lint, unit/integration tests, build, audit, license review, ephemeris, safety and accessibility checks. Do not enable additional paid features or change calculation rules.

Release f86d274 deployed successfully through the existing GitHub-main integration; confirmed READY using the Vercel MCP. Live guest deck → spread → shuffle → result passed. At 390×844, the shuffle heading begins at y=96 and the full primary action ends at y=562, with no horizontal overflow. Keyboard focus follows the active heading. Signed-in saving/reopen/delete remains a user acceptance check because the test browser has no existing account session.

Format, typecheck, lint, build, all 292 unit/integration tests (including safety and workflow focus checks), production dependency audit (zero vulnerabilities), license review, and ephemeris gate passed. Supabase verified RLS enabled, no anonymous read, and no authenticated insert/update on the new table. Security advisors reported no new tarot-table finding; the existing project warning for disabled leaked-password protection remains outside this change.

The daily generator currently grants access by authenticated account; it does not consume the marketing catalogue's daily quota. The dashboard therefore says account-included instead of presenting a misleading remaining count. Weekly remaining allowance comes from the same capability and primary-chart week boundary used by generation. No calculation or commerce flags were changed.
