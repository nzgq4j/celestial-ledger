# Push notifications

Celestial Atlas sends two kinds of push notification:

- **Daily insight:** the reader's Personal Day and the Moon sign at the time
  they choose, in their language.
- **Announcements:** occasional news that you send to every device with
  notifications on.

## How it works

- **Who writes the insight text:** the app. When notifications are on, it
  composes the next 14 days of daily insights on the device. It uploads them
  with their send times to `POST /api/push/device`, together with the device's
  push address. No birth data reaches the server. The app refreshes the upload
  each time it opens.
- **Delivery:** `/api/internal/push-dispatch` (Vercel Cron, every 10 minutes)
  sends due messages.
  - The Android app uses Firebase Cloud Messaging.
  - The website and the iPhone home-screen app use Web Push. Web Push is
    implemented in `lib/push/webpush.ts` using only `node:crypto`, and is
    tested against the RFC 8291 example.
- **Retention:** sent messages are deleted after two days. Devices not seen for
  60 days are removed by `/api/internal/purge-journal`. Turning notifications
  off deletes the device's address and messages at once.
- **Fallback:** without push, the Android app falls back to scheduling the
  insight on the device. This applies to builds made without Firebase and to
  devices where push registration fails.
- **iPhone:** Safari offers notifications only to the site added to the Home
  Screen (iOS 16.4 or later). Profile explains this to iPhone readers.

## Setup

Production changes need the owner's approval (see `AGENTS.md`).

1. **Database.** Apply `supabase/migrations/20261125120000_atlas_push.sql`. It
   is additive and creates three server-only tables and a cleanup function.
2. **Web Push keys.** Run `node scripts/generate-vapid-keys.mjs`, then set these
   in Vercel (Production):
   - `WEB_PUSH_VAPID_PUBLIC_KEY` and `WEB_PUSH_VAPID_PRIVATE_KEY`.
   - `WEB_PUSH_SUBJECT`: a contact address, for example
     `mailto:support@celestialatlas.app`.
   - `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`: the same public key. The app build reads
     it, and the private key never leaves the server.
3. **Firebase (Android).**
   1. In the Firebase console, add an Android app with package
      `com.celestialatlas.app`.
   2. Add the SHA-256 fingerprints of the upload key and of the Play app signing
      key.
   3. Download `google-services.json` to
      `celestial-atlas/android/app/google-services.json`. It is git-ignored.
   4. In Google Cloud, create a service account with the role **Firebase Cloud
      Messaging API Admin**, and enable the "Firebase Cloud Messaging API (V1)".
   5. Store the service account's JSON key in Vercel as
      `FIREBASE_SERVICE_ACCOUNT_JSON`. Set `FIREBASE_PROJECT_ID` only if it
      differs from the key's `project_id`.
   6. Build the Android app with `VITE_ANDROID_PUSH=true`:
      ```bash
      cd celestial-atlas
      VITE_ANDROID_PUSH=true npm run build && npx cap sync android
      ```
      Without the flag, or without `google-services.json`, the app keeps the
      on-device schedule. Push registration without Firebase can crash an
      Android app, so the flag must only be set when the file is present.
4. **Announcements.** Set a random `PUSH_ADMIN_SECRET` of at least 32
   characters in Vercel. To send an announcement:
   ```bash
   PUSH_ADMIN_SECRET=… node scripts/send-announcement.mjs announcement.json
   ```
   The script's header shows the file format. English is required, and other
   languages fall back to English.
5. **Redeploy** after adding the settings.

## Privacy

The privacy policy (all four languages) has a Notifications section. It says
what is stored, who delivers the messages (Google, or Apple for iPhone), and
when the data is deleted.
