# Astronomy calculation licensing review

Status: **replacement approved; notice preserved**.

The owner explicitly selected Astronomy Engine with a Celestial Atlas-owned astrology layer on 2026-08-02. `astronomy-engine` 2.1.19 declares the MIT licence. Its copyright and permission notice are preserved in `THIRD_PARTY_NOTICES.md`.

`@swisseph/browser` and `@swisseph/core` are no longer present in `package.json` or `package-lock.json`. The Node runtime, planetary, USNO-backed angle, equal-house, historical-timezone, and high-latitude fixtures pass for the documented 1800–2050 range. This closes the former Swiss runtime/licensing gate.
