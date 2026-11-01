# Celestial Atlas — Android app (Capacitor)

The Android app is a Capacitor shell that loads the live site. This folder
holds the offline fallback page (`www/`), the asset generator
(`scripts/generate-assets.mjs`), the offline-page origin sync for staging
builds (`scripts/sync-origin.mjs`) and the Play Store listing art
(`store-listing/`).

The full build, signing, Firebase, Google Play Billing, RTDN, App Links and
release runbook lives in [`docs/android/README.md`](../docs/android/README.md).

Quick start (from the repo root):

```bash
npm ci
npm run android:sync     # cap sync android
npm run android:open     # Android Studio
npm run android:bundle   # signed release AAB (needs android/keystore.properties)
```
