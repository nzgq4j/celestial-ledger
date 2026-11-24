// Celestial Atlas engine — low-precision astronomy, Pythagorean numerology, reading text.
// Ported from the prototype's atlas.js. Logic and copy are intentionally identical.
const D2R = Math.PI / 180;
const norm = (d: number): number => ((d % 360) + 360) % 360;
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

export interface City {
  name: string;
  lat: number;
  lon: number;
  /** Standard-time UTC offset in hours. */
  tz: number;
}

export type PlanetKey = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
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
  cityIdx: number;
  dst: boolean;
}

export type BodyPlacement = Placement & PlanetInfo & { key: BodyKey };
export type PlanetPlacement = Placement & PlanetInfo & { key: PlanetKey; retro: boolean };
export type MidheavenPlacement = Placement & { key: 'mc'; name: string; glyph: string };

export interface Chart {
  sun: BodyPlacement;
  moon: BodyPlacement;
  rising: BodyPlacement | null;
  mc: MidheavenPlacement | null;
  planets: PlanetPlacement[];
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
  moon: Placement & PlanetInfo;
  sun: Placement & PlanetInfo;
  planets: PlanetPlacement[];
  retroNotes: RetroNote[];
}

export interface Numbers {
  lifePath: number;
  expression: number;
  soulUrge: number;
  personality: number;
  birthday: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
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
}

export interface ReportCard {
  position: string;
  name: string;
  orientation: 'Upright' | 'Reversed';
  meaning: string;
}

export interface Report {
  sections: ReportSection[];
  cards: ReportCard[];
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

export const CITIES: City[] = [
  { name:'New York, USA', lat:40.71, lon:-74.01, tz:-5 }, { name:'Los Angeles, USA', lat:34.05, lon:-118.24, tz:-8 },
  { name:'Chicago, USA', lat:41.88, lon:-87.63, tz:-6 }, { name:'Denver, USA', lat:39.74, lon:-104.99, tz:-7 },
  { name:'Toronto, Canada', lat:43.65, lon:-79.38, tz:-5 }, { name:'Mexico City, Mexico', lat:19.43, lon:-99.13, tz:-6 },
  { name:'São Paulo, Brazil', lat:-23.55, lon:-46.63, tz:-3 }, { name:'London, UK', lat:51.51, lon:-0.13, tz:0 },
  { name:'Paris, France', lat:48.86, lon:2.35, tz:1 }, { name:'Avignon, France', lat:43.95, lon:4.81, tz:1 },
  { name:'Madrid, Spain', lat:40.42, lon:-3.70, tz:1 }, { name:'Rome, Italy', lat:41.90, lon:12.50, tz:1 },
  { name:'Berlin, Germany', lat:52.52, lon:13.40, tz:1 }, { name:'Lagos, Nigeria', lat:6.52, lon:3.38, tz:1 },
  { name:'Cairo, Egypt', lat:30.04, lon:31.24, tz:2 }, { name:'Dubai, UAE', lat:25.20, lon:55.27, tz:4 },
  { name:'Mumbai, India', lat:19.08, lon:72.88, tz:5.5 }, { name:'Singapore', lat:1.35, lon:103.82, tz:8 },
  { name:'Seoul, South Korea', lat:37.57, lon:126.98, tz:9 }, { name:'Tokyo, Japan', lat:35.68, lon:139.69, tz:9 },
  { name:'Sydney, Australia', lat:-33.87, lon:151.21, tz:10 },
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
};

const RETRO: Record<PlanetKey, string> = {
  mercury:'Double-check messages, travel plans and contracts. Good for revisiting old work.',
  venus:'Revisit relationships and spending. Hold off on big aesthetic changes.',
  mars:'Energy turns inward. Rework strategy instead of forcing new fights.',
  jupiter:'Growth goes internal — review beliefs and long-term plans.',
  saturn:'Review commitments and structures. Fix foundations quietly.',
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

/* ---------- Astronomy (low precision, about 1°) ---------- */

type Elements = readonly [number, number, number, number, number, number, number, number, number, number, number, number];

// JPL approximate Keplerian elements (J2000, per-century rates)
const EL: Record<PlanetKey | 'earth', Elements> = {
  mercury:[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593,0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081],
  venus:[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255,0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418],
  earth:[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0,0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0],
  mars:[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891,0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343],
  jupiter:[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909,-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106],
  saturn:[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448,-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794],
};

function helio(el: Elements, T: number): [number, number] {
  const [a0,e0,I0,L0,w0,O0,da,de,dI,dL,dw,dO] = el;
  const a=a0+da*T, e=e0+de*T, I=(I0+dI*T)*D2R, L=L0+dL*T, wb=w0+dw*T, O=O0+dO*T;
  const w=(wb-O)*D2R, Om=O*D2R;
  let M = norm(L-wb); if (M>180) M-=360; M*=D2R;
  let E = M + e*Math.sin(M);
  for (let i=0;i<8;i++) E -= (E - e*Math.sin(E) - M) / (1 - e*Math.cos(E));
  const xp=a*(Math.cos(E)-e), yp=a*Math.sqrt(1-e*e)*Math.sin(E);
  const cw=Math.cos(w), sw=Math.sin(w), cO=Math.cos(Om), sO=Math.sin(Om), cI=Math.cos(I);
  return [(cw*cO - sw*sO*cI)*xp + (-sw*cO - cw*sO*cI)*yp, (cw*sO + sw*cO*cI)*xp + (-sw*sO + cw*cO*cI)*yp];
}

/**
 * Longitude provider. All chart and sky positions go through this interface so the
 * low-precision implementation below can later be replaced (for example with
 * astronomy-engine) without touching the reading logic.
 */
export interface Ephemeris {
  /** Geocentric ecliptic longitude of a planet, degrees 0..360 */
  planetLon(name: PlanetKey, jd: number): number;
  sunLon(jd: number): number;
  moonLon(jd: number): number;
  ascendant(jd: number, lat: number, lon: number): number;
  midheaven(jd: number, lon: number): number;
}

export const lowPrecisionEphemeris: Ephemeris = {
  planetLon(name, jd) {
    const T=(jd-2451545)/36525, p=helio(EL[name],T), e=helio(EL.earth,T);
    return norm(Math.atan2(p[1]-e[1], p[0]-e[0])/D2R);
  },
  sunLon(jd) {
    const n=jd-2451545, L=280.460+0.9856474*n, g=norm(357.528+0.9856003*n)*D2R;
    return norm(L + 1.915*Math.sin(g) + 0.020*Math.sin(2*g));
  },
  moonLon(jd) {
    const n=jd-2451545, L0=218.316+13.176396*n, M=(134.963+13.064993*n)*D2R, D=(297.850+12.190749*n)*D2R,
      Ms=(357.528+0.9856003*n)*D2R, F=(93.272+13.229350*n)*D2R;
    return norm(L0 + 6.289*Math.sin(M) + 1.274*Math.sin(2*D-M) + 0.658*Math.sin(2*D) + 0.214*Math.sin(2*M) - 0.186*Math.sin(Ms) - 0.114*Math.sin(2*F));
  },
  ascendant(jd, lat, lon) {
    const T=(jd-2451545)/36525, ramc=norm(280.46061837+360.98564736629*(jd-2451545)+lon)*D2R;
    const eps=(23.4393-0.013*T)*D2R, phi=lat*D2R;
    return norm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc)*Math.cos(eps) + Math.tan(phi)*Math.sin(eps)))/D2R);
  },
  midheaven(jd, lon) {
    const T=(jd-2451545)/36525, ramc=norm(280.46061837+360.98564736629*(jd-2451545)+lon)*D2R, eps=(23.4393-0.013*T)*D2R;
    return norm(Math.atan2(Math.sin(ramc), Math.cos(ramc)*Math.cos(eps))/D2R);
  },
};

