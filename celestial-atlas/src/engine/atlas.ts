// Celestial Atlas engine — astronomy (astronomy-engine), Pythagorean numerology, reading text.
// Ported from the prototype's atlas.js. Reading logic and copy are unchanged. Positions now
// come from astronomy-engine, birth times are resolved with IANA time zones, Uranus,
// Neptune and Pluto are included, and every calculated fact carries an evidence ID.
import { DateTime } from 'luxon';
import citiesMeta from '../data/cities-meta.json';
import {
  ENGINE_NAME, ENGINE_VERSION, angles as calcAngles, longitude, moonElongation, normalize as norm, speed,
} from './ephemeris';
import type { Place } from './places';
import {
  CALCULATION_VERSION, collect, contentId, makeEvidence, sealRecord,
  type BirthChartRecord, type CardDrawRecord, type Evidence, type EvidenceMap, type NumerologyRecord, type SkyRecord,
} from './records';
import { resolveBirthTime, type Disambiguation } from './time';

const VS = '︎';

/* ---------- Types ---------- */

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

export interface Sign {
  name: string;
  glyph: string;
  dates: string;
  element: Element;
  modality: Modality;
  ruler: string;
  keywords: string;
  style: string;
  core: string;
  love: string;
  work: string;
  shadow: string;
}

export type PlanetKey = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';
export type BodyKey = 'sun' | 'moon' | 'rising' | PlanetKey;

export interface PlanetInfo {
  name: string;
  glyph: string;
  governs: string;
  practical: string;
}

export interface Placement {
  lon: number;
  signIdx: number;
  sign: Sign;
  deg: number;
  min: number;
}

export interface Profile {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, or empty when unknown */
  time: string;
  timeUnknown: boolean;
  place: Place;
  /** Needed only when the local time occurred twice (clocks went back). */
  disambiguation?: Disambiguation;
}

interface WithEvidence { evidenceId: string }
export type BodyPlacement = Placement & PlanetInfo & WithEvidence & { key: BodyKey };
export type PlanetPlacement = Placement & PlanetInfo & WithEvidence & { key: PlanetKey; retro: boolean };
export type MidheavenPlacement = Placement & WithEvidence & { key: 'mc'; name: string; glyph: string };

export type AspectKind = 'blend' | 'soft' | 'hard';
export interface AspectDef {
  name: string;
  angle: number;
  orb: number;
  glyph: string;
  kind: AspectKind;
  text: string;
}
export interface Aspect {
  a: BodyKey;
  b: BodyKey;
  aName: string;
  bName: string;
  def: AspectDef;
  /** Distance from the exact angle, degrees */
  orb: number;
  evidenceId: string;
  evidence: Evidence;
}

export interface Chart {
  sun: BodyPlacement;
  moon: BodyPlacement & {
    /** True when the birth time is unknown and the Moon may have changed sign that day. */
    uncertain: boolean;
    /** Every sign the Moon occupied on the birth date when the time is unknown. */
    possibleSigns: Sign[];
  };
  rising: BodyPlacement | null;
  mc: MidheavenPlacement | null;
  planets: PlanetPlacement[];
  /** Equal-house cusps from the Ascendant; empty when the time is unknown. */
  houses: { house: number; lon: number; evidenceId: string }[];
  record: BirthChartRecord;
  evidence: EvidenceMap;
}

export interface RetroNote {
  name: string;
  glyph: string;
  text: string;
}

export interface Sky {
  phase: string;
  phaseText: string;
  /** Illuminated fraction, 0..1 */
  illum: number;
  waxing: boolean;
  /** Days since new moon */
  age: number;
  moon: Placement & PlanetInfo & WithEvidence;
  sun: Placement & PlanetInfo & WithEvidence;
  planets: PlanetPlacement[];
  retroNotes: RetroNote[];
  phaseEvidenceId: string;
  record: SkyRecord;
  evidence: EvidenceMap;
}

export interface NumbersCore {
  lifePath: number;
  expression: number;
  soulUrge: number;
  personality: number;
  birthday: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}
export type NumberKey = keyof NumbersCore;
export interface Numbers extends NumbersCore {
  evidenceIds: Record<NumberKey, string>;
  record: NumerologyRecord;
  evidence: EvidenceMap;
}

export type CoreNumberKey = 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday';

export interface NumberMeaning {
  title: string;
  keywords: string;
  core: string;
  love: string;
  work: string;
  challenge: string;
}

export interface NumberType {
  key: CoreNumberKey;
  label: string;
  frame: string;
}

export type Period = 'daily' | 'weekly' | 'monthly';

export interface Rating {
  label: string;
  value: number;
}

export interface Horoscope {
  sign: Sign;
  period: Period;
  label: string;
  overview: string;
  love: string;
  work: string;
  well: string;
  ratings: Rating[];
  lucky: number;
  extra: string | null;
}

export interface Compat {
  score: number;
  band: string;
  text: string;
}

export interface TarotCardLike {
  id: string;
  name: string;
  upright: string;
  reversed: string;
}

export interface Drawn<C> {
  card: C;
  reversed: boolean;
}

export interface ReportSection {
  h: string;
  body: string;
  /** Evidence behind every claim in this section. */
  evidenceIds: string[];
}

export interface ReportCard {
  position: string;
  name: string;
  orientation: 'Upright' | 'Reversed';
  meaning: string;
  evidenceId: string;
}

export interface Report {
  sections: ReportSection[];
  cards: ReportCard[];
  /** IDs of every record the report draws on. */
  recordIds: string[];
  /** All evidence referenced by the report. */
  evidence: EvidenceMap;
}

/* ---------- Reference data ---------- */

