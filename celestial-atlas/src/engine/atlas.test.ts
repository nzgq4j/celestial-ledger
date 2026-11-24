import { describe, expect, it } from 'vitest';
import {
  CITIES,
  NUM,
  SIGNS,
  chart,
  drawCards,
  horoscope,
  lifePathOf,
  numbers,
  reduce,
  sky,
  type Profile,
} from './atlas';
import TAROT_CARDS from './tarotData';

const LONDON = CITIES.findIndex(c => c.name === 'London, UK');

/** A profile born in London (UTC+0, no DST) at the given UTC date and time. */
const londonAt = (date: string, time: string): Profile => ({
  name: 'Test Person', date, time, timeUnknown: false, cityIdx: LONDON, dst: false,
});
const sunSignAt = (date: string, time = '12:00'): string => chart(londonAt(date, time)).sun.sign.name;

describe('Life Path', () => {
  it('is 1 for 1991-07-28', () => {
    expect(lifePathOf('1991-07-28')).toBe(1);
  });

  it('reduces ordinary sums to a single digit', () => {
    // 1990-03-15: 3 + (1+5=6) + (1+9+9+0=19 -> 10 -> 1) = 10 -> 1
    expect(lifePathOf('1990-03-15')).toBe(1);
    // 1987-12-25: (1+2=3) + (2+5=7) + (1+9+8+7=25 -> 7) = 17 -> 8
    expect(lifePathOf('1987-12-25')).toBe(8);
  });
});

