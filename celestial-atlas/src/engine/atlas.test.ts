import { describe, expect, it } from 'vitest';
import {
  NUM,
  SIGNS,
  chart,
  chartAspects,
  drawCards,
  horoscope,
  lifePathOf,
  numbers,
  reduce,
  report,
  sky,
  type Profile,
} from './atlas';
import type { Place } from './places';
import TAROT_CARDS from './tarotData';

/** A synthetic birthplace on UTC so local time equals UTC. */
const UTC_PLACE: Place = { id: 0, name: 'Greenwich', region: '', country: 'Test', lat: 51.4779, lon: -0.0015, timeZone: 'UTC' };
const NEW_YORK: Place = { id: 5128581, name: 'New York City', region: 'New York', country: 'United States', lat: 40.7143, lon: -74.006, timeZone: 'America/New_York' };
const AVIGNON: Place = { id: 3035681, name: 'Avignon', region: "Provence-Alpes-Côte d'Azur", country: 'France', lat: 43.9493, lon: 4.8055, timeZone: 'Europe/Paris' };

const utcAt = (date: string, time: string): Profile => ({ name: 'Test Person', date, time, timeUnknown: false, place: UTC_PLACE });
const sunSignAt = (date: string, time = '12:00'): string => chart(utcAt(date, time)).sun.sign.name;

describe('Life Path', () => {
  it('is 1 for 1991-07-28', () => {
    expect(lifePathOf('1991-07-28')).toBe(1);
  });

  it('reduces ordinary sums to a single digit', () => {
    expect(lifePathOf('1990-03-15')).toBe(1);
    expect(lifePathOf('1987-12-25')).toBe(8);
  });
});

