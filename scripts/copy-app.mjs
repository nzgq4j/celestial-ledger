// Copies the built app (celestial-atlas/dist) into public/, where Next.js serves it.
// The copied files are build output and are git-ignored.
import fs from "node:fs";
import path from "node:path";

const from = path.resolve("celestial-atlas/dist");
const to = path.resolve("public");
if (!fs.existsSync(path.join(from, "index.html")))
  throw new Error("celestial-atlas/dist is missing; run the app build first.");
fs.rmSync(path.join(to, "assets"), { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
console.log("Copied the app build into public/.");
