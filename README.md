# Celestial Ledger

Celestial Ledger is a privacy-conscious browser application that calculates a Western tropical natal chart from verified birth data and then asks the OpenAI Responses API to interpret only the validated results.

## Architecture

The application uses Next.js App Router, React, TypeScript, Tailwind CSS, `@swisseph/browser`, `tz-lookup`, and the official OpenAI JavaScript SDK.

1. The browser collects a birth date, time, and a selected birthplace.
2. `/api/geocode` searches OpenStreetMap Nominatim, resolves latitude and longitude, and derives an IANA time-zone identifier with `tz-lookup`.
3. The browser converts the historical local wall time to UTC by matching it against the selected IANA zone. This detects repeated and nonexistent daylight-saving times and never uses the browser’s current time zone.
4. `@swisseph/browser` calculates tropical planetary positions, velocity, Placidus houses, ascendant, midheaven, and house cusps.
5. Deterministic code converts longitudes to zodiac positions, assigns houses, identifies major aspects, and validates all chart values.
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
- House system: Placidus when an exact time is known.
- Unknown birth time: local noon is used only as a reduced-date calculation anchor. Houses, ascendant, midheaven, and angle-dependent claims are omitted. The Moon is marked uncertain when its sign differs between the beginning and end of the local calendar day.
- North Node: mean lunar node where supported by the selected library build; the wrapper falls back to the available node enum.
- Default aspect orbs, documented in `lib/aspects.ts`:
  - Conjunction: 8°
  - Opposition: 8°
  - Trine: 7°
  - Square: 7°
  - Sextile: 5°
- The browser package uses its built-in Moshier ephemeris unless standard Swiss Ephemeris files are explicitly loaded. Confirm the precision profile required for the intended deployment.

## Licensing warning

`@swisseph/browser` and related Swiss Ephemeris-derived packages are published under the **GNU Affero General Public License version 3 (AGPL-3.0)**. Swiss Ephemeris itself may also require a commercial/professional license for deployments that do not comply with the applicable open-source terms. Review the package license, Astrodienst licensing terms, distribution method, network-use obligations, and any commercial requirements with qualified counsel before production deployment. Do not assume that installing the npm package grants unrestricted proprietary use.

Other principal dependencies retain their respective licenses. Run `npm license-checker` or an equivalent software-composition analysis tool before release and preserve required notices.

## Environment setup

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=your_replacement_project_key
OPENAI_MODEL=gpt-5-mini
NOMINATIM_USER_AGENT="PersonalHoroscopeApp/1.0 (your-contact@example.com)"
```

Never commit `.env.local`. `.env.example` contains names only.

## Local development

Requirements: Node.js 22 or a currently supported Node.js long-term-support release, npm, and a browser with WebAssembly support.

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

`__tests__/fixtures.json` contains three fixed 00:00 UT reference fixtures transcribed from a trusted geocentric ephemeris for May 1–3, 1990. The permitted comparison tolerance is **0.2°**. A production release should run those values against the packaged WASM engine in a browser-capable integration test. The fixture metadata test ensures the acceptance set remains present even in Node-only CI.

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
6. Confirm the package’s WebAssembly asset loads in the deployed browser and execute the fixed ephemeris fixtures.
7. Review Nominatim’s public-service usage policy. For sustained production traffic, use a contracted geocoding provider or self-hosted Nominatim instance.

## Error behavior

The interface distinguishes missing date/time, unresolved birthplace, ambiguous or nonexistent historical time, geocoding failure, ephemeris initialization failure, chart validation failure, OpenAI failure, and rate limiting. A failed interpretation does not remove a valid calculated chart.

## Data flow boundary

The OpenAI route receives the validated chart object, birthplace display label, date, UTC timestamp, and whether the time is known. It does not ask the model to calculate astronomy. The system prompt prohibits invented or modified placements, deterministic predictions, and medical, legal, financial, or mental-health diagnosis.
