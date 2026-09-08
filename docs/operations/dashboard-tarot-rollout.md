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

## Face-down spread follow-up (2026-09-07)

All drawn positions now appear together as card backs. Selecting a card reveals its face and reflection; revealed faces remain visible when selecting another card. The draw and saved payload are unchanged. A ten-card interaction test verifies initial concealment, persistent reveals, reflection switching, and a single draw request. Desktop uses a side panel; mobile wraps the cards above the reflection.

Card readability follow-up: spread columns now target at least 12rem instead of 6rem; artwork can grow to 18rem with its original 5:8 proportions. Phones use two columns. The selected reflection includes a larger card face, and the desktop panel remains available while scrolling the spread.

Spread geometry follow-up: the narrative is expanded initially and remains collapsible. Celtic Cross keeps Present and the horizontal Challenge at the centre, Foundation below, Recent Past left, Possible Direction above, Near-Term Focus right; staff positions 7–10 run bottom to top. Numbering and saved meanings remain unchanged. PPF is a horizontal timeline; Love is a custom connection-centred cross; Grand is grouped by context, love, practical life, and guidance. Small screens pan the spread horizontally rather than changing its spatial meaning or shrinking the cards. Reference: https://celesties.org/tarot/spreads/celtic-cross

Local rebuild for review: the spread uses the full width and the selected card opens in a native modal dialog. Escape and Return to spread close the modal and restore focus. Celtic Cross has an isolated stacking context, consistent card sizes, twelve explicit rows, and responsive geometry that fits without sideways panning. Browser checks at desktop and 390px confirmed no page overflow and separation between staff cards. The user approved this rebuild for production after reviewing the local preview. Local sample preview: http://127.0.0.1:3115 (sample symbolic cards, no private data or draw requests).

Design review adjustment: Present and Challenge are now side by side, upright, with both position labels visible. This intentionally replaces the traditional central overlap at the user's request. Desktop browser verification confirmed aligned cards with a positive gap and no page overflow. Approved for production with the reviewed rebuild.

View selection review: rows and columns are the default. Desktop offers Traditional view with a note that scrolling may be needed. At 720px and below the toggle is hidden and every spread uses two columns with automatic placement, including after resizing from an active traditional layout. Verified at 390px: control hidden, all ten positions automatic, no horizontal overflow. Approved for production after local review.

Shared headspace correction (2026-09-08): public page shells now start with 1–1.75rem top padding. Shared introductory panels size to their content instead of reserving 17–27rem, with 1.25–2rem padding and vertically centred contents. Applies to horoscope index/detail, report collection, samples, weekly offer, method, membership, journal, contact, and sample daily reading. Existing compact tarot spacing is retained. Desktop baseline at 1280px: horoscope top padding 89.6px, hero 432px, first horoscope row at 764.7px.
