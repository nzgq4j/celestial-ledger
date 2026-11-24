// Parity check: the TypeScript port must produce exactly the same output as the
// prototype's atlas.js and tarotData.js. Skipped if the prototype folder is removed.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as atlas from '../src/engine/atlas';
import TAROT_CARDS from '../src/engine/tarotData';

const legacyPath = fileURLToPath(new URL('../../UPDATE/atlas.js', import.meta.url));
const legacyTarotPath = fileURLToPath(new URL('../../UPDATE/tarotData.js', import.meta.url));
const hasLegacy = existsSync(legacyPath) && existsSync(legacyTarotPath);

type Legacy = any;
const loadLegacy = async (): Promise<{ lib: Legacy; cards: Legacy[] }> => {
  const lib: Legacy = await import(/* @vite-ignore */ pathToFileURL(legacyPath).href);
  const td: Legacy = await import(/* @vite-ignore */ pathToFileURL(legacyTarotPath).href);
  return { lib, cards: td.default };
};

const NAMES = ['Amelia Rose Laurent', 'José María Núñez', "Siobhán O'Neill", 'Li Wei', 'Zoë Kraus-Becker'];
const profiles = (): atlas.Profile[] => {
  const out: atlas.Profile[] = [];
  let k = 0;
  for (let year = 1931; year <= 2025; year += 7) {
    for (let month = 1; month <= 12; month += 3) {
      const day = 1 + ((year * 7 + month * 3) % 28);
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hh = String((year + month) % 24).padStart(2, '0');
      const mm = String((year * month) % 60).padStart(2, '0');
      out.push({
        name: NAMES[k % NAMES.length], date, time: `${hh}:${mm}`,
        timeUnknown: k % 5 === 0, cityIdx: k % atlas.CITIES.length, dst: k % 3 === 0,
      });
      k++;
    }
  }
  return out;
};

describe.skipIf(!hasLegacy)('parity with the prototype engine', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('has identical reference data and tarot cards', async () => {
    const { lib, cards } = await loadLegacy();
    expect(atlas.SIGNS).toEqual(lib.SIGNS);
    expect(atlas.CITIES).toEqual(lib.CITIES);
    expect(atlas.PLANETS).toEqual(lib.PLANETS);
    expect(atlas.NUM).toEqual(lib.NUM);
    expect(atlas.NUM_TYPES).toEqual(lib.NUM_TYPES);
    expect(atlas.PERSONAL_YEAR).toEqual(lib.PERSONAL_YEAR);
    expect(atlas.PERSONAL_DAY).toEqual(lib.PERSONAL_DAY);
    expect(TAROT_CARDS).toEqual(cards);
  });

  it('produces identical charts and numbers', async () => {
    const { lib } = await loadLegacy();
    const today = new Date(2026, 10, 24);
    for (const p of profiles()) {
      expect(atlas.chart(p)).toEqual(lib.chart(p));
      expect(atlas.numbers(p, today)).toEqual(lib.numbers(p, today));
      expect(atlas.lifePathOf(p.date)).toBe(lib.lifePathOf(p.date));
    }
  });

  it('produces identical sky readings', async () => {
    const { lib } = await loadLegacy();
    vi.useFakeTimers();
    for (let d = 0; d < 400; d += 9) {
      const when = new Date(Date.UTC(2025, 0, 1 + d, d % 24, d % 60));
      vi.setSystemTime(when);
      expect(atlas.sky(when)).toEqual(lib.sky());
    }
  });

  it('produces identical horoscopes', async () => {
    const { lib } = await loadLegacy();
    const periods: atlas.Period[] = ['daily', 'weekly', 'monthly'];
    for (let d = 0; d < 90; d += 7) {
      const date = new Date(2026, 0, 1 + d, 10);
      for (let s = 0; s < 12; s++) {
        for (const period of periods) {
          expect(atlas.horoscope(s, period, date, (s * 5 + d) % 12)).toEqual(lib.horoscope(s, period, date, (s * 5 + d) % 12));
        }
      }
    }
  });

  it('produces identical compatibility text', async () => {
    const { lib } = await loadLegacy();
    for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) {
      expect(atlas.signCompat(a, b)).toEqual(lib.signCompat(a, b));
    }
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
    for (const a of nums) for (const b of nums) {
      expect(atlas.numCompat(a, b)).toEqual(lib.numCompat(a, b));
    }
  });

  it('produces identical card draws and reports', async () => {
    const { lib, cards } = await loadLegacy();
    for (let i = 0; i < 300; i++) {
      const seed = `Amelia Rose Laurent|${i}|cod`;
      expect(atlas.drawCards(TAROT_CARDS, seed, 14)).toEqual(lib.drawCards(cards, seed, 14));
    }
    vi.useFakeTimers();
    const now = new Date(2026, 10, 24, 9, 30);
    vi.setSystemTime(now);
    for (const p of profiles().slice(0, 20)) {
      const ch = atlas.chart(p), nums = atlas.numbers(p, now), sk = atlas.sky(now);
      expect(atlas.report(p, ch, nums, sk, TAROT_CARDS, now)).toEqual(lib.report(p, ch, nums, sk, cards));
    }
  });
});
