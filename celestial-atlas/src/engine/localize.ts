// Reader text for calculated results. Positions, records and evidence are untouched;
// only names and descriptions change to the reader's language.
import {
  EN, SIGNS, signIn, type Aspect, type BodyPlacement, type Chart, type PlanetPlacement, type Sky,
} from './atlas';
import type { Content } from './content';
import TAROT_CARDS, { type TarotCard } from './tarotData';
import { DECKS, SPREADS, type Deck, type NarrativeText, type Spread } from './tarotDecks';

const body = <T extends BodyPlacement | PlanetPlacement>(b: T, c: Content): T =>
  ({ ...b, ...c.bodies[b.key], sign: signIn(b.signIdx, c) });

export function localizeChart(ch: Chart, c: Content): Chart {
  if (c === EN) return ch;
  return {
    ...ch,
    sun: body(ch.sun, c),
    moon: { ...body(ch.moon, c), uncertain: ch.moon.uncertain, possibleSigns: ch.moon.possibleSigns.map(s => signIn(SIGNS.indexOf(s), c)) },
    rising: ch.rising ? body(ch.rising, c) : null,
    mc: ch.mc ? { ...ch.mc, name: c.midheaven, sign: signIn(ch.mc.signIdx, c) } : null,
    planets: ch.planets.map(p => body(p, c)),
  };
}

export function localizeSky(sk: Sky, c: Content): Sky {
  if (c === EN) return sk;
  const planets = sk.planets.map(p => body(p, c));
  return {
    ...sk,
    phase: c.phases[sk.phaseIdx][0],
    phaseText: c.phases[sk.phaseIdx][1],
    moon: { ...sk.moon, ...c.bodies.moon, sign: signIn(sk.moon.signIdx, c) },
    sun: { ...sk.sun, ...c.bodies.sun, sign: signIn(sk.sun.signIdx, c) },
    planets,
    retroNotes: planets.filter(p => p.retro).map(p => ({ name: p.name, glyph: p.glyph, text: c.retro[p.key] })),
  };
}

/** The aspect's name and description in the reader's language. */
export const aspectText = (a: Aspect, c: Content): { name: string; text: string } =>
  c.aspects[a.def.name] ?? { name: a.def.name, text: a.def.text };

const cache = new WeakMap<Content, TarotCard[]>();
/** The 78 cards with names and meanings in the reader's language; ids are unchanged. */
export function cardsIn(c: Content): TarotCard[] {
  if (c === EN) return TAROT_CARDS;
  let out = cache.get(c);
  if (!out) { out = TAROT_CARDS.map(card => ({ ...card, ...c.tarot.cards[card.id] })); cache.set(c, out); }
  return out;
}

export const decksIn = (c: Content): Deck[] => DECKS.map(d => ({ ...d, ...c.tarot.decks[d.id] }));
export const spreadsIn = (c: Content): Spread[] => SPREADS.map(sp => ({ ...sp, ...c.tarot.spreads[sp.id] }));
export const narrativeIn = (c: Content): NarrativeText =>
  ({ narrative: c.tarot.narrative, reversedSuffix: c.tarot.reversedSuffix, lowercaseInline: c.lowercaseInline });
