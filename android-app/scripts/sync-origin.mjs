// Writes the offline page's Retry origin into the synced Android assets.
// Runs after `cap sync android` (see the `android:sync` npm script) so a
// staging build (CAPACITOR_SERVER_URL=...) retries against staging, while the
// committed android-app/www/origin.js keeps the production origin.
import { writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const target = path.join(root, "android/app/src/main/assets/public/origin.js");
const override = process.env.CAPACITOR_SERVER_URL?.trim();
if (!override) process.exit(0);

const url = new URL(override);
if (url.protocol !== "https:") {
  console.error("CAPACITOR_SERVER_URL must be an https:// origin.");
  process.exit(1);
}
try {
  await access(path.dirname(target));
} catch {
  console.error("Android assets not found; run `npx cap sync android` first.");
  process.exit(1);
}
await writeFile(
  target,
  `window.CELESTIAL_ATLAS_ORIGIN = ${JSON.stringify(url.origin)};\n`,
);
console.log(`Offline Retry origin set to ${url.origin}`);
