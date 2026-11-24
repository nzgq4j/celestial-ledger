// Decks and spreads from the Tarot Reading prototype.
export interface Deck { id: string; name: string; tagline: string; bg: string; panel: string; ink: string; accent: string }
export interface Spread { id: string; name: string; count: number; time: string; positions: string[]; blurb: string }

export const DECKS: Deck[] = [
  { id:'cat', name:'The Whimsical Cats', tagline:'Storybook cats stand in for every archetype — soft color, big charm.', bg:'#fbf1e4', panel:'#fff9ef', ink:'#4a3428', accent:'#c07a72' },
  { id:'traditional', name:'Traditional', tagline:'The classic deck — timeless symbolism in rich color and gold.', bg:'#241014', panel:'#3a1620', ink:'#f0e6d2', accent:'#c9a227' },
  { id:'comic', name:'Silver Age', tagline:'Golden-age comic heroes reinterpret the arcana in bold ink and halftone.', bg:'#12203f', panel:'#1c3f94', ink:'#fff4d6', accent:'#e2231a' },
  { id:'techno', name:'Neon Circuit', tagline:'Circuitry and holographic glow for a digital-age deck.', bg:'#05070c', panel:'#0d1420', ink:'#c9fbff', accent:'#4deeea' },
  { id:'provencal', name:'Provençal', tagline:'Sun-washed lavender fields and faded linen from the French countryside.', bg:'#f3ede1', panel:'#fffaf1', ink:'#4a4038', accent:'#a8813f' },
];

export const SPREADS: Spread[] = [
  { id:'daily', name:'Daily Draw', count:1, time:'1 min', positions:['Today'], blurb:'One card. One clear thing to carry into your day.' },
  { id:'ppf', name:'Past, Present, Future', count:3, time:'3 min', positions:['Past','Present','Future'], blurb:"A quick read on how you got here and where you're headed." },
  { id:'love5', name:'Love Reading', count:5, time:'5 min', positions:['You','Them','The Connection','Challenge','Potential'], blurb:'A focused look at a relationship — real or hoped-for.' },
  { id:'celtic', name:'Celtic Cross', count:10, time:'10 min', positions:['Present','Challenge','Foundation','Recent Past','Possible Outcome','Near Future','Your Approach','External Influences','Hopes & Fears','Final Outcome'], blurb:'The classic ten-card spread for a full, layered picture.' },
  { id:'grand', name:'Life & Love Grand Spread', count:14, time:'15+ min', positions:['Where You Are Now','Core Desire','Past Influence','Love: Current State','Love: What You Need','Love: Obstacle','Career & Purpose','Money & Security','Personal Growth','Family & Home','Hidden Influence','Advice','Near Future','Long-Term Outcome'], blurb:'The deepest reading — life and love together, full major and minor arcana in play.' },
];

/** The deck chooser's own palette (before a deck is picked). */
export const CHOOSER = { bg: '#12121f', ink: '#f5ede0', accent: '#c9a86a' };

export interface DrawnCard<C> { card: C; reversed: boolean; position: string }

export function buildNarrative(drawn: DrawnCard<{ name: string; upright: string; reversed: string }>[]): string {
  return drawn.map(d => {
    const m = d.reversed ? d.card.reversed : d.card.upright;
    const lower = m.charAt(0).toLowerCase() + m.slice(1);
    return `In the position of ${d.position.toLowerCase()}, ${d.card.name}${d.reversed ? ' reversed' : ''} points to ${lower}`;
  }).join(' ');
}

/** Random draw without replacement; each card is reversed with probability 0.5. */
export function drawSpread<C>(cards: readonly C[], positions: readonly string[], random: () => number = Math.random): DrawnCard<C>[] {
  const pool = [...cards];
  return positions.map(position => ({ card: pool.splice(Math.floor(random() * pool.length), 1)[0], reversed: random() < 0.5, position }));
}
