import { describe, expect, it } from 'vitest';
// Golden fixtures shared with the repository's web engine (../__tests__).
import ephemerisFixtures from '../../../__tests__/fixtures.json';
import angleFixtures from '../../../__tests__/angle-fixtures.json';
import { chart, chartAspects, numbers, report, sky, type Profile } from './atlas';
import { angles, longitude, type BodyName } from './ephemeris';
import citiesFile from '../data/cities.json';
import { buildIndex, fold, placeLabel, searchIndex, type Place } from './places';
import { canonicalJson, contentId } from './records';
import TAROT_CARDS from './tarotData';
import { BirthTimeError, localTimeCandidates, resolveBirthTime } from './time';

const delta = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('golden ephemeris fixtures (Astrodienst-compatible, 00:00 UT)', () => {
  const NAMES: Record<string, BodyName> = {
    Sun: 'sun', Moon: 'moon', Mercury: 'mercury', Venus: 'venus', Mars: 'mars', Jupiter: 'jupiter',
    Saturn: 'saturn', Uranus: 'uranus', Neptune: 'neptune', Pluto: 'pluto',
  };
  for (const fx of ephemerisFixtures) {
    it(`${fx.utc} matches within ${fx.toleranceDegrees}°`, () => {
      for (const [name, expected] of Object.entries(fx.expected)) {
        const body = NAMES[name];
        if (!body) continue; // North Node is not calculated by this app
        expect(delta(longitude(body, new Date(fx.utc)), expected), name).toBeLessThanOrEqual(fx.toleranceDegrees);
      }
    });
  }
});

describe('golden angle fixtures (USNO sidereal time)', () => {
  for (const fx of angleFixtures) {
    it(`${fx.label} matches Ascendant and Midheaven within ${fx.toleranceDegrees}°`, () => {
      const a = angles(new Date(fx.utc), fx.latitude, fx.longitude);
      expect(delta(a.ascendant, fx.expectedAscendant)).toBeLessThanOrEqual(fx.toleranceDegrees);
      expect(delta(a.midheaven, fx.expectedMidheaven)).toBeLessThanOrEqual(fx.toleranceDegrees);
      expect(delta(a.localSiderealTime, fx.expectedLocalApparentSiderealTimeHours * 15)).toBeLessThanOrEqual(fx.toleranceDegrees);
    });
  }

  it('refuses angles at the geographic poles', () => {
    expect(() => angles(new Date('2000-01-01T00:00:00Z'), 90, 0)).toThrow(RangeError);
  });
});

describe('historical time zones', () => {
  it('applies US daylight saving time', () => {
    expect(resolveBirthTime({ date: '2024-07-04', time: '12:00', timeUnknown: false }, 'America/New_York').utc.toISOString()).toBe('2024-07-04T16:00:00.000Z');
    expect(resolveBirthTime({ date: '2024-01-04', time: '12:00', timeUnknown: false }, 'America/New_York').utc.toISOString()).toBe('2024-01-04T17:00:00.000Z');
  });

  it("uses Britain's 1968–71 British Standard Time (UTC+1 in winter)", () => {
    expect(resolveBirthTime({ date: '1970-01-15', time: '12:00', timeUnknown: false }, 'Europe/London').utc.toISOString()).toBe('1970-01-15T11:00:00.000Z');
    expect(resolveBirthTime({ date: '1975-01-15', time: '12:00', timeUnknown: false }, 'Europe/London').utc.toISOString()).toBe('1975-01-15T12:00:00.000Z');
  });

  it('handles half-hour zones', () => {
    expect(resolveBirthTime({ date: '1991-07-28', time: '06:45', timeUnknown: false }, 'Asia/Kolkata').utc.toISOString()).toBe('1991-07-28T01:15:00.000Z');
  });

  it('rejects a local time skipped by the spring-forward change', () => {
    expect(localTimeCandidates('2024-03-10', '02:30', 'America/New_York')).toHaveLength(0);
    expect(() => resolveBirthTime({ date: '2024-03-10', time: '02:30', timeUnknown: false }, 'America/New_York'))
      .toThrowError(expect.objectContaining({ code: 'NONEXISTENT' }) as unknown as Error);
  });

  it('asks which occurrence of a repeated fall-back time to use', () => {
    const input = { date: '2024-11-03', time: '01:30', timeUnknown: false };
    expect(localTimeCandidates(input.date, input.time, 'America/New_York').map(d => d.toISOString()))
      .toEqual(['2024-11-03T05:30:00.000Z', '2024-11-03T06:30:00.000Z']);
    expect(() => resolveBirthTime(input, 'America/New_York')).toThrow(BirthTimeError);
    const earlier = resolveBirthTime({ ...input, disambiguation: 'earlier' }, 'America/New_York');
    const later = resolveBirthTime({ ...input, disambiguation: 'later' }, 'America/New_York');
    expect(earlier.utc.toISOString()).toBe('2024-11-03T05:30:00.000Z');
    expect(earlier.resolution).toBe('ambiguous-earlier');
    expect(later.utc.toISOString()).toBe('2024-11-03T06:30:00.000Z');
    expect(later.offsetMinutes).toBe(-300);
  });

  it('rejects impossible dates and times', () => {
    expect(() => localTimeCandidates('2023-02-30', '12:00', 'UTC')).toThrow(BirthTimeError);
    expect(() => localTimeCandidates('2023-02-10', '24:10', 'UTC')).toThrow(BirthTimeError);
    expect(() => localTimeCandidates('2023-02-10', '12:00', 'Not/AZone')).toThrow(BirthTimeError);
  });

  it('uses local noon as the anchor when the time is unknown', () => {
    const r = resolveBirthTime({ date: '2024-07-04', time: '', timeUnknown: true }, 'America/New_York');
    expect(r.resolution).toBe('noon-anchor');
    expect(r.utc.toISOString()).toBe('2024-07-04T16:00:00.000Z');
  });
});