export const SIGNS: Sign[] = [
  { name:'Aries', glyph:'♈'+VS, dates:'Mar 21 – Apr 19', element:'Fire', modality:'Cardinal', ruler:'Mars', keywords:'Bold, direct, competitive', style:'direct, fast-moving, first-in energy',
    core:'You lead with action and figure out the details on the way. Your best asset is momentum; your lesson is follow-through.',
    love:'You want honesty and a bit of chase. Boredom ends things faster than conflict does.',
    work:'You thrive on starting things — launches, turnarounds, anything with a clear win.',
    shadow:'Impatience. Count to ten before sending the reply.' },
  { name:'Taurus', glyph:'♉'+VS, dates:'Apr 20 – May 20', element:'Earth', modality:'Fixed', ruler:'Venus', keywords:'Steady, sensual, loyal', style:'steady, sensual, value-driven energy',
    core:"You build slowly and keep what you build. People trust you because you don't change your story.",
    love:'Loyalty and physical presence matter more than grand gestures. Show up consistently.',
    work:'Excellent with money, craft, and anything that rewards patience.',
    shadow:'Stubbornness — holding a position past the point it serves you.' },
  { name:'Gemini', glyph:'♊'+VS, dates:'May 21 – Jun 20', element:'Air', modality:'Mutable', ruler:'Mercury', keywords:'Curious, quick, social', style:'curious, quick, conversational energy',
    core:'You process the world by talking, reading, and connecting dots. Variety keeps you sharp.',
    love:'You need a partner you can talk to for hours. Mental chemistry comes first.',
    work:'Strong in communication, sales, writing, teaching — anything with ideas in motion.',
    shadow:'Scattered focus. Finish one thing before opening three more.' },
  { name:'Cancer', glyph:'♋'+VS, dates:'Jun 21 – Jul 22', element:'Water', modality:'Cardinal', ruler:'Moon', keywords:'Protective, intuitive, caring', style:'protective, intuitive, home-centered energy',
    core:'You read the emotional temperature of a room instantly. Safety and belonging drive most of your choices.',
    love:'Deeply loyal once you feel secure. You show love by taking care of people.',
    work:'Natural in care, hospitality, real estate, and building teams that feel like family.',
    shadow:'Retreating instead of saying what hurt you.' },
  { name:'Leo', glyph:'♌'+VS, dates:'Jul 23 – Aug 22', element:'Fire', modality:'Fixed', ruler:'Sun', keywords:'Warm, expressive, generous', style:'warm, expressive, generous energy',
    core:"You bring energy into a room and people notice. You do your best work when it's seen and appreciated.",
    love:'Generous and affectionate; you need to feel chosen, not tolerated.',
    work:'Leadership, performance, creative direction — anywhere confidence is currency.',
    shadow:'Taking feedback as a personal attack.' },
  { name:'Virgo', glyph:'♍'+VS, dates:'Aug 23 – Sep 22', element:'Earth', modality:'Mutable', ruler:'Mercury', keywords:'Precise, practical, helpful', style:'precise, practical, improvement-minded energy',
    core:"You notice what's broken and quietly fix it. Usefulness is how you show you care.",
    love:'You show love through acts of service; you need a partner who notices the small things.',
    work:'Exceptional at analysis, editing, health, operations — anything where detail matters.',
    shadow:'Perfectionism that turns into self-criticism.' },
  { name:'Libra', glyph:'♎'+VS, dates:'Sep 23 – Oct 22', element:'Air', modality:'Cardinal', ruler:'Venus', keywords:'Diplomatic, fair, aesthetic', style:'diplomatic, aesthetic, partnership-oriented energy',
    core:"You see every side and look for the fair outcome. Beauty and balance aren't extras for you — they're necessities.",
    love:'Partnership is central. You thrive with someone who meets you halfway.',
    work:'Strong in negotiation, design, law, people roles — anywhere judgement and tact matter.',
    shadow:'Avoiding conflict until resentment builds.' },
  { name:'Scorpio', glyph:'♏'+VS, dates:'Oct 23 – Nov 21', element:'Water', modality:'Fixed', ruler:'Pluto & Mars', keywords:'Intense, perceptive, loyal', style:'intense, perceptive, all-or-nothing energy',
    core:"You go deep or not at all. You read motives easily and don't forget much.",
    love:"Trust is earned slowly, then given completely. Half-commitment doesn't work for you.",
    work:'Research, finance, psychology, crisis work — anything that requires seeing beneath the surface.',
    shadow:'Testing people instead of asking them directly.' },
  { name:'Sagittarius', glyph:'♐'+VS, dates:'Nov 22 – Dec 21', element:'Fire', modality:'Mutable', ruler:'Jupiter', keywords:'Adventurous, candid, optimistic', style:'adventurous, candid, big-picture energy',
    core:'You need room to explore — places, ideas, beliefs. Optimism is your engine.',
    love:'You want a partner who is also a travel companion, literal or not. Freedom and honesty matter most.',
    work:'Teaching, travel, publishing, strategy — work with a horizon.',
    shadow:'Overpromising, then needing an exit.' },
  { name:'Capricorn', glyph:'♑'+VS, dates:'Dec 22 – Jan 19', element:'Earth', modality:'Cardinal', ruler:'Saturn', keywords:'Disciplined, strategic, driven', style:'disciplined, strategic, long-game energy',
    core:'You play the long game and usually win it. Responsibility feels natural to you, sometimes too natural.',
    love:'Steady, committed, and quietly romantic. You show love by building a future.',
    work:'Management, finance, architecture, entrepreneurship — anything with structure and a ladder.',
    shadow:'Working through feelings instead of feeling them.' },
  { name:'Aquarius', glyph:'♒'+VS, dates:'Jan 20 – Feb 18', element:'Air', modality:'Fixed', ruler:'Uranus & Saturn', keywords:'Independent, inventive, principled', style:'independent, inventive, future-facing energy',
    core:"You think differently and you're comfortable with that. Causes and communities matter to you more than conventions.",
    love:'You need friendship at the core and space to stay yourself.',
    work:'Technology, science, activism, systems design — work that changes how things are done.',
    shadow:'Detaching when things get emotional.' },
  { name:'Pisces', glyph:'♓'+VS, dates:'Feb 19 – Mar 20', element:'Water', modality:'Mutable', ruler:'Neptune & Jupiter', keywords:'Imaginative, empathetic, fluid', style:'imaginative, empathetic, fluid energy',
    core:"You absorb what's around you — moods, music, other people's stories. Creativity and compassion come easily.",
    love:'Romantic and devoted; your work is choosing partners who give back as much as you give.',
    work:'Art, music, healing, nonprofit work — anything that connects people to meaning.',
    shadow:'Escaping instead of setting a boundary.' },
];

