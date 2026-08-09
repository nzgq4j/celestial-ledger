# Generated content diversity controls

Daily readings, weekly readings, private reports, and public horoscopes use the same trigram-shingle Jaccard implementation in `lib/content-similarity/similarity.ts`. The horoscope compatibility re-export is deliberate: its established thresholds and behaviour remain unchanged.

## Two layers

1. Before generation, the server loads a bounded reader-specific history. The same-type window contains at most seven recent editions. Cross-type context covers the rolling seven calendar days ending at the requested start date plus any later dates in the requested content period. Weekly overlap uses `reading_start_date` and `reading_end_date`, not the ISO entitlement bucket. All context is sorted newest first and capped at seven items per group. The model receives compact opening, middle, and closing excerpts rather than only the beginning of each prior item. The instruction explicitly says to avoid prior syntax, examples, conclusions, metaphors, advice, and prompts while continuing to use any real evidence that remains relevant.
2. After generation, prose is checked again. Evidence IDs, calculation metadata, dates, and technical identifiers are excluded before comparison. Validation compares both the whole output and reader-facing segments of at least twelve normalized words. Segment checks prevent copied passages from being hidden by otherwise distinct long documents. Daily and weekly readings receive one bounded fresh-draft retry. A report receives two total draft attempts inside one worker claim. Horoscope batch behaviour is unchanged.

## Thresholds

- Horoscope within-edition: `0.32` (unchanged).
- Horoscope historical: `0.38` (unchanged).
- Weekly day and section prose: `0.36`.
- Report and daily-reading sections: `0.36`.
- Same-type historical prose: `0.38`.
- Cross-type prose: `0.52`, intentionally looser because a daily and weekly reading may correctly discuss the same transit.

Thresholds apply to generated prose, not immutable evidence. The weekly deterministic analysis may contain repeated evidence framing; editorial enforcement begins only after the language model writes the reader-facing copy.

## Failure handling

Similarity failures use greppable error codes. User-specific generation retries once with the validation failure named in the fresh-draft prompt. If the second draft fails, generation fails closed and nothing is persisted or consumed. A report diversity failure is recorded as non-retryable after those two draft attempts so the queue cannot silently spend more model calls on the same repetition failure; the existing account-level manual retry creates an explicit fresh attempt. Other retryable report failures retain the existing worker bookkeeping. Public horoscope publishing retains its current batch failure behaviour.

History lookup is advisory and isolated from other generation pipelines: each system reads normalized recent content through the shared lookup pattern, but no generation job waits for or invokes another system. All rows are restricted by authenticated user ID and owned birth-profile ID on the server-only Supabase client. The daily cache identity, weekly prompt version, and both private-report prompt versions advance when this context contract changes so old output is not reused under the new policy.
