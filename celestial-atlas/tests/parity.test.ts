// Parity check against the prototype's atlas.js and tarotData.js.
//
// Astronomy intentionally differs (astronomy-engine replaced the prototype's
// low-precision formulas, and birth times now use IANA time zones), so this suite
// checks everything else: reference copy, numerology, horoscope text, compatibility,
// card draws, and the report wording when both are given the same chart.
// Skipped if the prototype folder is removed.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as atlas from '../src/engine/atlas';
import type { Place } from '../src/engine/places';
import TAROT_CARDS from '../src/engine/tarotData';

const legacyPath = fileURLToPath(new URL('../../UPDATE/atlas.js', import.meta.url));
const legacyTarotPath = fileURLToPath(new URL('../../UPDATE/tarotData.js', import.meta.url));
const hasLegacy = existsSync(legacyPath) && existsSync(legacyTarotPath);

type Legacy = any; // eslint-disable-line
const loadLegacy = async (): Promise<{ lib: Legacy; cards: Legacy[] }> => {
  const lib: Legacy = await import(/* @vite-ignore */ pathToFileURL(legacyPath).href);
  const td: Legacy = await import(/* @vite-ignore */ pathToFileURL(legacyTarotPath).href);
  return { lib, cards: td.default };
};

const NAMES = ['Amelia Rose Laurent', 'José María Núñez', "Siobhán O'Neill", 'Li Wei', 'Zoë Kraus-Becker'];
const PLACES: Place[] = [
  { id: 1, name: 'Avignon', region: '', country: 'France', lat: 43.9493, lon: 4.8055, timeZone: 'Europe/Paris' },
  { id: 2, name: 'Tokyo', region: '', country: 'Japan', lat: 35.6895, lon: 139.6917, timeZone: 'Asia/Tokyo' },
  { id: 3, name: 'Denver', region: '', country: 'United States', lat: 39.7392, lon: -104.9847, timeZone: 'America/Denver' },
];
const profiles = (): atlas.Profile[] => {
  const out: atlas.Profile[] = [];
  let k = 0;
  for (let year = 1931; year <= 2025; year += 7) {
    for (let month = 1; month <= 12; month += 3) {
      const day = 1 + ((year * 7 + month * 3) % 28);
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hh = String(4 + ((year + month) % 18)).padStart(2, '0');
      const mm = String((year * month) % 60).padStart(2, '0');
      out.push({ name: NAMES[k % NAMES.length], date, time: `${hh}:${mm}`, timeUnknown: false, place: PLACES[k % PLACES.length] });
      k++;
    }
  }
  return out;
};

describe.skipIf(!hasLegacy)('parity with the prototype engine', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('keeps the reference copy and tarot cards unchanged', async () => {
    const { lib, cards } = await loadLegacy();
    expect(atlas.SIGNS).toEqual(lib.SIGNS);
    for (const key of Object.keys(lib.PLANETS)) expect(atlas.PLANETS[key as atlas.BodyKey]).toEqual(lib.PLANETS[key]);
    expect(atlas.NUM).toEqual(lib.NUM);
    expect(atlas.NUM_TYPES).toEqual(lib.NUM_TYPES);
    expect(atlas.PERSONAL_YEAR).toEqual(lib.PERSONAL_YEAR);
    expect(atlas.PERSONAL_DAY).toEqual(lib.PERSONAL_DAY);
    expect(TAROT_CARDS).toEqual(cards);
  });

  it('produces identical numerology', async () => {
    const { lib } = await loadLegacy();
    const today = new Date(2026, 10, 24);
    for (const p of profiles()) {
      expect(atlas.numbersCore(p, today)).toEqual(lib.numbers(p, today));
      expect(atlas.lifePathOf(p.date)).toBe(lib.lifePathOf(p.date));
    }
  });

  it('produces identical horoscopes', async () => {
    const { lib } = await loadLegacy();
    const periods: atlas.Period[] = ['daily', 'weekly', 'monthly'];
    for (let d = 0; d < 90; d += 7) {
      const date = new Date(2026, 0, 1 + d, 10);
      for (let s = 0; s < 12; s++) for (const period of periods) {
        expect(atlas.horoscope(s, period, date, (s * 5 + d) % 12)).toEqual(lib.horoscope(s, period, date, (s * 5 + d) % 12));
      }
    }
  });

  it('produces identical compatibility text', async () => {
    const { lib } = await loadLegacy();
    for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) expect(atlas.signCompat(a, b)).toEqual(lib.signCompat(a, b));
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
    for (const a of nums) for (const b of nums) expect(atlas.numCompat(a, b)).toEqual(lib.numCompat(a, b));
  });

  it('produces identical card draws', async () => {
    const { lib, cards } = await loadLegacy();
    for (let i = 0; i < 300; i++) {
      const seed = `Amelia Rose Laurent|${i}|cod`;
      expect(atlas.drawCards(TAROT_CARDS, seed, 14)).toEqual(lib.drawCards(cards, seed, 14));
    }
  });

  it('produces identical report wording from the same chart', async () => {
    const { lib, cards } = await loadLegacy();
    const now = new Date(2026, 10, 24, 9, 30);
    vi.useFakeTimers();
    vi.setSystemTime(now); // the prototype seeds the report cards from the current date
    const sk = atlas.sky(now);
    for (const p of profiles().slice(0, 24)) {
      const ch = atlas.chart(p), nums = atlas.numbers(p, now);
      const ours = atlas.report(p, ch, nums, sk, TAROT_CARDS, now);
      const theirs = lib.report(p, ch, nums, sk, cards);
      expect(ours.sections.map(({ h, body }) => ({ h, body }))).toEqual(theirs.sections);
      expect(ours.cards.map(({ position, name, orientation, meaning }) => ({ position, name, orientation, meaning }))).toEqual(theirs.cards);
    }
  });
});