let ephemeris: Ephemeris = lowPrecisionEphemeris;
/** Swap the longitude provider. Returns the previous one. */
export function setEphemeris(next: Ephemeris): Ephemeris {
  const prev = ephemeris;
  ephemeris = next;
  return prev;
}

const place = (lon: number): Placement => { const i=Math.floor(lon/30); return { lon, signIdx:i, sign:SIGNS[i], deg:Math.floor(lon%30), min:Math.floor((lon%1)*60) }; };
const isRetro = (name: PlanetKey, jd: number): boolean => norm(ephemeris.planetLon(name, jd+1) - ephemeris.planetLon(name, jd)) > 180;

const PLANET_KEYS: PlanetKey[] = ['mercury','venus','mars','jupiter','saturn'];

/** Julian day of the birth moment. Unknown time uses local noon. */
export function birthJD(p: Profile): number {
  const [y,m,d] = p.date.split('-').map(Number);
  const [hh,mm] = (p.timeUnknown || !p.time ? '12:00' : p.time).split(':').map(Number);
  const c = CITIES[p.cityIdx] || CITIES[0];
  const ms = Date.UTC(y, m-1, d, hh, mm) - (c.tz + (p.dst ? 1 : 0)) * 3600e3;
  return ms/86400000 + 2440587.5;
}
const jdOf = (date: Date): number => date.getTime()/86400000 + 2440587.5;

const planetsAt = (jd: number): PlanetPlacement[] =>
  PLANET_KEYS.map(k => ({ key:k, ...PLANETS[k], ...place(ephemeris.planetLon(k, jd)), retro:isRetro(k, jd) }));

