# Astronomy calculation licensing review

Status: **replacement approved; notice preserved**.

The owner explicitly selected Astronomy Engine with a Celestial Atlas-owned astrology layer on 2026-08-02. `astronomy-engine` 2.1.19 declares the MIT licence. Its copyright and permission notice are preserved in `THIRD_PARTY_NOTICES.md`.

`@swisseph/browser` and `@swisseph/core` are no longer present in `package.json` or `package-lock.json`. The Node runtime, planetary, USNO-backed angle, equal-house, historical-timezone, and high-latitude fixtures pass for the documented 1800–2050 range. This closes the former Swiss runtime/licensing gate.

## Celestial Atlas Android app (`celestial-atlas/`)

On 2026-11-24 the owner stated that the legal review is complete with no issues and approved building the Atlas+ paywall and premium Atlas Report in the Android app. This entry records that statement; the review itself is held by the owner and is not reproduced in this repository.

Third-party components added for the Android app and their licences are listed in `celestial-atlas/THIRD_PARTY_NOTICES.md`: `astronomy-engine` (MIT), `luxon` (MIT), GeoNames city data (CC BY 4.0, attribution shown in the app), and the bundled Cormorant Garamond, Work Sans, Noto Sans Symbols and Noto Sans Symbols 2 fonts (SIL Open Font License 1.1).
