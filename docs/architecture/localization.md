# Localisation and translation packs

Celestial Atlas uses BCP 47 language tags. The root document, persisted user preference, and each locale option carry the complete tag (currently `en-GB`) so regional variants remain explicit.

Translation packs live in `lib/i18n/locales` and conform to `TranslationPack`. To add one:

Enabled packs currently include British English (`en-GB`), Spanish (`es-ES`), French (`fr-FR`), and German (`de-DE`).

1. Add its BCP 47 tag to `localeTags` in `lib/i18n/config.ts` and to the early document-language allowlist in `public/preferences-init.js`.
2. Add a dynamically imported registry entry with its native name and `ltr` or `rtl` direction.
3. Add a complete pack under `lib/i18n/locales/<tag>.ts`.
4. The localisation test enforces exact message-key parity with the default English pack. Translate surfaces through the locale provider before adding new keys.

Do not enable a locale in the selector until its customer-facing strings, transactional email templates, legal copy, accessibility labels, report schemas, and safety language have been reviewed. Locale tags describe language and region; they must not be used as a proxy for a user’s physical location.
