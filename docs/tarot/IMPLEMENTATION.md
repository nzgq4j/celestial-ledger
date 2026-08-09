# Tarot reading implementation

## Product shape

Tarot is a symbolic reflection experience, not a prediction system. The launch
flow has four stages: deck, spread, shuffle, and reading. It reuses the
prototype's complete 78-card structure, five spreads, no-replacement draw,
independent upright/reversed orientation, narrative combination, and three-part
shuffle motion. It does not reuse the prototype runtime, fonts, colour systems,
or placeholder art.

Reading results have an art-independent symbolic face fallback in the
Traditional deck language: gold-on-burgundy framing, Roman-numeral or court
rank corner indices, a geometric seal for Major Arcana, and CSS-drawn wand,
chalice, blade, or pentacle-star motifs for Minor Arcana. The fallback does not
load remote imagery and remains available if card-specific face art is absent
or fails to load.

The approved access model has two independent axes:

- Spread access: Daily Draw is Free. Past, Present & Future and Love Reading
  have a Personal minimum. Celtic Cross and Life & Love Grand Spread require
  Premium.
- Deck access: one default deck is Free, one custom deck is Personal, and four
  custom decks are Premium. The five prototype decks are seeded inactive:
  Traditional is Free, Whimsical Cats is Personal, and Silver Age, Neon
  Circuit, and Provençal are Premium. The sixth Premium Canva/Hockney record is
  created after its final name and translated tagline are supplied.
- Locked decks remain visible with a clear membership action.

`TAROT_READING_ENABLED` defaults to `false`. The page, navigation, and draw API
remain unavailable until the database, complete deck catalogue, artwork, and
release checks are ready.

## Content and safety

- The language model is not part of the tarot flow.
- Draws are generated on the server with cryptographic randomness and without
  replacement. The browser never chooses cards or orientation.
- Card copy uses reflective, agency-preserving language. It does not claim to
  predict events, diagnose a person, or know a third party's thoughts.
- The Death card is framed explicitly as symbolic transition. The Devil card
  states that the reflection is not a diagnosis and preserves agency.
- The interface carries an explicit symbolic-reflection disclaimer at the
  beginning and in the result.
- UI copy, spread labels, positions, card names, and all 78 upright/reversed
  meanings are available in en-GB, es-ES, fr-FR, and de-DE.

## Artwork and storage

Deck art is proprietary and uses a private `tarot-decks` Supabase Storage
bucket. Database rows store stable object paths, never signed URLs. The server
issues 15-minute signed URLs:

- active deck covers are signed for the selection screen, including locked
  decks because locked decks are intentionally visible;
- card backs are signed only when the current plan meets the deck minimum;
- draw requests recheck both the deck and spread entitlement on the server.

Only site and content administrators can upload. Accepted inputs are JPEG,
PNG, WebP, and AVIF up to 4 MB. Cover images must be portrait at approximately
3:4 and at least 750 by 1000 pixels. Card backs must be approximately 5:8 and at
least 750 by 1200 pixels. The server checks decoded format, dimensions, aspect,
and pixel count, then removes metadata, resizes, and converts to WebP.

Every replacement overwrites one of two stable paths:

- `{deck-id}/cover.webp`
- `{deck-id}/card-back.webp`

Changing source formats therefore cannot leave old extension-based objects
behind. A first-upload database failure removes the newly written object.

## Database release runbook

Migration: `20260809110121_add_tarot_decks.sql`

Before applying to production:

1. Confirm the production project has a current recoverable backup and record
   its time.
2. Validate the SQL inside a transaction with `ROLLBACK`, including the table
   constraints, private bucket, grants, and RLS state.
3. Obtain explicit production migration approval.
4. Apply the additive migration.
5. Run Supabase security and performance advisors.
6. Verify the table is not available to anon/authenticated roles and the bucket
   is private.
7. Confirm the five seeded records, then create the sixth Premium Canva/Hockney
   record in the admin console with all localized metadata.
8. Upload both images for each deck and activate only complete records.
9. Verify Free, Personal, and Premium access before enabling the feature flag.

Forward recovery keeps the feature flag off while correcting rows, policies,
or bucket configuration in another additive migration. Because the feature is
off by default and the new table has no dependency from existing product data,
the existing application remains operational throughout.

If an emergency rollback is explicitly approved, first disable
`TAROT_READING_ENABLED`, then remove the private bucket objects and bucket, and
finally drop `public.tarot_decks`. This loses only tarot catalogue/artwork data;
it does not touch users, subscriptions, reports, charts, or astrology evidence.