export const PLANETS: Record<BodyKey, PlanetInfo> = {
  sun:{ name:'Sun', glyph:'☉'+VS, governs:'Core identity — who you are at your center and what energizes you', practical:'Lean into this when choosing work and goals.' },
  moon:{ name:'Moon', glyph:'☽'+VS, governs:'Emotional needs — what makes you feel safe and how you react under stress', practical:"Honor this when you're tired or upset." },
  rising:{ name:'Rising', glyph:'AC', governs:'First impression — how you come across and approach new situations', practical:'This is the energy people meet first.' },
  mercury:{ name:'Mercury', glyph:'☿'+VS, governs:'Mind & communication — how you think, learn, and talk', practical:'Use it to choose how you study, write, and negotiate.' },
  venus:{ name:'Venus', glyph:'♀'+VS, governs:'Love & values — what you find beautiful and how you show affection', practical:'Use it to understand what you need in a partner.' },
  mars:{ name:'Mars', glyph:'♂'+VS, governs:'Drive & conflict — how you act, compete, and get angry', practical:'Work with this energy, not against it.' },
  jupiter:{ name:'Jupiter', glyph:'♃'+VS, governs:'Growth & luck — where opportunity and generosity flow', practical:'Say yes in this area.' },
  saturn:{ name:'Saturn', glyph:'♄'+VS, governs:'Discipline & lessons — where you face pressure and build mastery', practical:'Slow, steady effort here pays off most.' },
  // New copy (not in the prototype): outer planets added with the astronomy-engine switch.
  uranus:{ name:'Uranus', glyph:'♅'+VS, governs:'Change & independence — where you break patterns and want freedom', practical:'Experiment here; the usual rules fit you least.' },
  neptune:{ name:'Neptune', glyph:'♆'+VS, governs:'Imagination & ideals — where you dream, blur lines, and look for meaning', practical:'Let creativity lead here, and check the facts.' },
  pluto:{ name:'Pluto', glyph:'♇'+VS, governs:'Depth & transformation — where you go all the way down and rebuild', practical:'Change here is slow and lasting. Loosen your grip.' },
};

const RETRO: Record<PlanetKey, string> = {
  mercury:'Double-check messages, travel plans and contracts. Good for revisiting old work.',
  venus:'Revisit relationships and spending. Hold off on big aesthetic changes.',
  mars:'Energy turns inward. Rework strategy instead of forcing new fights.',
  jupiter:'Growth goes internal — review beliefs and long-term plans.',
  saturn:'Review commitments and structures. Fix foundations quietly.',
  // New copy (not in the prototype).
  uranus:'Change works on the inside first. Notice where you want more room.',
  neptune:'Illusions thin out. A good stretch for checking what is real.',
  pluto:'Old patterns come up for review. Let go of what you have outgrown.',
};

const PHASES: ReadonlyArray<readonly [string, string]> = [
  ['New Moon','Set intentions. A quiet start — plan rather than push.'],
  ['Waxing Crescent','Take the first small steps on what you set in motion.'],
  ['First Quarter','Decision point. Push through the first obstacle.'],
  ['Waxing Gibbous',"Refine and adjust. You're close."],
  ['Full Moon','Peak emotion and visibility. Things come to light — celebrate or release.'],
  ['Waning Gibbous',"Share what you've learned. Gratitude and generosity."],
  ['Last Quarter',"Let go of what didn't work. Clear space."],
  ['Waning Crescent','Rest and recharge before the next cycle.'],
];

export const ASPECTS: AspectDef[] = [
  { name:'Conjunction', angle:0, orb:8, glyph:'☌', kind:'blend', text:'blend and amplify each other — this energy is concentrated in you.' },
  { name:'Sextile', angle:60, orb:5, glyph:'⚹', kind:'soft', text:'cooperate easily — an opportunity, but one you have to act on.' },
  { name:'Square', angle:90, orb:7, glyph:'□', kind:'hard', text:'create friction that pushes you to grow. Tension here becomes drive.' },
  { name:'Trine', angle:120, orb:7, glyph:'△', kind:'soft', text:'flow naturally — a built-in talent you may take for granted.' },
  { name:'Opposition', angle:180, orb:8, glyph:'☍', kind:'hard', text:'pull in opposite directions. Your work is balancing both, not choosing one.' },
];

/* ---------- Positions ---------- */

export const PLANET_KEYS: PlanetKey[] = ['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
/** Planets in the prototype's free/premium split; outer planets follow them. */
export const CLASSIC_PLANETS: PlanetKey[] = ['mercury','venus','mars','jupiter','saturn'];

export const place = (lon: number): Placement => {
  const L = norm(lon), i = Math.floor(L / 30), within = L - i * 30, deg = Math.floor(within);
  return { lon: L, signIdx: i, sign: SIGNS[i], deg, min: Math.floor((within - deg) * 60 + 1e-8) };
};

export const formatPosition = (p: Placement): string =>
  `${p.sign.name} ${p.deg}°${String(p.min).padStart(2, '0')}′ (${p.lon.toFixed(2)}°)`;

const planetsAt = (date: Date, recordId: string): PlanetPlacement[] => PLANET_KEYS.map(k => {
  const p = place(longitude(k, date)), retro = speed(k, date) < 0;
  const evidenceId = makeEvidence(recordId, 'position', k, `${formatPosition(p)}${retro ? ' retrograde' : ''}`).id;
  return { key: k, ...PLANETS[k], ...p, retro, evidenceId };
});

/** Aspects between the given bodies, using the prototype's orbs (first matching aspect wins). */
export function findAspects(
  bodies: ReadonlyArray<Placement & { key: BodyKey; name: string }>,
  recordId: string,
): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    let diff = Math.abs(bodies[i].lon - bodies[j].lon); if (diff > 180) diff = 360 - diff;
    const def = ASPECTS.find(a => Math.abs(diff - a.angle) <= a.orb);
    if (!def) continue;
    const orb = Math.abs(diff - def.angle);
    const evidence = makeEvidence(recordId, 'aspect', `${bodies[i].key}-${bodies[j].key}`, `${def.name}, ${orb.toFixed(2)}° orb`);
    out.push({ a: bodies[i].key, b: bodies[j].key, aName: bodies[i].name, bName: bodies[j].name, def, orb, evidenceId: evidence.id, evidence });
  }
  return out;
}

