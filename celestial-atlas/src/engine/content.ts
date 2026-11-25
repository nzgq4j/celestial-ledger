// Reader-facing text for the engine, one pack per language.
//
// Calculations, records and evidence always use the English source data in
// atlas.ts, so evidence IDs are the same in every language. Only the words a
// reader sees come from a Content pack. Templates use {placeholders}; keep every
// placeholder when translating.
import type { BodyKey, CoreNumberKey, Element, Modality, NumberMeaning, PlanetKey } from './atlas';

export interface SignText {
  name: string;
  /** Date range, e.g. "Mar 21 – Apr 19". */
  dates: string;
  ruler: string;
  keywords: string;
  /** Completes "works best with …" / "people first meet your …". */
  style: string;
  core: string;
  love: string;
  work: string;
  shadow: string;
}

export interface BandText { band: string; body: string }

export interface Content {
  /** BCP 47 tag used for dates, e.g. "en-US". */
  locale: string;
  /** False where nouns keep their capital (German), so inline text is not lower-cased. */
  lowercaseInline: boolean;
  signs: SignText[];
  elements: Record<Element, string>;
  modalities: Record<Modality, string>;
  bodies: Record<BodyKey, { name: string; governs: string; practical: string }>;
  midheaven: string;
  retro: Record<PlanetKey, string>;
  /** Eight phases from New Moon: [name, guidance]. */
  phases: ReadonlyArray<readonly [string, string]>;
  /** Keyed by the English aspect name (Conjunction, Sextile, Square, Trine, Opposition). */
  aspects: Record<string, { name: string; text: string }>;
  num: Record<number, NumberMeaning>;
  numTypes: Record<CoreNumberKey, { label: string; frame: string }>;
  personalYear: Record<number, string>;
  personalDay: Record<number, string>;
  horoscope: {
    open: Record<Element, string[]>;
    love: string[];
    work: string[];
    well: string[];
    keynotes: string[];
    /** Monday first. */
    days: string[];
    moonRel: { same: string; support: string; tense: string };
    /** {open} {sign} {style} */
    overview: string;
    /** {shadow} */
    trap: string;
    /** {date} */
    weekOf: string;
    /** {day} */
    bestDay: string;
    /** {list} */
    keyDates: string;
    /** {date} {note} */
    keyDate: string;
    /** Separator between key dates. */
    keyDateSeparator: string;
  };
  compat: {
    sign: {
      mirror: BandText;
      opposite: BandText;
      /** {element} */
      same: BandText;
      /** {a} {b} (elements) */
      support: BandText;
      /** {a} {b} (elements) */
      tense: BandText;
      /** {a} {aKeywords} {b} {bKeywords} {aLove} */
      tail: string;
    };
    num: {
      mirror: BandText;
      natural: BandText;
      complementary: BandText;
      growth: BandText;
      /** {a} {aTitle} {aKeywords} {b} {bTitle} {bKeywords} */
      tail: string;
    };
  };
  report: {
    headings: { core: string; emotional: string; seen: string; love: string; work: string; year: string; growth: string };
    /** Three card positions: supports, work on, heading. */
    positions: [string, string, string];
    /** {first} {sun} {lifePath} {lpTitle} {sunCore} {lpCore} */
    core: string;
    /** {signs} {soulUrge} {suTitle} {suCore} — {signs} joined with `or` */
    moonUncertain: string;
    or: string;
    /** {moon} {moonStyle} {soulUrge} {suTitle} {suCore} */
    moon: string;
    /** {rising} {risingStyle} */
    rising: string;
    noRising: string;
    /** {personality} {peTitle} {peKeywords} */
    personality: string;
    /** {venus} {venusStyle} {sunLove} {lpLove} */
    love: string;
    /** {sunWork} {lpWork} {saturn} {saturnStyle} */
    work: string;
    /** {year} {yearText} */
    year: string;
    /** {planets} {sun} — singular and plural forms */
    transitOne: string;
    transitMany: string;
    and: string;
    /** {phase} {phaseText} */
    moonPhase: string;
    /** {challenge} {sun} {shadow} */
    growth: string;
  };
  tarot: {
    cards: Record<string, { name: string; upright: string; reversed: string }>;
    decks: Record<string, { name: string; tagline: string }>;
    spreads: Record<string, { name: string; time: string; blurb: string; positions: string[] }>;
    /** {position} {card} {meaning}; {reversed} is replaced by `reversedSuffix` or nothing */
    narrative: string;
    reversedSuffix: string;
  };
  notification: {
    /** {day} {moon} */
    title: string;
  };
}

/** Replace {placeholders}; unknown names are left as they are. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
