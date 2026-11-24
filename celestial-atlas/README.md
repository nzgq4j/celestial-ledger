# Celestial Atlas (Android, Capacitor)

The Celestial Atlas Android app: a Vite + React 18 + TypeScript web layer packaged with Capacitor 6. It is a port of the HTML prototype in `../UPDATE/`; see `../UPDATE/CLAUDE_CODE_PROMPT.md` for the full brief.

This app is separate from the Next.js web application at the repository root. The root lint, typecheck and format checks exclude this folder; run its checks from here.

## Status

| Step | Scope | State |
|---|---|---|
| 1 | Review prototype files | Done |
| 2 | Scaffold Vite + Capacitor, add Android | Done |
| 3 | Port `atlas.js` and `tarotData.js` to typed TypeScript, Vitest tests | Done |
| 4–8 | Design system, screens, native features, icons, release build | Not started |

## Commands

```bash
npm install
npm test           # Vitest: engine tests and prototype parity tests
npm run typecheck  # tsc -b (strict)
npm run lint       # oxlint
npm run build      # tsc -b && vite build
npx cap sync android
```

## Engine

- `src/engine/atlas.ts`: astronomy (Sun, Moon, Mercury to Saturn, Ascendant, Midheaven, moon phase, retrogrades), Pythagorean numerology, seeded horoscope text, compatibility and the Atlas Report. Logic and copy match the prototype exactly.
- `src/engine/tarotData.ts`: the 78-card meaning library, generated from the prototype data without content changes.

Differences from the prototype file, none of which change output:

- Types for every export.
- Astronomy functions sit behind an `Ephemeris` interface (`lowPrecisionEphemeris` is the default; `setEphemeris()` swaps it) so a higher-precision engine such as `astronomy-engine` can replace it later.
- `sky()` and `report()` accept an optional date (defaulting to now) so they can be tested at fixed instants.
- `birthJD`, `reduce` and `rng` are exported for testing.

Positions are low precision, about 1 degree. The birthplace list is still the prototype's 21 cities with a manual DST flag; the brief replaces it with a bundled GeoNames list and `luxon` time-zone handling in a later step.

## Tests

- `src/engine/atlas.test.ts`: Life Path for 1991-07-28 is 1; master numbers 11, 22 and 33; Sun sign boundaries across the 2024 equinox and solstices; unknown birth time omits rising and Midheaven; moon phase checks against January to February 2024 phases; determinism; tarot library shape.
- `tests/parity.test.ts`: runs the TypeScript port and the prototype `../UPDATE/atlas.js` on the same inputs and requires identical output. It is skipped if `../UPDATE/` is removed.

## Toolchain notes

- TypeScript is pinned to 5.9. The Capacitor 6 CLI reads `capacitor.config.ts` through the TypeScript 5 compiler API, which TypeScript 7 removed.
- `npm audit` reports advisories in `tar`, `glob`, `minimatch` and `rimraf`, all pulled in by `@capacitor/cli` 6. It is a development-only tool and is not shipped in the app; `npm audit --omit=dev` is clean. Clearing them requires a Capacitor CLI major upgrade.
- Android currently uses the Capacitor 6 defaults (`minSdk 22`, `targetSdk 34`). Step 7 sets `minSdk 23` and the target SDK.