export function chart(p: Profile): Chart {
  const zone = p.place.timeZone;
  const timeKnown = !(p.timeUnknown || !p.time);
  const t = resolveBirthTime(p, zone);
  const jsDate = t.utc;

  // Unknown time: check the Moon across the whole local birth date.
  const possibleSigns: Sign[] = [];
  if (!timeKnown) {
    const start = DateTime.fromISO(p.date, { zone }).startOf('day');
    const end = start.endOf('day');
    const a = Math.floor(longitude('moon', start.toJSDate()) / 30), b = Math.floor(longitude('moon', end.toJSDate()) / 30);
    for (let i = a; ; i = (i + 1) % 12) { possibleSigns.push(SIGNS[i]); if (i === b) break; }
  }
  const moonUncertain = possibleSigns.length > 1;

  const record = sealRecord<BirthChartRecord>({
    kind: 'birth-chart', calculationVersion: CALCULATION_VERSION, engine: ENGINE_NAME, engineVersion: ENGINE_VERSION,
    zodiac: 'tropical', coordinateFrame: 'geocentric apparent ecliptic of date', houseSystem: timeKnown ? 'equal' : 'none',
    nodeType: 'not calculated', placeData: `${citiesMeta.source} ${citiesMeta.generated}`, placeId: p.place.id,
    latitude: p.place.lat, longitude: p.place.lon, timeZone: zone, localDate: p.date, localTime: timeKnown ? p.time : null,
    timeResolution: t.resolution, utc: jsDate.toISOString(), utcOffsetMinutes: t.offsetMinutes, timeKnown, moonSignUncertain: moonUncertain,
  });
  const rid = record.id;
  const ev: Evidence[] = [];
  const body = (key: 'sun' | 'moon', lon: number): BodyPlacement => {
    const pl = place(lon);
    const e = makeEvidence(rid, 'position', key, formatPosition(pl) + (key === 'moon' && moonUncertain ? ' (time unknown; sign uncertain)' : ''));
    ev.push(e);
    return { key, ...PLANETS[key], ...pl, evidenceId: e.id };
  };
  const sun = body('sun', longitude('sun', jsDate));
  const moon = { ...body('moon', longitude('moon', jsDate)), uncertain: moonUncertain, possibleSigns };
  const planets = planetsAt(jsDate, rid);
  for (const pl of planets) ev.push(makeEvidence(rid, 'position', pl.key, `${formatPosition(pl)}${pl.retro ? ' retrograde' : ''}`));

  let rising: BodyPlacement | null = null, mc: MidheavenPlacement | null = null;
  const houses: Chart['houses'] = [];
  if (timeKnown) {
    const ang = calcAngles(jsDate, p.place.lat, p.place.lon);
    const asc = place(ang.ascendant), mid = place(ang.midheaven);
    const eA = makeEvidence(rid, 'angle', 'ascendant', formatPosition(asc));
    const eM = makeEvidence(rid, 'angle', 'midheaven', formatPosition(mid));
    ev.push(eA, eM);
    rising = { key: 'rising', ...PLANETS.rising, ...asc, evidenceId: eA.id };
    mc = { key: 'mc', name: 'Midheaven', glyph: 'MC', ...mid, evidenceId: eM.id };
    for (let h = 0; h < 12; h++) {
      const lon = norm(ang.ascendant + h * 30);
      const e = makeEvidence(rid, 'house', `house-${h + 1}`, `Equal house ${h + 1} cusp ${formatPosition(place(lon))}`);
      ev.push(e);
      houses.push({ house: h + 1, lon, evidenceId: e.id });
    }
  }
  return { sun, moon, rising, mc, planets, houses, record, evidence: collect(...ev) };
}

/**
 * Aspects for a chart. Moon aspects are left out when the birth time is unknown,
 * because the Moon moves about 13° in a day and those aspects depend on the exact time.
 */
export function chartAspects(ch: Chart, bodies: ReadonlyArray<BodyPlacement | PlanetPlacement>): Aspect[] {
  const usable = ch.record.timeKnown ? bodies : bodies.filter(b => b.key !== 'moon');
  return findAspects(usable, ch.record.id);
}

const SYNODIC = 29.530588853;

