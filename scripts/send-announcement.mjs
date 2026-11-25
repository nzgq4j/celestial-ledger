// Sends a push announcement to every device with notifications on.
//
// Usage:
//   PUSH_ADMIN_SECRET=… node scripts/send-announcement.mjs announcement.json
//
// announcement.json:
//   {
//     "title": { "en": "New: Celtic Cross", "es": "…", "fr": "…", "de": "…" },
//     "body":  { "en": "Try the ten-card spread in Tarot.", "es": "…" },
//     "url": "/tarot"
//   }
// English is required; other languages fall back to English.
import { readFile } from "node:fs/promises";

const [file] = process.argv.slice(2);
const secret = process.env.PUSH_ADMIN_SECRET;
const base = process.env.SITE_URL ?? "https://www.celestialatlas.app";
if (!file || !secret) {
  console.error(
    "Usage: PUSH_ADMIN_SECRET=… node scripts/send-announcement.mjs announcement.json",
  );
  process.exit(1);
}
const announcement = JSON.parse(await readFile(file, "utf8"));
const response = await fetch(`${base}/api/internal/push-announce`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(announcement),
});
const result = await response.json().catch(() => ({}));
console.log(response.status, JSON.stringify(result));
if (!response.ok) process.exitCode = 1;
