# Weekly reading domain model

`WeeklyReadingAnalysis` owns a request-day seven-date window, time zone, locale, birth-time status, seven validated daily analyses, an immutable evidence union, ranked themes, seven day-emphasis records, method provenance, and limitations. `WeeklyReadingContent` is a validated projection and cannot change astronomical facts.

- Owner: authenticated Supabase user.
- Subject: oldest active owned birth profile, the v1 primary-chart convention.
- Reading period: the profile-local request date through the sixth following calendar date, inclusive.
- Usage period: ISO Monday 00:00 UTC through the next Monday for entitlement accounting.
- Status: `completed` or `failed`; synchronous v1 writes only validated completed rows.
- Retention: one year maximum plus owner deletion.
- Capability: `weekly_reading.primary`, one per week for Personal and Premium.
- Rollout: disabled unless `WEEKLY_READING_GENERATION_ENABLED=true`.

Analysis, content, method, rule, prompt, calculation, and ephemeris versions are stored independently. Historical content is never silently regenerated after a rule change.