/** Current sky. `at` defaults to now; tests pass a fixed date. */
export function sky(at: Date = new Date()): Sky {
  const record = sealRecord<SkyRecord>({
    kind: 'sky', calculationVersion: CALCULATION_VERSION, engine: ENGINE_NAME, engineVersion: ENGINE_VERSION,
    zodiac: 'tropical', coordinateFrame: 'geocentric apparent ecliptic of date', utc: at.toISOString(),
  });
  const rid = record.id;
  const elong = moonElongation(at);
  const age = elong / 360 * SYNODIC;
  const idx = Math.floor((age/SYNODIC)*8 + 0.5) % 8;
  const illum = (1 - Math.cos(elong * Math.PI / 180)) / 2;
  const planets = planetsAt(at, rid);
  const sunP = place(longitude('sun', at)), moonP = place(longitude('moon', at));
  const eSun = makeEvidence(rid, 'position', 'sun', formatPosition(sunP));
  const eMoon = makeEvidence(rid, 'position', 'moon', formatPosition(moonP));
  const ePhase = makeEvidence(rid, 'phase', 'moon-phase', `${PHASES[idx][0]}, ${Math.round(illum * 100)}% lit, elongation ${elong.toFixed(2)}°`);
  const ev = [eSun, eMoon, ePhase, ...planets.map(pl => makeEvidence(rid, 'position', pl.key, `${formatPosition(pl)}${pl.retro ? ' retrograde' : ''}`))];
  return {
    phase:PHASES[idx][0], phaseText:PHASES[idx][1], illum, waxing: elong < 180, age,
    moon:{ ...PLANETS.moon, ...moonP, evidenceId: eMoon.id }, sun:{ ...PLANETS.sun, ...sunP, evidenceId: eSun.id },
    planets, retroNotes: planets.filter(p => p.retro).map(p => ({ name:p.name, glyph:p.glyph, text:RETRO[p.key] })),
    phaseEvidenceId: ePhase.id, record, evidence: collect(...ev),
  };
}

/* ---------- Numerology ---------- */
const digits = (n: number): number => String(n).split('').reduce((s,d) => s + +d, 0);
export const reduce = (n: number, master = true): number => { while (n > 9 && !(master && (n===11||n===22||n===33))) n = digits(n); return n; };
const letterVal = (ch: string): number => ('abcdefghijklmnopqrstuvwxyz'.indexOf(ch) % 9) + 1;
const clean = (s: string | null | undefined): string => (s||'').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const sumLetters = (s: string, f: (ch: string) => boolean): number => clean(s).split('').filter(f).reduce((t,ch) => t + letterVal(ch), 0);
const isVowel = (ch: string): boolean => 'aeiou'.includes(ch);

export function lifePathOf(date: string): number {
  const [y,m,d] = date.split('-').map(Number);
  return reduce(reduce(m) + reduce(d) + reduce(y));
}

/** The prototype's numerology, without records. */
export function numbersCore(p: Pick<Profile, 'name' | 'date'>, today: Date = new Date()): NumbersCore {
  const [, m, d] = p.date.split('-').map(Number);
  const py = reduce(reduce(m,false) + reduce(d,false) + reduce(today.getFullYear(),false), false);
  const pm = reduce(py + today.getMonth() + 1, false);
  const pd = reduce(pm + today.getDate(), false);
  return {
    lifePath: lifePathOf(p.date),
    expression: reduce(sumLetters(p.name, () => true)),
    soulUrge: reduce(sumLetters(p.name, isVowel)),
    personality: reduce(sumLetters(p.name, ch => !isVowel(ch))),
    birthday: reduce(d),
    personalYear: py, personalMonth: pm, personalDay: pd,
  };
}

const localISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function numbers(p: Pick<Profile, 'name' | 'date'>, today: Date = new Date()): Numbers {
  const core = numbersCore(p, today);
  const record = sealRecord<NumerologyRecord>({
    kind: 'numerology', calculationVersion: CALCULATION_VERSION, method: 'pythagorean', masterNumbers: [11, 22, 33],
    birthDate: p.date, referenceDate: localISODate(today), nameHash: contentId('name', clean(p.name)),
  });
  const keys = Object.keys(core) as NumberKey[];
  const ev = keys.map(k => makeEvidence(record.id, k.startsWith('personal') ? 'cycle' : 'number', k, String(core[k])));
  const evidenceIds = Object.fromEntries(keys.map((k, i) => [k, ev[i].id])) as Record<NumberKey, string>;
  return { ...core, evidenceIds, record, evidence: collect(...ev) };
}