export function chart(p: Profile): Chart {
  const jd = birthJD(p), c = CITIES[p.cityIdx] || CITIES[0];
  const noTime = p.timeUnknown || !p.time;
  return {
    sun:{ key:'sun', ...PLANETS.sun, ...place(ephemeris.sunLon(jd)) },
    moon:{ key:'moon', ...PLANETS.moon, ...place(ephemeris.moonLon(jd)) },
    rising: noTime ? null : { key:'rising', ...PLANETS.rising, ...place(ephemeris.ascendant(jd, c.lat, c.lon)) },
    mc: noTime ? null : { key:'mc', name:'Midheaven', glyph:'MC', ...place(ephemeris.midheaven(jd, c.lon)) },
    planets: planetsAt(jd),
  };
}

/** Current sky. `at` defaults to now; tests pass a fixed date. */
export function sky(at: Date = new Date()): Sky {
  const jd = jdOf(at), syn = 29.530588853;
  const age = (((jd - 2451550.1) % syn) + syn) % syn;
  const idx = Math.floor((age/syn)*8 + 0.5) % 8;
  const illum = (1 - Math.cos(2*Math.PI*age/syn)) / 2;
  const planets = planetsAt(jd);
  return {
    phase:PHASES[idx][0], phaseText:PHASES[idx][1], illum, waxing: age < syn/2, age,
    moon:{ ...PLANETS.moon, ...place(ephemeris.moonLon(jd)) }, sun:{ ...PLANETS.sun, ...place(ephemeris.sunLon(jd)) },
    planets, retroNotes: planets.filter(p => p.retro).map(p => ({ name:p.name, glyph:p.glyph, text:RETRO[p.key] })),
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
export function numbers(p: Pick<Profile, 'name' | 'date'>, today: Date = new Date()): Numbers {
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

export function report(p: Profile, ch: Chart, nums: Numbers, sk: Sky, cards: readonly TarotCardLike[], today: Date = new Date()): Report {
  const lp = NUM[nums.lifePath], su = NUM[nums.soulUrge], pe = NUM[nums.personality];
  const venus = ch.planets.find(x => x.key === 'venus')!, saturn = ch.planets.find(x => x.key === 'saturn')!;
  const inSun = sk.planets.filter(x => x.signIdx === ch.sun.signIdx);
  const first = p.name.split(' ')[0];
  const sections: ReportSection[] = [
    { h:'Your core blueprint', body:`${first}, you're a ${ch.sun.sign.name} Sun with a Life Path ${nums.lifePath} — ${lp.title}. ${ch.sun.sign.core} ${lp.core}` },
    { h:'Your emotional landscape', body:`Your Moon is in ${ch.moon.sign.name}: you process feelings with ${ch.moon.sign.style}. Your Soul Urge ${nums.soulUrge} (${su.title}) adds this: ${su.core.charAt(0).toLowerCase()+su.core.slice(1)}` },
    { h:'How others see you', body: (ch.rising ? `With ${ch.rising.sign.name} rising, people first meet your ${ch.rising.sign.style}. ` : 'Add your birth time to unlock your rising sign. ') + `Your Personality number ${nums.personality} (${pe.title}) reinforces it — ${pe.keywords.toLowerCase().replace(/ · /g, ', ')}.` },
    { h:'Love', body:`Venus in ${venus.sign.name} means you show affection with ${venus.sign.style}. ${ch.sun.sign.love} ${lp.love}` },
    { h:'Work & money', body:`${ch.sun.sign.work} ${lp.work} Saturn in ${saturn.sign.name} shows where discipline pays: bring ${saturn.sign.style} to long-term goals.` },
    { h:'This year', body:`You're in a Personal Year ${nums.personalYear}. ${PERSONAL_YEAR[nums.personalYear]}` + (inSun.length ? ` Right now ${inSun.map(x=>x.name).join(' and ')} ${inSun.length>1?'are':'is'} moving through ${ch.sun.sign.name}, your Sun sign — expect that area of life to feel louder.` : '') + ` The Moon is ${sk.phase.toLowerCase()}: ${sk.phaseText.charAt(0).toLowerCase()+sk.phaseText.slice(1)}` },
    { h:'Your growth edge', body:`${lp.challenge} As a ${ch.sun.sign.name}, also watch for: ${ch.sun.sign.shadow.charAt(0).toLowerCase()+ch.sun.sign.shadow.slice(1)}` },
  ];
  const drawn = drawCards(cards, `${p.name}|${today.toDateString()}|report`, 3);
  const pos = ['What supports you','What to work on','Where this is heading'];
  return { sections, cards: drawn.map((d,i) => ({ position:pos[i], name:d.card.name, orientation: d.reversed ? 'Reversed' : 'Upright', meaning: d.reversed ? d.card.reversed : d.card.upright })) };
}