describe('birthplace search', () => {
  const index = buildIndex(citiesFile as unknown as Parameters<typeof buildIndex>[0]);

  it('bundles a large GeoNames list with time zones', () => {
    expect(index.length).toBeGreaterThan(30_000);
    expect(index.every(i => i.place.timeZone.length > 0)).toBe(true);
  });

  it('ranks the largest exact match first', () => {
    const [first] = searchIndex(index, 'paris');
    expect(first.country).toBe('France');
    expect(first.timeZone).toBe('Europe/Paris');
  });

  it('ignores accents and case', () => {
    expect(searchIndex(index, 'SAO PAULO')[0].country).toBe('Brazil');
    expect(fold('São Paulo')).toBe('sao paulo');
  });

  it('narrows by region or country after a comma', () => {
    const results = searchIndex(index, 'paris, texas');
    expect(results[0].region).toBe('Texas');
  });

  it('finds every city from the prototype list', () => {
    for (const q of ['New York', 'Los Angeles', 'Chicago', 'Denver', 'Toronto', 'Mexico City', 'São Paulo', 'London', 'Avignon',
      'Madrid', 'Rome', 'Berlin', 'Lagos', 'Cairo', 'Dubai', 'Mumbai', 'Singapore', 'Seoul', 'Tokyo', 'Sydney']) {
      expect(searchIndex(index, q).length, q).toBeGreaterThan(0);
    }
  });

  it('returns nothing for one-letter queries', () => {
    expect(searchIndex(index, 'p')).toEqual([]);
  });

  it('labels places with region and country', () => {
    expect(placeLabel({ name: 'Avignon', region: "Provence-Alpes-Côte d'Azur", country: 'France' })).toBe("Avignon, Provence-Alpes-Côte d'Azur, France");
  });
});

describe('calculation records and evidence', () => {
  const place: Place = { id: 3035681, name: 'Avignon', region: "Provence-Alpes-Côte d'Azur", country: 'France', lat: 43.9493, lon: 4.8055, timeZone: 'Europe/Paris' };
  const profile: Profile = { name: 'Amelia Rose Laurent', date: '1991-07-28', time: '06:45', timeUnknown: false, place };

  it('records every calculation input the project requires', () => {
    const r = chart(profile).record;
    expect(r).toMatchObject({
      kind: 'birth-chart', engine: 'astronomy-engine', engineVersion: '2.1.19', zodiac: 'tropical', houseSystem: 'equal',
      nodeType: 'not calculated', timeZone: 'Europe/Paris', localDate: '1991-07-28', localTime: '06:45',
      utc: '1991-07-28T04:45:00.000Z', utcOffsetMinutes: 120, latitude: 43.9493, longitude: 4.8055, placeId: 3035681,
      calculationVersion: 'celestial-atlas-android-v1', timeResolution: 'exact', timeKnown: true,
    });
    expect(r.placeData).toContain('GeoNames');
    expect(r.id).toMatch(/^chart_[0-9a-f]{28}$/);
  });

  it('gives identical IDs for identical inputs and new IDs when anything changes', () => {
    const a = chart(profile), b = chart({ ...profile });
    expect(a.record.id).toBe(b.record.id);
    expect(a.sun.evidenceId).toBe(b.sun.evidenceId);
    const moved = chart({ ...profile, time: '06:46' });
    expect(moved.record.id).not.toBe(a.record.id);
    expect(moved.sun.evidenceId).not.toBe(a.sun.evidenceId);
  });

  it('keys every evidence entry to its record', () => {
    const c = chart(profile);
    const ids = [c.sun.evidenceId, c.moon.evidenceId, c.rising!.evidenceId, c.mc!.evidenceId,
      ...c.planets.map(p => p.evidenceId), ...c.houses.map(h => h.evidenceId)];
    for (const id of ids) {
      expect(c.evidence[id], id).toBeDefined();
      expect(c.evidence[id].recordId).toBe(c.record.id);
    }
  });

  it('backs every report claim and card with evidence from known records', () => {
    const now = new Date(2026, 10, 24, 9);
    const c = chart(profile), n = numbers(profile, now), s = sky(now);
    const r = report(profile, c, n, s, TAROT_CARDS, now);
    expect(r.recordIds).toHaveLength(4);
    for (const section of r.sections) {
      expect(section.evidenceIds.length, section.h).toBeGreaterThan(0);
      for (const id of section.evidenceIds) {
        expect(r.evidence[id], `${section.h}: ${id}`).toBeDefined();
        expect(r.recordIds).toContain(r.evidence[id].recordId);
      }
    }
    for (const card of r.cards) expect(r.evidence[card.evidenceId]).toBeDefined();
  });

  it('gives aspects evidence tied to the chart record', () => {
    const c = chart(profile);
    const aspects = chartAspects(c, [c.sun, c.moon, ...c.planets]);
    expect(aspects.length).toBeGreaterThan(0);
    for (const a of aspects) expect(a.evidence.recordId).toBe(c.record.id);
  });

  it('does not copy the birth name into the numerology record', () => {
    const n = numbers(profile, new Date(2026, 10, 24));
    expect(canonicalJson(n.record)).not.toContain('Amelia');
  });

  it('serialises objects canonically', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe('{"a":[2,{"c":4,"d":3}],"b":1}');
    expect(contentId('x', { a: 1, b: 2 })).toBe(contentId('x', { b: 2, a: 1 }));
  });
});