export const NUM: Record<number, NumberMeaning> = {
  1:{ title:'The Initiator', keywords:'Independence · drive · originality', core:"You're built to start things and to do them your own way. Confidence grows every time you act without waiting for permission.", love:"You need a partner who respects your independence and doesn't compete for the wheel.", work:'Founder, lead, freelancer — roles where you set the direction.', challenge:'Asking for help without feeling it is a weakness.' },
  2:{ title:'The Diplomat', keywords:'Cooperation · sensitivity · partnership', core:"You're the one who makes partnerships work. You notice what others need and quietly bring people together.", love:'Deeply devoted; you thrive with steady reassurance and real teamwork.', work:'Mediator, counselor, partner, editor — roles that make the whole thing run.', challenge:"Saying what you want before you've checked what everyone else wants." },
  3:{ title:'The Communicator', keywords:'Expression · creativity · joy', core:"You're here to express — through words, art, humor, or style. Your energy lifts people.", love:'You need fun, conversation, and a partner who enjoys your spotlight.', work:'Writing, design, performance, marketing — anything creative and social.', challenge:'Finishing projects once the initial excitement fades.' },
  4:{ title:'The Builder', keywords:'Stability · discipline · reliability', core:'You build things that last. Systems, routines, and hard work are how you turn plans into reality.', love:'Loyal and dependable; you show love by creating security.', work:'Engineering, operations, finance, trades — work that rewards structure.', challenge:'Letting plans change without feeling like everything is failing.' },
  5:{ title:'The Explorer', keywords:'Freedom · change · curiosity', core:"You learn by doing and need variety to feel alive. Change doesn't scare you — standing still does.", love:"You need a partner who's up for adventure and doesn't mistake your need for space as distance.", work:'Travel, sales, media, entrepreneurship — anything fast and varied.', challenge:'Committing to the boring middle of a project or relationship.' },
  6:{ title:'The Nurturer', keywords:'Responsibility · care · home', core:'You take care of people and spaces. Others naturally come to you for support and advice.', love:'Devoted and family-oriented; you need appreciation for what you give.', work:"Teaching, healthcare, design, hospitality — work that improves people's lives.", challenge:'Over-giving and then resenting it.' },
  7:{ title:'The Seeker', keywords:'Analysis · introspection · wisdom', core:'You need to understand how things really work. Solitude and study recharge you.', love:'You open up slowly; a partner who respects your inner world earns your trust.', work:'Research, science, tech, writing — work that rewards depth.', challenge:'Trusting people before you have all the data.' },
  8:{ title:'The Executive', keywords:'Ambition · authority · results', core:"You're wired for achievement and material success. You understand money, leverage, and authority.", love:'You want a strong partner who respects your drive — and you need reminding to make time.', work:'Business, finance, law, leadership — roles with scale and stakes.', challenge:'Balancing ambition with rest and relationships.' },
  9:{ title:'The Humanitarian', keywords:'Compassion · completion · idealism', core:"You see the bigger picture and care about leaving things better. You've often lived several lives in one.", love:'Generous and romantic; you need a partner who shares your values.', work:'Nonprofit, arts, healing, teaching, global work — anything with purpose.', challenge:"Letting go of what's finished without lingering." },
  11:{ title:'The Intuitive · Master', keywords:'Insight · inspiration · sensitivity', core:'A master number: heightened intuition and the ability to inspire. You often know things before you can explain them.', love:'Highly sensitive; you need emotional depth and gentleness.', work:'Counseling, art, teaching, visionary work.', challenge:'Managing nervous energy and self-doubt.' },
  22:{ title:'The Master Builder', keywords:'Vision · execution · legacy', core:'A master number: big vision with the practical ability to make it real. You can build things that outlast you.', love:"You need a partner who supports the scale of what you're building.", work:'Large projects, institutions, architecture, systems.', challenge:'Pressure — the gap between your potential and today can feel heavy.' },
  33:{ title:'The Master Teacher', keywords:'Compassion · service · guidance', core:'A master number: rare and service-oriented. You lift others through care, teaching, and example.', love:'Unconditional and devoted; you need to receive care too.', work:'Teaching, healing, mentorship, community leadership.', challenge:"Carrying everyone else's weight." },
};
export const NUM_TYPES: NumberType[] = [
  { key:'lifePath', label:'Life Path', frame:'Your core direction — the lessons and strengths you keep returning to. Calculated from your full birth date.' },
  { key:'expression', label:'Expression', frame:'Your natural talents and how you come across. Calculated from every letter of your full birth name.' },
  { key:'soulUrge', label:'Soul Urge', frame:'What you want most, privately. Calculated from the vowels in your name.' },
  { key:'personality', label:'Personality', frame:'The first impression you give. Calculated from the consonants in your name.' },
  { key:'birthday', label:'Birthday', frame:'A specific gift that comes easily to you. Calculated from the day you were born.' },
];
export const PERSONAL_YEAR: Record<number, string> = {
  1:'A starting year. Launch, apply, begin — what you start now sets the tone for the next nine years.',
  2:'A patience year. Relationships and partnerships grow; results come slower. Cooperate.',
  3:'A social, creative year. Say yes to invitations and share your work publicly.',
  4:'A building year. Hard work, budgets, health routines. Foundations laid now pay off later.',
  5:'A change year. Travel, moves, new people. Stay flexible and say yes to the unexpected.',
  6:'A home and responsibility year. Family, commitments, and care take center stage.',
  7:"A reflective year. Study, rest, and rethink. Don't force big outward moves.",
  8:"A power year. Career and money move. Ask for what you're worth.",
  9:"A completion year. Finish, release, clear out. Make room for next year's fresh start.",
};
export const PERSONAL_DAY: Record<number, string> = {
  1:'Start something. Send the email, make the call, take the first step.',
  2:'Listen more than you talk. Small kindnesses go far.',
  3:'Socialize, create, share. Good day for a creative task.',
  4:'Get organized. Admin, budgets, and chores feel satisfying.',
  5:'Expect the unexpected. Change your routine a little.',
  6:'Focus on home and the people you care about.',
  7:'Slow down. Read, reflect, take a walk alone.',
  8:'Handle money and business. Make the confident ask.',
  9:'Wrap things up. Clear clutter and let go of one thing.',
};

/* ---------- Seeded text ---------- */
export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i=0;i<seed.length;i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

