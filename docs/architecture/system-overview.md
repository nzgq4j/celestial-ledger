# System overview

The current application is a Next.js App Router site. Nominatim resolves places, `tz-lookup` resolves IANA zones, Astronomy Engine supplies deterministic planetary coordinates, the Celestial Atlas astrology layer calculates nodes, angles, equal houses and aspects, and a Node route sends validated chart data to OpenAI.

The target architecture keeps Vercel as the application boundary, Supabase Auth/Postgres as the private-data boundary, Stripe Checkout as the payment boundary, and OpenAI as the report-language boundary. Browser calculations remain a preview only. A paid report must originate from server-authoritative calculation evidence, an authenticated owner, and a webhook-confirmed entitlement.

Target flow: birth input → server calculation → immutable evidence → checkout → verified webhook → entitlement → user-triggered queue item → worker → schema and safety validation → private report.