describe('master numbers (11 / 22 / 33)', () => {
  it('keeps 11, 22 and 33 when reducing with master handling', () => {
    expect(reduce(11)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(33)).toBe(33);
    expect(reduce(29)).toBe(11);
    expect(reduce(38)).toBe(11);
    expect(reduce(1993)).toBe(22);
    expect(reduce(1965)).toBe(3);
  });

  it('collapses master numbers when master handling is off', () => {
    expect(reduce(11, false)).toBe(2);
    expect(reduce(22, false)).toBe(4);
    expect(reduce(33, false)).toBe(6);
    expect(reduce(29, false)).toBe(2);
  });

  it('produces master Life Paths', () => {
    expect(lifePathOf('2000-01-08')).toBe(11);
    expect(lifePathOf('1985-11-06')).toBe(22);
    expect(lifePathOf('2009-11-11')).toBe(33);
  });

  it('keeps master numbers in the core numbers and never in the personal cycles', () => {
    const n = numbers({ name: 'Amelia Rose Laurent', date: '1991-07-28' }, new Date(2026, 10, 24));
    for (const v of [n.lifePath, n.expression, n.soulUrge, n.personality, n.birthday]) expect(NUM[v]).toBeDefined();
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

describe('name numbers', () => {
  it('gives 0 for a name with no vowels or no consonants, which has no meaning entry', () => {
    // Onboarding rejects these names (see nameProblem in src/state/validation.ts).
    expect(numbers({ name: 'Ng', date: '1990-01-01' }).soulUrge).toBe(0);
    expect(numbers({ name: 'Io', date: '1990-01-01' }).personality).toBe(0);
    expect(NUM[0]).toBeUndefined();
  });
});

describe('Sun sign boundaries', () => {
  it('places early-month and late-month dates in the expected signs', () => {
    const early = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const late  = ['Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn'];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      expect(sunSignAt(`2024-${mm}-05`)).toBe(early[m - 1]);
      expect(sunSignAt(`2024-${mm}-28`)).toBe(late[m - 1]);
    }
  });

  it('changes sign within minutes of the March equinox (2024-03-20 03:06 UTC)', () => {
    expect(sunSignAt('2024-03-20', '03:00')).toBe('Pisces');
    expect(sunSignAt('2024-03-20', '03:12')).toBe('Aries');
  });

  it('changes sign within minutes of the June solstice (2024-06-20 20:51 UTC)', () => {
    expect(sunSignAt('2024-06-20', '20:45')).toBe('Gemini');
    expect(sunSignAt('2024-06-20', '20:57')).toBe('Cancer');
  });

  it('changes sign within minutes of the December solstice (2024-12-21 09:20 UTC)', () => {
    expect(sunSignAt('2024-12-21', '09:14')).toBe('Sagittarius');
    expect(sunSignAt('2024-12-21', '09:26')).toBe('Capricorn');
  });

  it('puts 1991-07-28 in Leo', () => {
    expect(chart({ name: 'Amelia Rose Laurent', date: '1991-07-28', time: '06:45', timeUnknown: false, place: AVIGNON }).sun.sign.name).toBe('Leo');
  });

  it('applies daylight saving time automatically from the IANA zone', () => {
    // 2024-03-19 23:00 in New York is EDT (UTC-4): 03:00 UTC, before the equinox.
    const base: Profile = { name: 'X', date: '2024-03-19', time: '23:00', timeUnknown: false, place: NEW_YORK };
    expect(chart(base).record.utc).toBe('2024-03-20T03:00:00.000Z');
    expect(chart(base).sun.sign.name).toBe('Pisces');
    // 23:30 local is 03:30 UTC, after the equinox.
    expect(chart({ ...base, time: '23:30' }).sun.sign.name).toBe('Aries');
  });
});

describe('unknown birth time', () => {
  const unknown = (date: string): Profile => ({ name: 'Test Person', date, time: '', timeUnknown: true, place: UTC_PLACE });

  it('omits rising, Midheaven and houses', () => {
    const c = chart(unknown('1991-07-28'));
    expect(c.rising).toBeNull();
    expect(c.mc).toBeNull();
    expect(c.houses).toHaveLength(0);
    expect(c.record.houseSystem).toBe('none');
    expect(c.record.timeResolution).toBe('noon-anchor');
    expect(c.planets).toHaveLength(8);
  });

  // Find January 2024 dates where the Moon did and did not change sign (UTC day).
  const moonSignAt = (iso: string) => sky(new Date(iso)).moon.signIdx;
  const days = Array.from({ length: 31 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);
  const changeDay = days.find(d => moonSignAt(`${d}T00:00:00Z`) !== moonSignAt(`${d}T23:59:59.999Z`))!;
  const steadyDay = days.find(d => moonSignAt(`${d}T00:00:00Z`) === moonSignAt(`${d}T23:59:59.999Z`))!;

  it('flags the Moon when it changed sign during the birth date', () => {
    expect(changeDay).toBeDefined();
    const c = chart(unknown(changeDay));
    const first = SIGNS[moonSignAt(`${changeDay}T00:00:00Z`)].name, last = SIGNS[moonSignAt(`${changeDay}T23:59:59.999Z`)].name;
    expect(c.moon.uncertain).toBe(true);
    expect(c.moon.possibleSigns.map(s => s.name)).toEqual([first, last]);
    expect(c.record.moonSignUncertain).toBe(true);
  });

  it('does not flag the Moon when it stayed in one sign', () => {
    const c = chart(unknown(steadyDay));
    expect(c.moon.uncertain).toBe(false);
    expect(c.moon.possibleSigns).toHaveLength(1);
  });

  it('leaves Moon aspects out', () => {
    const c = chart(unknown(changeDay));
    expect(chartAspects(c, [c.sun, c.moon, ...c.planets]).every(a => a.a !== 'moon' && a.b !== 'moon')).toBe(true);
    // With a known time, some day in the month has a Moon aspect.
    const withMoon = days.some(d => {
      const k = chart(utcAt(d, '12:00'));
      return chartAspects(k, [k.sun, k.moon, ...k.planets]).some(a => a.a === 'moon' || a.b === 'moon');
    });
    expect(withMoon).toBe(true);
  });

  it('avoids the uncertain Moon sign in the report', () => {
    const p = unknown(changeDay);
    const c = chart(p);
    const r = report(p, c, numbers(p), sky(new Date('2026-11-24T12:00:00Z')), TAROT_CARDS, new Date(2026, 10, 24));
    const emotional = r.sections.find(s => s.h === 'Your emotional landscape')!;
    expect(emotional.body).toContain(c.moon.possibleSigns.map(s => s.name).join(' or '));
    expect(emotional.body).not.toContain('Your Moon is in');
  });

  it('includes rising, Midheaven and 12 equal houses when the time is known', () => {
    const c = chart(utcAt('1991-07-28', '06:45'));
    expect(c.rising).not.toBeNull();
    expect(c.mc).not.toBeNull();
    expect(c.houses).toHaveLength(12);
    expect(c.houses[0].lon).toBeCloseTo(c.rising!.lon, 9);
  });
});

describe('moon phase sanity', () => {
  const at = (iso: string) => sky(new Date(iso));

  it('reports a new moon with almost no light', () => {
    const s = at('2024-01-11T11:57:00Z');
    expect(s.phase).toBe('New Moon');
    expect(s.illum).toBeLessThan(0.01);
  });

  it('reports a waxing first quarter near half lit', () => {
    const s = at('2024-01-18T03:53:00Z');
    expect(s.phase).toBe('First Quarter');
    expect(s.waxing).toBe(true);
    expect(s.illum).toBeGreaterThan(0.45);
    expect(s.illum).toBeLessThan(0.55);
  });

  it('reports a full moon almost fully lit, opposite the Sun', () => {
    const s = at('2024-01-25T17:54:00Z');
    expect(s.phase).toBe('Full Moon');
    expect(s.illum).toBeGreaterThan(0.99);
    let sep = Math.abs(s.moon.lon - s.sun.lon);
    if (sep > 180) sep = 360 - sep;
    expect(sep).toBeGreaterThan(179);
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

describe('retrogrades', () => {
  it('detects Mercury retrograde in April 2024 and direct motion before the station', () => {
    const mercury = (iso: string) => sky(new Date(iso)).planets.find(p => p.key === 'mercury')!;
    expect(mercury('2024-03-31T00:00:00Z').retro).toBe(false);
    expect(mercury('2024-04-10T00:00:00Z').retro).toBe(true);
    expect(mercury('2024-04-27T00:00:00Z').retro).toBe(false);
  });
});

describe('deterministic text', () => {
  it('returns the same horoscope for the same sign, period and day', () => {
    expect(horoscope(4, 'daily', new Date(2026, 10, 24, 9), 2)).toEqual(horoscope(4, 'daily', new Date(2026, 10, 24, 21), 2));
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
