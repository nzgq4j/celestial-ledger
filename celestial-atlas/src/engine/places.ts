// Searchable birthplace list: a bundled GeoNames cities15000 subset (CC BY 4.0).
// The data file is loaded on demand so it is not part of the start-up bundle.

export interface Place {
  /** GeoNames ID */
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  /** IANA time-zone identifier */
  timeZone: string;
}

type Row = [number, string, string | 0, string, number, number, number, number, number];
interface CityFile { countries: string[]; zones: string[]; rows: Row[] }

interface Indexed { place: Place; keys: string[]; population: number }

export const fold = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

export function placeLabel(p: Pick<Place, 'name' | 'region' | 'country'>): string {
  return [p.name, p.region, p.country].filter(Boolean).join(', ');
}

let index: Indexed[] | null = null;
let loading: Promise<Indexed[]> | null = null;

export function buildIndex(file: CityFile): Indexed[] {
  return file.rows.map(([id, name, ascii, region, c, lat, lon, z, population]) => {
    const place: Place = { id, name, region, country: file.countries[c], lat, lon, timeZone: file.zones[z] };
    return { place, population, keys: [...new Set([fold(name), fold(ascii || name)])] };
  });
}

export function loadPlaces(): Promise<Indexed[]> {
  if (index) return Promise.resolve(index);
  loading ??= import('../data/cities.json').then(m => (index = buildIndex(m.default as unknown as CityFile)));
  return loading;
}

/**
 * Rank matches: exact name, then names starting with the query, then names with a
 * word starting with it. Ties go to the larger city. Text after a comma narrows by
 * region or country ("paris, texas").
 */
export function searchIndex(items: readonly Indexed[], query: string, limit = 8): Place[] {
  const [head, ...rest] = query.split(',');
  const q = fold(head);
  const qualifier = fold(rest.join(' '));
  if (q.length < 2) return [];
  const scored: { item: Indexed; score: number }[] = [];
  for (const item of items) {
    let score = 3;
    for (const key of item.keys) {
      if (key === q) score = 0;
      else if (key.startsWith(q)) score = Math.min(score, 1);
      else if (key.includes(' ' + q)) score = Math.min(score, 2);
    }
    if (score === 3) continue;
    if (qualifier && !fold(`${item.place.region} ${item.place.country}`).includes(qualifier)) continue;
    scored.push({ item, score });
  }
  scored.sort((a, b) => a.score - b.score || b.item.population - a.item.population);
  return scored.slice(0, limit).map(s => s.item.place);
}

export async function searchPlaces(query: string, limit = 8): Promise<Place[]> {
  return searchIndex(await loadPlaces(), query, limit);
}
