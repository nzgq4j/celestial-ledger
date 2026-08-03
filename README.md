# Celestial Atlas

Celestial Atlas is a privacy-conscious browser application that calculates a Western tropical natal chart from verified birth data and then asks the OpenAI Responses API to interpret only the validated results.

> Astronomy Engine now passes the Node runtime, planetary, angle, equal-house, timezone, unknown-time, high-latitude, and motion fixtures. Production paid reports remain blocked by the identity, commerce, safety, security, and operations gates.

The hosted Supabase backend schema and password-auth integration are provisioned but do not enable paid reports. Copy `.env.example` to `.env.local` and provide the project URL and modern publishable key to use authentication locally.

## Architecture

The application uses Next.js App Router, React, TypeScript, Tailwind CSS, MIT-licensed `astronomy-engine`, `tz-lookup`, and the official OpenAI JavaScript SDK.

1. The browser collects a birth date, time, and a selected birthplace.
2. `/api/geocode` searches OpenStreetMap Nominatim, resolves latitude and longitude, and derives an IANA time-zone identifier with `tz-lookup`.
3. The browser converts the historical local wall time to UTC by matching it against the selected IANA zone. This detects repeated and nonexistent daylight-saving times and never uses the browser’s current time zone.
4. Astronomy Engine calculates geocentric true-ecliptic planetary positions in browser and Node runtimes.
5. Celestial Atlas-owned deterministic code calculates the mean North Node, longitude speed, Ascendant, Midheaven, equal houses, zodiac positions, aspects, and validation.
6. `/api/interpret` validates the chart again and sends only validated chart facts plus limited display information to the OpenAI Responses API.
7. The UI presents tables, an accessible SVG chart wheel, methodology, limitations, and the written interpretation.

## Privacy and security

- The application creates no account and has no database.
- Birth data remains in transient browser state and request memory.
- Coordinates do not appear in public result URLs.
- The application does not include analytics.
- Route handlers do not log request bodies or birth data.
- `OPENAI_API_KEY` is server-only. It must never use the `NEXT_PUBLIC_` prefix.
- OpenAI Responses requests set `store: false`.
- “Clear My Data” clears the form, resolved place, chart, and interpretation from browser state.
- Production operators should configure access logs so query strings to `/api/geocode` are not retained, or replace the GET search route with a POST route when organizational logging policy requires it.

## Calculation assumptions

- Zodiac: Western tropical.
- Validated birth-year range: 1800–2050. Expansion requires another reviewed authoritative fixture source.
- House system: equal houses beginning at the Ascendant when an exact time is known.
- Unknown birth time: local noon is used only as a reduced-date calculation anchor. Houses, ascendant, midheaven, and angle-dependent claims are omitted. The Moon is marked uncertain when its sign differs between the beginning and end of the local calendar day.
- North Node: Celestial Atlas-owned mean lunar node calculation.
- Default aspect orbs, documented in `lib/aspects.ts`:
  - Conjunction: 8°
  - Opposition: 8°
  - Trine: 7°
  - Square: 7°
  - Sextile: 5°
- Planetary coordinates use Astronomy Engine 2.1.19. Output records both the engine version and the Celestial Atlas calculation version.

## Licensing

Astronomy Engine is MIT-licensed. Its required notice is preserved in `THIRD_PARTY_NOTICES.md`. The previous AGPL Swiss Ephemeris packages have been removed from direct and transitive dependencies.

Other principal dependencies retain their respective licenses. Run `npm run licenses` before release and preserve required notices.

## Environment setup

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=your_replacement_project_key
OPENAI_MODEL=gpt-5-mini
NOMINATIM_USER_AGENT="PersonalHoroscopeApp/1.0 (your-contact@example.com)"
```

Never commit `.env.local`. `.env.example` contains names only.

## Local development

Requirements: Node.js 22 and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

The test suite covers longitude-to-zodiac conversion, degree formatting, aspect detection, angular separation and orb calculations, historical local-time conversion, ambiguous and nonexistent times, unknown-time behavior, validation failures, and API-key isolation.

`__tests__/fixtures.json` contains three fixed 00:00 UT reference fixtures transcribed from a trusted geocentric ephemeris for May 1–3, 1990. The permitted comparison tolerance is **0.2°**. Node CI executes all eleven bodies against Astronomy Engine. Authoritative Ascendant, Midheaven, and house fixtures are still required before production release.

## Production build

```bash
npm run build
npm start
```

## Vercel deployment

1. Import or link the repository as a Vercel project.
2. Add `OPENAI_API_KEY` as a sensitive environment variable for Production and Preview as appropriate.
3. Add `OPENAI_MODEL` and `NOMINATIM_USER_AGENT`.
4. Do not create any `NEXT_PUBLIC_OPENAI_API_KEY` variable.
5. Deploy with the Vercel dashboard, Git integration, or `vercel --prod`.
6. Execute the Node server gate and fixed astronomical fixtures.
7. Review Nominatim’s public-service usage policy. For sustained production traffic, use a contracted geocoding provider or self-hosted Nominatim instance.

## Error behavior

The interface distinguishes missing date/time, unresolved birthplace, ambiguous or nonexistent historical time, calculation failure, chart validation failure, OpenAI failure, and rate limiting. A failed interpretation does not remove a valid calculated chart.

## Data flow boundary

The OpenAI route receives the validated chart object, birthplace display label, date, UTC timestamp, and whether the time is known. It does not ask the model to calculate astronomy. The system prompt prohibits invented or modified placements, deterministic predictions, and medical, legal, financial, or mental-health diagnosis.