describe('master numbers (11 / 22 / 33)', () => {
  it('keeps 11, 22 and 33 when reducing with master handling', () => {
    expect(reduce(11)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(33)).toBe(33);
    expect(reduce(29)).toBe(11); // 2+9
    expect(reduce(38)).toBe(11); // 3+8
    expect(reduce(1993)).toBe(22); // 1+9+9+3
    expect(reduce(1965)).toBe(3); // 21 -> 3, not a master number
  });

  it('collapses master numbers when master handling is off', () => {
    expect(reduce(11, false)).toBe(2);
    expect(reduce(22, false)).toBe(4);
    expect(reduce(33, false)).toBe(6);
    expect(reduce(29, false)).toBe(2);
  });

  it('produces master Life Paths', () => {
    // month 1 + day 8 + year 2000 (2) = 11
    expect(lifePathOf('2000-01-08')).toBe(11);
    // month 11 (kept) + day 6 + year 1985 (23 -> 5) = 22
    expect(lifePathOf('1985-11-06')).toBe(22);
    // month 11 + day 11 + year 2009 (11) = 33
    expect(lifePathOf('2009-11-11')).toBe(33);
  });

  it('keeps master numbers in the name numbers and never in the personal cycles', () => {
    const n = numbers({ name: 'Amelia Rose Laurent', date: '1991-07-28' }, new Date(2026, 10, 24));
    for (const v of [n.lifePath, n.expression, n.soulUrge, n.personality, n.birthday]) {
      expect(NUM[v]).toBeDefined();
    }
    for (const v of [n.personalYear, n.personalMonth, n.personalDay]) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('keeps a master Birthday number', () => {
    expect(numbers({ name: 'A B', date: '1990-05-29' }).birthday).toBe(11);
    expect(numbers({ name: 'A B', date: '1990-05-22' }).birthday).toBe(22);
  });
});

describe('Sun sign boundaries', () => {
  it('places early-month and late-month dates in the expected signs', () => {
    // Day 5 of each month sits before the sign change; day 28 sits after it.
    const early = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const late  = ['Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn'];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      expect(sunSignAt(`2024-${mm}-05`)).toBe(early[m - 1]);
      expect(sunSignAt(`2024-${mm}-28`)).toBe(late[m - 1]);
    }
  });

  it('changes sign across the March equinox (2024-03-20 03:06 UTC)', () => {
    expect(sunSignAt('2024-03-19', '21:00')).toBe('Pisces');
    expect(sunSignAt('2024-03-20', '09:00')).toBe('Aries');
  });

  it('changes sign across the June solstice (2024-06-20 20:51 UTC)', () => {
    expect(sunSignAt('2024-06-20', '14:00')).toBe('Gemini');
    expect(sunSignAt('2024-06-21', '03:00')).toBe('Cancer');
  });

  it('changes sign across the December solstice (2024-12-21 09:20 UTC)', () => {
    expect(sunSignAt('2024-12-21', '03:00')).toBe('Sagittarius');
    expect(sunSignAt('2024-12-21', '15:00')).toBe('Capricorn');
  });

  it('puts 1991-07-28 in Leo', () => {
    expect(sunSignAt('1991-07-28', '06:45')).toBe('Leo');
  });

  it('uses the city time zone and the DST flag when converting to UTC', () => {
    // 2024-03-20 05:00 in New York (UTC-5) is 10:00 UTC, after the equinox.
    const ny = CITIES.findIndex(c => c.name === 'New York, USA');
    const base: Profile = { name: 'X', date: '2024-03-20', time: '05:00', timeUnknown: false, cityIdx: ny, dst: false };
    expect(chart(base).sun.sign.name).toBe('Aries');
    // With DST the same wall time is 09:00 UTC, still after the equinox.
    expect(chart({ ...base, dst: true }).sun.sign.name).toBe('Aries');
    // 2024-03-19 22:00 New York is 2024-03-20 03:00 UTC, just before the equinox.
    expect(chart({ ...base, date: '2024-03-19', time: '21:00' }).sun.sign.name).toBe('Pisces');
  });
});

describe('unknown birth time', () => {
  it('omits rising and midheaven', () => {
    const c = chart({ ...londonAt('1991-07-28', ''), timeUnknown: true });
    expect(c.rising).toBeNull();
    expect(c.mc).toBeNull();
    expect(c.planets).toHaveLength(5);
  });

  it('includes rising and midheaven when the time is known', () => {
    const c = chart(londonAt('1991-07-28', '06:45'));
    expect(c.rising).not.toBeNull();
    expect(c.mc).not.toBeNull();
  });
});

describe('moon phase sanity', () => {
  // Reference instants (UTC) for January–February 2024 lunar phases.
  const at = (iso: string) => sky(new Date(iso));

  it('reports a new moon with almost no light', () => {
    const s = at('2024-01-11T11:57:00Z');
    expect(s.phase).toBe('New Moon');
    expect(s.illum).toBeLessThan(0.03);
  });

  it('reports a waxing first quarter near half lit', () => {
    const s = at('2024-01-18T03:53:00Z');
    expect(s.phase).toBe('First Quarter');
    expect(s.waxing).toBe(true);
    expect(s.illum).toBeGreaterThan(0.4);
    expect(s.illum).toBeLessThan(0.6);
  });

  it('reports a full moon almost fully lit, opposite the Sun', () => {
    const s = at('2024-01-25T17:54:00Z');
    expect(s.phase).toBe('Full Moon');
    expect(s.illum).toBeGreaterThan(0.97);
    let sep = Math.abs(s.moon.lon - s.sun.lon);
    if (sep > 180) sep = 360 - sep;
    expect(sep).toBeGreaterThan(175);
  });

  it('reports a waning last quarter', () => {
    const s = at('2024-02-02T23:18:00Z');
    expect(s.phase).toBe('Last Quarter');
    expect(s.waxing).toBe(false);
  });

  it('keeps illumination between 0 and 1 and the age within one cycle', () => {
    for (let d = 0; d < 60; d++) {
      const s = sky(new Date(Date.UTC(2026, 0, 1 + d, 12)));
      expect(s.illum).toBeGreaterThanOrEqual(0);
      expect(s.illum).toBeLessThanOrEqual(1);
      expect(s.age).toBeGreaterThanOrEqual(0);
      expect(s.age).toBeLessThan(29.530588853);
    }
  });
});

describe('deterministic text', () => {
  it('returns the same horoscope for the same sign, period and day', () => {
    const day = new Date(2026, 10, 24, 9);
    const later = new Date(2026, 10, 24, 21);
    expect(horoscope(4, 'daily', day, 2)).toEqual(horoscope(4, 'daily', later, 2));
  });

  it('keeps ratings in 2..5 and the lucky number in 1..9', () => {
    for (let i = 0; i < SIGNS.length; i++) {
      const h = horoscope(i, 'monthly', new Date(2026, 10, 24));
      for (const r of h.ratings) {
        expect(r.value).toBeGreaterThanOrEqual(2);
        expect(r.value).toBeLessThanOrEqual(5);
      }
      expect(h.lucky).toBeGreaterThanOrEqual(1);
      expect(h.lucky).toBeLessThanOrEqual(9);
    }
  });

  it('draws the same unique cards for the same seed', () => {
    const a = drawCards(TAROT_CARDS, 'seed', 14);
    expect(a).toEqual(drawCards(TAROT_CARDS, 'seed', 14));
    expect(new Set(a.map(d => d.card.id)).size).toBe(14);
  });
});

describe('tarot library', () => {
  it('has 78 unique cards: 22 major and 14 per suit', () => {
    expect(TAROT_CARDS).toHaveLength(78);
    expect(new Set(TAROT_CARDS.map(c => c.id)).size).toBe(78);
    expect(TAROT_CARDS.filter(c => c.arcana === 'major')).toHaveLength(22);
    for (const suit of ['wands', 'cups', 'swords', 'pentacles'] as const) {
      expect(TAROT_CARDS.filter(c => c.arcana === 'minor' && c.suit === suit)).toHaveLength(14);
    }
  });
});
