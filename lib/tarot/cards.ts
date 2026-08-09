import type { TarotCard, TarotSuit } from "@/lib/tarot/types";

const MAJOR_ARCANA = [
  {
    id: "major-0",
    name: "The Fool",
    number: 0,
    upright:
      "New beginnings and spontaneity invite a considered step into the unknown—leave room to learn as you go.",
    reversed:
      "Notice whether impulse or hesitation is setting the pace; name one safeguard and one manageable first step.",
  },
  {
    id: "major-1",
    name: "The Magician",
    number: 1,
    upright:
      "Resourcefulness and follow-through can bring an idea into form; take stock of the tools already within reach.",
    reversed:
      "Skill may be scattered or used without a clear purpose; check your intention and bring one tool into honest service.",
  },
  {
    id: "major-2",
    name: "The High Priestess",
    number: 2,
    upright:
      "Make room for the quiet knowing beneath the noise; not everything needs an immediate answer or announcement.",
    reversed:
      "Noise or premature disclosure may be crowding out reflection; pause and separate intuition from assumption.",
  },
  {
    id: "major-3",
    name: "The Empress",
    number: 3,
    upright:
      "Creativity and attentive care can help something worthwhile grow; notice what needs steady tending.",
    reversed:
      "Over-giving or neglecting your own needs may be draining creative energy; make restoration part of the work.",
  },
  {
    id: "major-4",
    name: "The Emperor",
    number: 4,
    upright:
      "Structure, discipline, and clear boundaries can create a stable base for your next move.",
    reversed:
      "A rule or boundary may have hardened into rigidity; ask whether it still serves its original purpose.",
  },
  {
    id: "major-5",
    name: "The Hierophant",
    number: 5,
    upright:
      "Tradition, a trusted mentor, or an established practice may offer a useful frame for reflection.",
    reversed:
      "Question convention with care; inherited advice may need adapting before it fits your situation.",
  },
  {
    id: "major-6",
    name: "The Lovers",
    number: 6,
    upright:
      "A meaningful choice asks you to align action with a relationship, value, or path that matters to you.",
    reversed:
      "Indecision or competing values may be creating friction; clarify what alignment would look like from your side.",
  },
  {
    id: "major-7",
    name: "The Chariot",
    number: 7,
    upright:
      "Focused effort can bring competing demands into a workable direction; choose where to place your energy.",
    reversed:
      "Scattered effort or pressure to force progress may be obscuring the route; pause and reset the destination.",
  },
  {
    id: "major-8",
    name: "Strength",
    number: 8,
    upright:
      "Patient courage and calm confidence may be more useful here than force.",
    reversed:
      "Self-doubt or overexertion may be narrowing your options; try a gentler, more sustainable response.",
  },
  {
    id: "major-9",
    name: "The Hermit",
    number: 9,
    upright:
      "A deliberate step back can make space for your own considered answer.",
    reversed:
      "Solitude may have tipped into disconnection; consider which safe, trusted perspective could help.",
  },
  {
    id: "major-10",
    name: "Wheel of Fortune",
    number: 10,
    upright:
      "A cycle may be shifting; notice what is changing and distinguish it from what remains within your influence.",
    reversed:
      "A familiar cycle may feel stuck; identify one response you can change without pretending to control everything.",
  },
  {
    id: "major-11",
    name: "Justice",
    number: 11,
    upright:
      "Fairness and accountability invite a clear look at choices, effects, and the information available to you.",
    reversed:
      "An imbalance may need a more honest review; check where responsibility or context has been overlooked.",
  },
  {
    id: "major-12",
    name: "The Hanged Man",
    number: 12,
    upright:
      "A deliberate pause may reveal an angle that urgency has hidden; loosen your grip on one fixed assumption.",
    reversed:
      "Waiting may have become avoidance; name the smallest decision that would restore movement.",
  },
  {
    id: "major-13",
    name: "Death",
    number: 13,
    upright:
      "Symbolically, an ending or transition invites you to make room for a different way forward.",
    reversed:
      "Holding tightly to an old form may be prolonging uncertainty; consider what can be released safely and gradually.",
  },
  {
    id: "major-14",
    name: "Temperance",
    number: 14,
    upright:
      "Patience and moderation can help you combine competing needs into something workable.",
    reversed:
      "Excess or impatience may be distorting the balance; slow the pace and adjust one ingredient at a time.",
  },
  {
    id: "major-15",
    name: "The Devil",
    number: 15,
    upright:
      "Look honestly at a habit, fear, or attachment that feels restrictive, while remembering that reflection is not a diagnosis and you retain agency.",
    reversed:
      "A restrictive pattern may be loosening; identify the support and boundaries that help you choose differently.",
  },
  {
    id: "major-16",
    name: "The Tower",
    number: 16,
    upright:
      "A belief or structure may need honest review; disruption can reveal where the foundation deserves care.",
    reversed:
      "Fear of disruption may be keeping an unstable arrangement in place; explore change in measured, supported steps.",
  },
  {
    id: "major-17",
    name: "The Star",
    number: 17,
    upright:
      "Hope and renewal invite you to recognise a source of steadiness after a difficult stretch.",
    reversed:
      "Discouragement may make hope harder to feel; look for one modest sign of support or possibility.",
  },
  {
    id: "major-18",
    name: "The Moon",
    number: 18,
    upright:
      "The picture may not be fully clear; hold intuition alongside evidence and leave room to revise your view.",
    reversed:
      "Confusion may be easing, but assumptions still deserve checking before you act on them.",
  },
  {
    id: "major-19",
    name: "The Sun",
    number: 19,
    upright:
      "Clarity and confidence invite you to recognise what is working and share warmth without overpromising.",
    reversed:
      "Joy or recognition may feel muted; acknowledge the progress that is present without forcing optimism.",
  },
  {
    id: "major-20",
    name: "Judgement",
    number: 20,
    upright:
      "An honest review of the past can clarify what you want to carry forward and what you want to change.",
    reversed:
      "Self-doubt or avoidance may be blocking reflection; approach the review with fairness rather than punishment.",
  },
  {
    id: "major-21",
    name: "The World",
    number: 21,
    upright:
      "A chapter may be ready for integration; take stock of what you learned before choosing the next horizon.",
    reversed:
      "Unfinished details may be asking for attention; define what 'complete enough' means before moving on.",
  },
] as const;

