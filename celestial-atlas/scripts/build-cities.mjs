// Builds src/data/cities.json from a GeoNames dump (CC BY 4.0, https://www.geonames.org).
// Usage:
//   mkdir -p /tmp/geonames && cd /tmp/geonames
//   curl -O https://download.geonames.org/export/dump/cities15000.zip && unzip -o cities15000.zip
//   curl -O https://download.geonames.org/export/dump/admin1CodesASCII.txt
//   curl -O https://download.geonames.org/export/dump/countryInfo.txt
//   node scripts/build-cities.mjs /tmp/geonames
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('Pass the directory that holds the GeoNames files.'); process.exit(1); }
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').split('\n');

const countries = new Map();
for (const line of read('countryInfo.txt')) {
  if (!line || line.startsWith('#')) continue;
  const c = line.split('\t');
  countries.set(c[0], c[4]);
}
const admin1 = new Map();
for (const line of read('admin1CodesASCII.txt')) {
  if (!line) continue;
  const c = line.split('\t');
  admin1.set(c[0], c[1]);
}

const zones = [], zoneIdx = new Map();
const countryList = [], countryIdx = new Map();
const intern = (map, list, v) => { if (!map.has(v)) { map.set(v, list.length); list.push(v); } return map.get(v); };

const rows = [];
for (const line of read('cities15000.txt')) {
  if (!line) continue;
  const c = line.split('\t');
  const [id, name, ascii, , lat, lon, , , cc, , a1, , , , pop, , , tz] = c;
  if (!tz) continue;
  const country = countries.get(cc) || cc;
  const region = admin1.get(`${cc}.${a1}`) || '';
  rows.push([
    Number(id), name, ascii === name ? 0 : ascii, region === name ? '' : region,
    intern(countryIdx, countryList, country), Number(Number(lat).toFixed(4)), Number(Number(lon).toFixed(4)),
    intern(zoneIdx, zones, tz), Number(pop),
  ]);
}
rows.sort((a, b) => b[8] - a[8]);
const out = {
  source: 'GeoNames cities15000 (CC BY 4.0, https://www.geonames.org)',
  generated: new Date().toISOString().slice(0, 10),
  fields: ['id', 'name', 'asciiName', 'region', 'country', 'lat', 'lon', 'timeZone', 'population'],
  countries: countryList, zones, rows,
};
const target = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'data', 'cities.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out));
fs.writeFileSync(path.join(path.dirname(target), 'cities-meta.json'), JSON.stringify({ source: out.source, generated: out.generated, count: rows.length }, null, 2) + '\n');
console.log(`${rows.length} cities, ${zones.length} zones, ${countryList.length} countries -> ${target} (${(fs.statSync(target).size / 1e6).toFixed(2)} MB)`);