const OPEN: Record<Element, string[]> = {
  Fire:['Your energy is high — channel it into one clear goal.','Confidence carries you; just watch the urge to rush.',"A bold move pays off if you've done the homework.","You're at your best when you take the lead."],
  Earth:['Steady progress beats dramatic gestures right now.','Practical choices set you up for real gains.','Your patience is an advantage while others rush.',"Focus on what's tangible: money, health, routine."],
  Air:['Conversations open doors — reach out.','Your ideas are sharp; write them down before they drift.','Networking and learning are favored.','A fresh perspective solves an old problem.'],
  Water:['Trust your read on people; your instincts are accurate.','Emotional honesty strengthens your closest bonds.',"Make space for rest — you're absorbing a lot.",'Creative work flows when you stop overthinking.'],
};
const LOVE = ["If something's been left unsaid, say it plainly — clarity beats guessing.","Plan something simple with someone you care about. Presence matters more than the plan.","Single? You're more noticeable than you think. Go where people are.","Don't read too much into a slow reply. Ask directly if it matters.","An old connection may resurface. Decide what you actually want before responding.","Small gestures land well — a message, a coffee, remembering a detail.","Tension at home eases if you lead with curiosity instead of being right.","Give someone the benefit of the doubt; most friction is miscommunication.","Make time for your own needs before showing up for everyone else's.","Honesty about expectations saves weeks of confusion."];
const WORK = ["Pick the one task that moves the needle and do it first.","A conversation with a manager or client goes better if you bring numbers.","Update your résumé or portfolio — someone may be looking.","Delegate the work that drains you; your time is better spent elsewhere.","Double-check details before you hit send.","An idea you've been sitting on is ready. Pitch it.","Say no to one meeting and protect a block of focus time.","Ask a colleague for a second opinion — collaboration beats solo effort.","Review your budget or invoices; small leaks add up.","Finish something you started. Momentum comes from completion."];
const WELL = ["Get outside for twenty minutes; it resets your mood.","Sleep is your highest-return investment right now.","Move your body in a way you actually enjoy.","Cut back on screens tonight — your mind needs quiet.","Drink more water and eat something real at lunch.","Book the appointment you've been putting off.","Journal for five minutes: what's actually bothering you?","Say no to one obligation. Rest isn't optional.","Stretch between tasks; tension builds quietly.","Call a friend who makes you laugh."];
const KEYNOTES = ['Good for money conversations','Social energy peaks','Rest and reset','Strong day to start something','Clear the backlog','Romance is favored','Ask for feedback','Plans and travel go smoothly'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type ElemRel = 'same' | 'support' | 'tense';
function elemRel(a: Element, b: Element): ElemRel {
  if (a === b) return 'same';
  const pair = [a,b].sort().join('-');
  return pair === 'Air-Fire' || pair === 'Earth-Water' ? 'support' : 'tense';
}
const MOON_REL: Record<ElemRel, (m: string) => string> = {
  same:(m) => `The Moon in ${m} shares your element — your instincts and emotions line up. Trust your first read today.`,
  support:(m) => `The Moon in ${m} supports your sign. Others are receptive; it's a good day to ask for something.`,
  tense:(m) => `The Moon in ${m} rubs against your element. Expect small friction — don't make big calls while irritated.`,
};

export function horoscope(signIdx: number, period: Period, date: Date = new Date(), moonIdx = 0): Horoscope {
  const s = SIGNS[signIdx];
  const startOfWeek = new Date(date); startOfWeek.setDate(date.getDate() - ((date.getDay()+6)%7));
  const key = period === 'daily' ? date.toDateString() : period === 'weekly' ? startOfWeek.toDateString() : `${date.getFullYear()}-${date.getMonth()}`;
  const r = rng(`${signIdx}|${period}|${key}`);
  const label = period === 'daily' ? date.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' })
    : period === 'weekly' ? `Week of ${startOfWeek.toLocaleDateString(undefined, { month:'long', day:'numeric' })}`
    : `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  let overview = `${pick(r, OPEN[s.element])} ${s.name} works best with ${s.style} — use it.`;
  if (period === 'daily') overview += ' ' + MOON_REL[elemRel(s.element, SIGNS[moonIdx].element)](SIGNS[moonIdx].name);
  if (period !== 'daily') overview += ` Watch for your usual trap: ${s.shadow.charAt(0).toLowerCase() + s.shadow.slice(1)}`;
  let extra: string | null = null;
  if (period === 'weekly') extra = `Best day this week: ${pick(r, DAYS)}.`;
  if (period === 'monthly') {
    const dim = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
    const ds = new Set<number>(); while (ds.size < 3) ds.add(1 + Math.floor(r()*dim));
    extra = 'Key dates: ' + [...ds].sort((a,b)=>a-b).map(d => `${MONTHS[date.getMonth()].slice(0,3)} ${d} — ${pick(r, KEYNOTES).toLowerCase()}`).join('; ') + '.';
  }
  const rate = (): number => 2 + Math.floor(r()*4);
  return {
    sign:s, period, label, overview,
    love: pick(r, LOVE) + (period === 'monthly' ? ' ' + s.love : ''),
    work: pick(r, WORK) + (period === 'monthly' ? ' ' + s.work : ''),
    well: pick(r, WELL),
    ratings:[{ label:'Love', value:rate() }, { label:'Work', value:rate() }, { label:'Energy', value:rate() }],
    lucky: 1 + Math.floor(r()*9), extra,
  };
}

export function signCompat(a: number, b: number): Compat {
  const A = SIGNS[a], B = SIGNS[b], diff = Math.abs(a-b);
  let score: number, band: string, body: string;
  if (a === b) { score = 80; band = 'Mirror match'; body = "You understand each other instantly — and share the same blind spots. Make sure someone handles what neither of you likes doing."; }
  else if (diff === 6) { score = 76; band = 'Magnetic opposites'; body = 'Strong attraction from opposite ends of the zodiac. Each of you has what the other lacks; the work is respecting it instead of trying to change it.'; }
  else {
    const rel = elemRel(A.element, B.element);
    if (rel === 'same') { score = 90; band = 'Natural match'; body = `Both ${A.element} signs — you run on the same fuel. Easy rhythm, shared values, and fewer translation problems.`; }
    else if (rel === 'support') { score = 83; band = 'Complementary'; body = `${A.element} and ${B.element} feed each other. You bring out each other's strengths when you keep talking.`; }
    else { score = 58; band = 'Growth match'; body = `${A.element} and ${B.element} work differently. It takes effort, but you'll learn the most from each other.`; }
  }
  return { score, band, text:`${body} ${A.name} brings ${A.keywords.toLowerCase()} energy; ${B.name} brings ${B.keywords.toLowerCase()}. In practice: ${A.love.charAt(0).toLowerCase()+A.love.slice(1)}` };
}

export function numCompat(a: number, b: number): Compat {
  const base = (n: number): number => n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n;
  const x = base(a), y = base(b);
  const group = (n: number): number => [1,5,7].includes(n) ? 0 : [2,4,8].includes(n) ? 1 : 2;
  const good = ['1-3','1-9','2-6','2-9','3-5','4-6','4-7','5-7','6-9','1-5','8-4'];
  let score: number, band: string, body: string;
  if (x === y) { score = 84; band = 'Mirror match'; body = 'Same core number — you instinctively get each other. Watch for competing over the same role.'; }
  else if (group(x) === group(y)) { score = 90; band = 'Natural match'; body = 'Your numbers share a core rhythm. Goals and pace tend to line up without much negotiation.'; }
  else if (good.includes([x,y].sort().join('-')) || good.includes([y,x].join('-'))) { score = 74; band = 'Complementary'; body = 'Different strengths that fit together well. Divide roles clearly and you cover each other.'; }
  else { score = 56; band = 'Growth match'; body = "Different priorities. It works when you're explicit about needs instead of assuming."; }
  return { score, band, text:`${body} You (${a}, ${NUM[a].title}) bring ${NUM[a].keywords.toLowerCase().replace(/ · /g, ', ')}. They (${b}, ${NUM[b].title}) bring ${NUM[b].keywords.toLowerCase().replace(/ · /g, ', ')}.` };
}

