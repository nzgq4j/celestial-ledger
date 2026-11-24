# Claude Code — Initial Prompt: Celestial Atlas → Android (Capacitor)

Paste everything below the line into Claude Code from the root of the unzipped project.

---

You are taking over **Celestial Atlas**, a tarot, numerology and astrology app prototyped as HTML design files. Your job is to turn it into a production-quality **Android app using Capacitor**, with a React + Vite + TypeScript web layer.

## What's in this folder

| File | What it is | How to use it |
|---|---|---|
| `Celestial Atlas.dc.html` | Main app prototype (design reference). Template markup + a `class Component` logic block in a `<script data-dc-script>` tag | **Read for UI, copy, flows and state logic.** Don't ship it. It needs a proprietary runtime (`support.js`) that isn't available outside the design tool |
| `Tarot Reading.dc.html` | Tarot flow prototype: 5 decks, 5 spreads, shuffle animation, results | Same: reference only. Port it to React |
| `Celestial Atlas Android.dc.html` | 3-up Android mockup of the app | Visual reference for mobile layout |
| `atlas.js` | **Pure ES module engine**: astronomy (Sun, Moon, Mercury–Saturn, Ascendant, MC, moon phase, retrogrades), Pythagorean numerology, horoscope text generator, compatibility, Atlas Report | **Reuse as-is.** Convert to `atlas.ts` with types; keep the logic and copy identical |
| `tarotData.js` | 78-card meaning library (upright/reversed) | Reuse as-is → `tarotData.ts` |
| `cards/major-1.png … major-20.png` | Traditional deck art for Major Arcana I–XX | Move to `src/assets/cards/`; the other cards use symbolic faces |
| `uploads/` | Source images the user provided | Reference only |
| `image-slot.js`, `android-frame.jsx`, `support.js` | Design-tool scaffolding | **Ignore** |

## Target stack
- Vite + React 18 + TypeScript, plain CSS modules or vanilla-extract (no Tailwind unless you ask first)
- Capacitor 6: `@capacitor/core`, `@capacitor/android`
- Plugins: `@capacitor/preferences` (replace all `localStorage`), `@capacitor/local-notifications` (daily insight), `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/haptics` (card draw / save)
- React Router (or simple state router) for tabs: Today, Stars, Numbers, Tarot, Journal, plus Profile, Report, Onboarding
- Unit tests with Vitest for `atlas.ts` (numerology and astronomy)

## Design system (lift exact values from the prototype)
- Background `#0a1128`, panel `rgba(17,28,61,0.78)`, hairline `rgba(201,163,90,0.28)`
- Gold `#c9a35a`, bright gold `#e3c27e`, ink `#efe6d2`, muted `#aeb6cc`, dim `#8d96b3`
- Fonts: **Cormorant Garamond** (display), **Work Sans** (UI), **Noto Sans Symbols / Symbols 2** (zodiac and planet glyphs; append U+FE0E so they never render as emoji). Bundle the fonts locally, with no Google Fonts CDN at runtime
- Eyebrow labels: 11px, 0.18em tracking, uppercase, gold, 600
- Radii 3–6px, thin gold linework, slow-rotating star-chart rings in the background, twinkling stars
- Mobile layout = the prototype's narrow mode: sticky top bar + 5-item bottom tab bar (min 52px targets). Respect Android safe areas and the gesture-nav inset

## Features to port (parity with prototype)
1. **Splash**: animated astrolabe rings, pulsing core, "Charting your sky…". Use the native Capacitor splash for cold start (static navy + gold mark), then the animated web splash for about 1.5s while the engine loads
2. **Onboarding**, 3 steps: full birth name → date + time (or "unknown") → birthplace city + DST toggle. Persist the profile with Preferences
3. **Today**: push-style insight card, Big Three, daily horoscope summary, moon phase visual, personal year/month/day, card of the day (art for Majors I–XX), Atlas Report CTA
4. **Stars**: Horoscope (daily/weekly/monthly; monthly is premium), 12-sign picker, ratings, lucky number
   - **Birth chart**: SVG wheel (zodiac ring with element tints, degree ticks, equal houses from AC, AC/MC axes, planet glyphs with collision spreading, aspect lines). Render the wheel **in React SVG with real `<text>` nodes**; the prototype's HTML label overlay was a design-tool workaround. Also needs an element/modality balance, aspect list and a placements list. Planets beyond Sun/Moon are premium
   - Transits & moon, Sign compatibility
5. **Numbers**: Life Path, Expression, Soul Urge, Personality, Birthday (detail panel); cycles; Life Path compatibility
6. **Tarot**: full port of `Tarot Reading.dc.html` (5 themed decks with their palettes, 5 spreads up to the 14-card Grand Spread, reversals, flip and shuffle animations, positional meanings plus narrative)
7. **Journal**: save from any reading; expand and delete; stored in Preferences (consider SQLite via `@capacitor-community/sqlite` if entries exceed about 500)
8. **Atlas Report** (premium): `report()` from atlas.js, plus 3 cards
9. **Atlas+ paywall**: yearly $39.99 / monthly $6.99, 7-day trial. For v1, stub it behind an interface `BillingService`. Leave a TODO to wire **Google Play Billing** (e.g. RevenueCat `@revenuecat/purchases-capacitor`)
10. **Daily insight notification**: schedule a local notification each morning (user-configurable time, toggle in Profile). The body is the Personal Day + Moon sign text from the engine

## Known prototype limitations to improve
- Birthplace is a 21-city list with a manual DST toggle. Replace it with a searchable city list (bundle a GeoNames cities15000 subset as JSON) and compute historical UTC offsets with `luxon` + IANA time zones, so DST is automatic
- Astronomy is low-precision (about 1°). Fine for v1. Leave the interface so it can swap to `astronomy-engine` later, and add Uranus, Neptune and Pluto if you do
- Horoscope copy is template-generated and seeded per sign/period, so it's deterministic. Keep that behavior

## Steps — do these in order and stop for my review after step 3
1. Read every file listed above. Summarize the screens, state and data flow you found
2. Scaffold: `npm create vite@latest celestial-atlas -- --template react-ts`, add Capacitor (`npx cap init "Celestial Atlas" com.celestialatlas.app --web-dir dist`), `npx cap add android`
3. Port `atlas.js` → `src/engine/atlas.ts` and `tarotData.js` → `src/engine/tarotData.ts` with types. Write Vitest tests: Life Path for 1991-07-28 = 1, master-number handling (11/22/33), Sun sign boundaries, moon phase sanity
4. Build the design tokens, fonts, app shell (top bar + bottom tabs + safe areas), splash, onboarding
5. Port screens in this order: Today → Stars (incl. chart wheel) → Numbers → Tarot → Journal → Report → Profile → Paywall
6. Native: splash-screen config, status bar (dark content on `#0a1128`), Android back button handling (close modal → pop tab → exit), local notifications, haptics
7. App icon and adaptive icon (navy background, gold astrolabe mark), `versionCode 1`, `minSdk 23`, `targetSdk` latest
8. `npm run build && npx cap sync android`, then give me the commands to run on a device and build a signed AAB

## Rules
- Match the prototype's copy word for word unless I approve changes. The tone is plain, modern and practical
- No emoji anywhere. Use only text glyphs with U+FE0E
- Accessibility: 4.5:1 text contrast, 44px+ hit targets, labelled controls, respect reduced-motion (disable spin and twinkle)
- Keep everything offline-capable. No network calls except billing