const SUIT_DOMAINS: Record<TarotSuit, string> = {
  wands: "work and passion projects",
  cups: "love and connection",
  swords: "thoughts and communication",
  pentacles: "money, health, and practical matters",
};

const SUIT_NAMES: Record<TarotSuit, string> = {
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

const MINOR_RANKS = [
  {
    name: "Ace",
    upright: (domain: string) =>
      `A fresh spark invites a manageable beginning in ${domain}.`,
    reversed: (domain: string) =>
      `Delay or self-doubt may be blocking a start in ${domain}; reduce the first step until it feels workable.`,
  },
  {
    name: "Two",
    upright: (domain: string) =>
      `A choice or partnership asks for attention around ${domain}.`,
    reversed: (domain: string) =>
      `Indecision or imbalance may be forming around ${domain}; clarify your part before assuming anyone else's.`,
  },
  {
    name: "Three",
    upright: (domain: string) =>
      `Collaboration can support early growth in ${domain}.`,
    reversed: (domain: string) =>
      `A setback or disappointment may be slowing progress in ${domain}; review the process before judging the outcome.`,
  },
  {
    name: "Four",
    upright: (domain: string) =>
      `Pause to consolidate what you have built in ${domain}.`,
    reversed: (domain: string) =>
      `Stability may have become a rut in ${domain}; test one contained change.`,
  },
  {
    name: "Five",
    upright: (domain: string) =>
      `Friction can act as a useful signal in ${domain}; identify the issue beneath the heat.`,
    reversed: (domain: string) =>
      `Conflict may be easing or being avoided in ${domain}; decide which conversation is yours to have.`,
  },
  {
    name: "Six",
    upright: (domain: string) =>
      `Cooperation may help restore balance in ${domain}.`,
    reversed: (domain: string) =>
      `An old pattern or one-sided exchange may need review in ${domain}; make expectations explicit.`,
  },
  {
    name: "Seven",
    upright: (domain: string) =>
      `Assess your strategy in ${domain} before committing more energy.`,
    reversed: (domain: string) =>
      `Overwhelm may be signalling that a plan needs rethinking in ${domain}; narrow the field.`,
  },
  {
    name: "Eight",
    upright: (domain: string) =>
      `Momentum is available when focus is clear in ${domain}.`,
    reversed: (domain: string) =>
      `Delay, scattered effort, or a self-imposed limit may be affecting ${domain}; remove one avoidable obstacle.`,
  },
  {
    name: "Nine",
    upright: (domain: string) =>
      `Resilience matters as you approach a meaningful threshold in ${domain}.`,
    reversed: (domain: string) =>
      `Exhaustion or guardedness may be shaping ${domain}; protect recovery time before asking for another push.`,
  },
  {
    name: "Ten",
    upright: (domain: string) =>
      `Review what may be completing or changing form in ${domain}.`,
    reversed: (domain: string) =>
      `A burden may feel heavy or be ready to redistribute in ${domain}; decide what is genuinely yours to carry.`,
  },
  {
    name: "Page",
    upright: (domain: string) =>
      `Curiosity and a willingness to learn can refresh your approach to ${domain}.`,
    reversed: (domain: string) =>
      `Inexperience or uncertain information calls for a second check around ${domain}.`,
  },
  {
    name: "Knight",
    upright: (domain: string) =>
      `Bold pursuit can energise ${domain}, provided pace does not outrun judgement.`,
    reversed: (domain: string) =>
      `Impatience or stalled effort may be shaping ${domain}; reset the pace before pressing harder.`,
  },
  {
    name: "Queen",
    upright: (domain: string) =>
      `Attentive, intuitive stewardship can support ${domain}.`,
    reversed: (domain: string) =>
      `Insecurity or overextension may be draining ${domain}; return attention to your own limits.`,
  },
  {
    name: "King",
    upright: (domain: string) =>
      `Confident, responsible stewardship can bring direction to ${domain}.`,
    reversed: (domain: string) =>
      `Control or inflexibility may be narrowing ${domain}; invite proportion and accountability.`,
  },
] as const;

function buildMinorArcana(): TarotCard[] {
  return (Object.keys(SUIT_DOMAINS) as TarotSuit[]).flatMap((suit) =>
    MINOR_RANKS.map((rank, index) => ({
      id: `${suit}-${index}`,
      name: `${rank.name} of ${SUIT_NAMES[suit]}`,
      arcana: "minor" as const,
      suit,
      number: index + 1,
      upright: rank.upright(SUIT_DOMAINS[suit]),
      reversed: rank.reversed(SUIT_DOMAINS[suit]),
    })),
  );
}

export const TAROT_CARDS: readonly TarotCard[] = [
  ...MAJOR_ARCANA.map((card) => ({ ...card, arcana: "major" as const })),
  ...buildMinorArcana(),
];

export function findTarotCard(cardId: string) {
  return TAROT_CARDS.find((card) => card.id === cardId) ?? null;
}
