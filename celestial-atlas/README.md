# Celestial Atlas (Android, Capacitor)

The Celestial Atlas Android app: a Vite + React 18 + TypeScript web layer packaged with Capacitor 8. It ports the HTML prototype in `../UPDATE/` (brief: `../UPDATE/CLAUDE_CODE_PROMPT.md`).

This app is separate from the Next.js web application at the repository root. The root lint, typecheck and format checks exclude this folder; run its checks from here.

## Status

| Step | Scope | State |
|---|---|---|
| 1–3 | Prototype review, scaffold, engine port with tests | Done |
| 4 | Design tokens, bundled fonts, shell, splash, onboarding | Done |
| 5 | Today, Stars (with chart wheel), Numbers, Tarot, Journal, Report, Profile, Paywall | Done |
| 6 | Splash, status bar, back button, local notifications, haptics, Preferences storage | Done; not yet run on a device |
| 7 | Icons, adaptive icon, `versionCode 1`, `minSdk 24`, `targetSdk 37` | Done |
| 8 | Build and sync | Debug APK, release APK and release AAB build with Gradle (unsigned until a keystore is configured) |

Copy changes from the prototype (outer planets, "8 more placements", "Mercury through Pluto", the astronomy-engine footnote, uncertain-Moon and birth-time messages, the time-zone line, tarot "Save to journal", the reset confirmation and the GeoNames credit) were approved by the owner on 2026-11-24.

## Commands

```bash
npm install
npm test            # Vitest: engine, golden fixtures, time zones, records, parity, contrast, notifications
npm run typecheck   # tsc -b (strict)
npm run lint        # oxlint
npm run build       # tsc -b && vite build
npx cap sync android
```

Browser smoke and accessibility test (Playwright with axe, every screen):

```bash
npm run build && npx vite preview --port 4173
```

```bash
npm run e2e -- e2e/out
```

Regenerate data and native assets:

```bash
npm run build:cities -- /path/to/geonames-dump
```

```bash
node scripts/generate-android-assets.mjs
```

## Running on a device and building a signed AAB

Requirements: Node 22+, Android Studio (or the Android SDK command-line tools) with SDK Platform 37, JDK 21, and a device with USB debugging enabled.

```bash
npm ci && npm run build && npx cap sync android
```

```bash
npx cap run android
```

Create an upload key once and keep it safe; Google Play App Signing manages the app signing key:

```bash
keytool -genkeypair -v -keystore celestial-atlas-release.jks -alias atlas -keyalg RSA -keysize 4096 -validity 10000
```

Copy `android/keystore.properties.example` to `android/keystore.properties` (git-ignored) and fill in the passwords, then:

```bash
cd android && ./gradlew bundleRelease
```

The bundle is written to `android/app/build/outputs/bundle/release/app-release.aab`.

## Engine

- `src/engine/ephemeris.ts`: positions from astronomy-engine 2.1.19 (Sun through Pluto), Ascendant and Midheaven, using the same method as the web engine. Checked against the repository's Astrodienst-compatible and USNO golden fixtures (`../__tests__/fixtures.json`, `../__tests__/angle-fixtures.json`).
- `src/engine/time.ts`: local birth time to UTC with luxon and IANA time zones. Detects times that occurred twice (clocks went back) and asks which one, and rejects times that did not exist (clocks went forward).
- `src/engine/places.ts` and `src/data/cities.json`: 34,244 GeoNames cities (population 15,000+) with time zones, loaded only when the birthplace search opens.
- `src/engine/records.ts`: calculation records and evidence IDs (below).
- `src/engine/atlas.ts`: numerology, seeded horoscope text, compatibility and the Atlas Report. Reading logic and copy match the prototype; `tests/parity.test.ts` checks this against `../UPDATE/atlas.js`.

### Calculation records and evidence

Every chart, sky reading, numerology calculation and card draw produces a record with the engine, engine version, zodiac (tropical), house system (equal, or none without a birth time), node type (not calculated), time zone, local and UTC time, UTC offset, coordinates, GeoNames ID and data version, and calculation version (`celestial-atlas-android-v1`). Each calculated fact (position, angle, house cusp, aspect, number, cycle, moon phase, card) gets an evidence ID derived from its content and its record. Report sections list the evidence they rest on; chart marks and screen values carry `data-evidence` attributes; journal entries keep the records and evidence they were saved from. Screens show the records under "How this was calculated".

### Unknown birth time

Houses, Ascendant, Midheaven and Moon aspects are left out. The Moon's degree is not shown, and when the Moon changed sign during the birth date its sign is shown as both possibilities and it is left out of the wheel, the element balance and the report.

## Native

- `capacitor.config.ts`: native splash held until React renders, then a 1.5 s animated web splash; navy status bar with light text.
- Edge to edge: Capacitor 8's built-in SystemBars passes the status bar, cutout and gesture bar insets to CSS (`insetsHandling: 'css'`); the top bar, tab bar, onboarding and dialogs pad themselves with `env(safe-area-inset-*)`.
- Back button: closes the paywall, then steps back through visited tabs, then exits.
- Daily insight: the next 14 mornings are scheduled at the chosen time with that day's Personal Day and Moon sign, and rescheduled when the app opens. They use inexact alarms (`isExactNotification: false`), so `SCHEDULE_EXACT_ALARM`, which the plugin would add and Google Play restricts, is removed from the manifest.
- Backups are off (`allowBackup="false"` and data extraction rules) so birth data stays on the device.
- `BillingService` (`src/platform/billing.ts`) is a stub that grants Atlas+ locally with no payment. Google Play Billing (for example RevenueCat) must replace it before release.

## Toolchain notes

- Capacitor 8.6.2 (upgraded from the brief's Capacitor 6 to target SDK 37). Capacitor 8 requires Android 7.0, so the minimum SDK is 24 rather than the brief's 23.
- Target and compile SDK 37 with Android Gradle Plugin 8.13.2 and Gradle 8.14.3. Gradle warns "We recommend using a newer Android Gradle plugin to use compile SDK version 37.0": official SDK 37 support starts with AGP 9, which Capacitor 8 and its plugins cannot use yet (they still use `lintOptions`). Capacitor 9 (release candidate at the time of writing) moves to AGP 9 and SDK 37 with a minimum SDK of 26.
- TypeScript is pinned to 5.9; the Capacitor CLI reads `capacitor.config.ts` through the TypeScript 5 compiler API.
- `npm audit` is clean, including development dependencies.
- Journal entries live in Preferences. Above about 500 entries (`JOURNAL_SOFT_LIMIT`), consider `@capacitor-community/sqlite`.
