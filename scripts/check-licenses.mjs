import { readFile } from "node:fs/promises";

const lock = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
);
const productionPackages = Object.entries(lock.packages)
  .filter(([path, metadata]) => path && metadata.dev !== true)
  .map(([path, metadata]) => ({
    name: path.slice(
      path.lastIndexOf("node_modules/") + "node_modules/".length,
    ),
    version: metadata.version,
    license: metadata.license,
  }));

const missing = productionPackages.filter((entry) => !entry.license);
const prohibited = productionPackages.filter((entry) =>
  /(?:^|\s|\()A?GPL(?:-|\s|\)|$)/i.test(entry.license ?? ""),
);
const summary = new Map();
for (const entry of productionPackages) {
  const license = entry.license ?? "UNKNOWN";
  summary.set(license, (summary.get(license) ?? 0) + 1);
}

console.log(`Production packages checked: ${productionPackages.length}`);
for (const [license, count] of [...summary].sort(([a], [b]) =>
  a.localeCompare(b),
))
  console.log(`${license}: ${count}`);

if (missing.length || prohibited.length) {
  for (const entry of [...missing, ...prohibited])
    console.error(
      `${entry.name}@${entry.version}: ${entry.license ?? "missing license"}`,
    );
  process.exitCode = 1;
}