export function drawCards<C>(cards: readonly C[], seed: string, n: number): Drawn<C>[] {
  const r = rng(seed), pool = [...cards], out: Drawn<C>[] = [];
  for (let i=0;i<n;i++) out.push({ card: pool.splice(Math.floor(r()*pool.length),1)[0], reversed: r() < 0.35 });
  return out;
}

/** A card draw with its record and one evidence entry per card. */
export function recordDraw<C extends { id: string }>(
  drawn: Drawn<C>[], deckSize: number, seed: string | null, positions?: readonly string[],
): { record: CardDrawRecord; evidenceIds: string[]; evidence: EvidenceMap } {
  const record = sealRecord<CardDrawRecord>({
    kind: 'card-draw', calculationVersion: CALCULATION_VERSION, method: seed === null ? 'random' : 'seeded',
    seedHash: seed === null ? null : contentId('seed', seed), deckSize, count: drawn.length,
  });
  const ev = drawn.map((d, i) => makeEvidence(record.id, 'card', positions?.[i] ?? `card-${i + 1}`, `${d.card.id} ${d.reversed ? 'reversed' : 'upright'}`));
  return { record, evidenceIds: ev.map(e => e.id), evidence: collect(...ev) };
}

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

export function report(p: Profile, ch: Chart, nums: Numbers, sk: Sky, cards: readonly TarotCardLike[], today: Date = new Date()): Report {
  const lp = NUM[nums.lifePath], su = NUM[nums.soulUrge], pe = NUM[nums.personality];
  const venus = ch.planets.find(x => x.key === 'venus')!, saturn = ch.planets.find(x => x.key === 'saturn')!;
  const inSun = sk.planets.filter(x => x.signIdx === ch.sun.signIdx);
  const first = p.name.split(' ')[0];
  const n = nums.evidenceIds;
  // Without a birth time the Moon's sign is only stated when it could not have changed that day.
  const moonLine = ch.moon.uncertain
    ? `Without a birth time your Moon could be in ${ch.moon.possibleSigns.map(s => s.name).join(' or ')}, so it is left out here. Your Soul Urge ${nums.soulUrge} (${su.title}) says this: ${lowerFirst(su.core)}`
    : `Your Moon is in ${ch.moon.sign.name}: you process feelings with ${ch.moon.sign.style}. Your Soul Urge ${nums.soulUrge} (${su.title}) adds this: ${lowerFirst(su.core)}`;
  const sections: ReportSection[] = [
    { h:'Your core blueprint', body:`${first}, you're a ${ch.sun.sign.name} Sun with a Life Path ${nums.lifePath} — ${lp.title}. ${ch.sun.sign.core} ${lp.core}`,
      evidenceIds:[ch.sun.evidenceId, n.lifePath] },
    { h:'Your emotional landscape', body: moonLine,
      evidenceIds:[ch.moon.evidenceId, n.soulUrge] },
    { h:'How others see you', body: (ch.rising ? `With ${ch.rising.sign.name} rising, people first meet your ${ch.rising.sign.style}. ` : 'Add your birth time to unlock your rising sign. ') + `Your Personality number ${nums.personality} (${pe.title}) reinforces it — ${pe.keywords.toLowerCase().replace(/ · /g, ', ')}.`,
      evidenceIds:[...(ch.rising ? [ch.rising.evidenceId] : []), n.personality] },
    { h:'Love', body:`Venus in ${venus.sign.name} means you show affection with ${venus.sign.style}. ${ch.sun.sign.love} ${lp.love}`,
      evidenceIds:[venus.evidenceId, ch.sun.evidenceId, n.lifePath] },
    { h:'Work & money', body:`${ch.sun.sign.work} ${lp.work} Saturn in ${saturn.sign.name} shows where discipline pays: bring ${saturn.sign.style} to long-term goals.`,
      evidenceIds:[ch.sun.evidenceId, n.lifePath, saturn.evidenceId] },
    { h:'This year', body:`You're in a Personal Year ${nums.personalYear}. ${PERSONAL_YEAR[nums.personalYear]}` + (inSun.length ? ` Right now ${inSun.map(x=>x.name).join(' and ')} ${inSun.length>1?'are':'is'} moving through ${ch.sun.sign.name}, your Sun sign — expect that area of life to feel louder.` : '') + ` The Moon is ${sk.phase.toLowerCase()}: ${lowerFirst(sk.phaseText)}`,
      evidenceIds:[n.personalYear, ch.sun.evidenceId, ...inSun.map(x => x.evidenceId), sk.phaseEvidenceId] },
    { h:'Your growth edge', body:`${lp.challenge} As a ${ch.sun.sign.name}, also watch for: ${lowerFirst(ch.sun.sign.shadow)}`,
      evidenceIds:[n.lifePath, ch.sun.evidenceId] },
  ];
  const seed = `${p.name}|${today.toDateString()}|report`;
  const drawn = drawCards(cards, seed, 3);
  const pos = ['What supports you','What to work on','Where this is heading'];
  const draw = recordDraw(drawn, cards.length, seed, pos);
  const evidence: EvidenceMap = { ...ch.evidence, ...nums.evidence, ...sk.evidence, ...draw.evidence };
  const used = new Set([...sections.flatMap(s => s.evidenceIds), ...draw.evidenceIds]);
  return {
    sections,
    cards: drawn.map((d,i) => ({ position:pos[i], name:d.card.name, orientation: d.reversed ? 'Reversed' : 'Upright', meaning: d.reversed ? d.card.reversed : d.card.upright, evidenceId: draw.evidenceIds[i] })),
    recordIds: [ch.record.id, nums.record.id, sk.record.id, draw.record.id],
    evidence: Object.fromEntries(Object.entries(evidence).filter(([id]) => used.has(id))),
  };
}
