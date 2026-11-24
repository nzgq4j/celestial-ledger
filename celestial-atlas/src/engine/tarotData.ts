// 78-card tarot meaning library. Ported from the prototype tarotData.js; content unchanged.
export type Suit = "wands" | "cups" | "swords" | "pentacles";

interface CardBase {
  id: string;
  name: string;
  upright: string;
  reversed: string;
}
export interface MajorCard extends CardBase {
  arcana: "major";
  /** 0 (The Fool) to 21 (The World) */
  num: number;
}
export interface MinorCard extends CardBase {
  arcana: "minor";
  suit: Suit;
}
export type TarotCard = MajorCard | MinorCard;

const TAROT_CARDS: TarotCard[] = [
  {
    "id": "major-0",
    "name": "The Fool",
    "arcana": "major",
    "num": 0,
    "upright": "New beginnings, spontaneity, a leap of faith into the unknown — say yes before you've mapped every step.",
    "reversed": "Recklessness or hesitation: you're either leaping without a parachute or too scared to leap at all."
  },
  {
    "id": "major-1",
    "name": "The Magician",
    "arcana": "major",
    "num": 1,
    "upright": "You already have every tool you need — resourcefulness and follow-through turn ideas into results.",
    "reversed": "Talent without follow-through, or someone (possibly you) using skill to manipulate rather than build."
  },
  {
    "id": "major-2",
    "name": "The High Priestess",
    "arcana": "major",
    "num": 2,
    "upright": "Trust the quiet knowing beneath the noise; not everything needs to be said out loud yet.",
    "reversed": "Ignoring your gut, oversharing too early, or secrets that need to come to light."
  },
  {
    "id": "major-3",
    "name": "The Empress",
    "arcana": "major",
    "num": 3,
    "upright": "Abundance, creativity, and nurturing growth — things are ready to flourish if you tend them.",
    "reversed": "Burnout from over-giving, neglected self-care, or a creative block that needs rest, not force."
  },
  {
    "id": "major-4",
    "name": "The Emperor",
    "arcana": "major",
    "num": 4,
    "upright": "Structure, discipline, and clear boundaries create the stability you need to move forward.",
    "reversed": "Rigidity or control issues — rules enforced for their own sake instead of yours."
  },
  {
    "id": "major-5",
    "name": "The Hierophant",
    "arcana": "major",
    "num": 5,
    "upright": "Guidance from tradition, mentors, or established systems serves you well right now.",
    "reversed": "Questioning convention, or outgrowing advice that no longer fits your situation."
  },
  {
    "id": "major-6",
    "name": "The Lovers",
    "arcana": "major",
    "num": 6,
    "upright": "A meaningful choice about alignment — with a person, a value, or a path that's truly yours.",
    "reversed": "Misalignment, indecision, or a relationship built on convenience rather than real connection."
  },
  {
    "id": "major-7",
    "name": "The Chariot",
    "arcana": "major",
    "num": 7,
    "upright": "Willpower and focus pull opposing forces in one direction — discipline gets you there.",
    "reversed": "Losing direction, scattered effort, or forcing progress without a clear plan."
  },
  {
    "id": "major-8",
    "name": "Strength",
    "arcana": "major",
    "num": 8,
    "upright": "Quiet, patient courage — influence through calm confidence rather than force.",
    "reversed": "Self-doubt, or trying to muscle through something that needs gentleness instead."
  },
  {
    "id": "major-9",
    "name": "The Hermit",
    "arcana": "major",
    "num": 9,
    "upright": "Step back and think it through alone; the answer isn't in the noise.",
    "reversed": "Isolation that's tipped into loneliness, or avoiding people when you actually need them."
  },
  {
    "id": "major-10",
    "name": "Wheel of Fortune",
    "arcana": "major",
    "num": 10,
    "upright": "Change is already in motion — a shift in luck or circumstance beyond your full control.",
    "reversed": "Feeling stuck in a cycle, or resisting a change that's coming anyway."
  },
  {
    "id": "major-11",
    "name": "Justice",
    "arcana": "major",
    "num": 11,
    "upright": "Fairness, accountability, and consequences catching up — cause and effect made visible.",
    "reversed": "An unresolved imbalance, or someone (maybe you) avoiding accountability."
  },
  {
    "id": "major-12",
    "name": "The Hanged Man",
    "arcana": "major",
    "num": 12,
    "upright": "A deliberate pause; surrendering control shows you an angle you couldn't see before.",
    "reversed": "Stalling, martyrdom, or delaying a decision that actually needs to be made."
  },
  {
    "id": "major-13",
    "name": "Death",
    "arcana": "major",
    "num": 13,
    "upright": "A real ending clears space for what's next — resist the urge to hold on.",
    "reversed": "Resisting necessary change, or an ending dragged out longer than it needs to be."
  },
  {
    "id": "major-14",
    "name": "Temperance",
    "arcana": "major",
    "num": 14,
    "upright": "Patience and moderation — blending opposing needs into something workable.",
    "reversed": "Excess, impatience, or forcing a mismatch that needs more time to reconcile."
  },
  {
    "id": "major-15",
    "name": "The Devil",
    "arcana": "major",
    "num": 15,
    "upright": "Look honestly at what's got a hold on you — a habit, dynamic, or fear keeping you stuck.",
    "reversed": "Breaking free of that grip, or finally naming a dependency you've been avoiding."
  },
  {
    "id": "major-16",
    "name": "The Tower",
    "arcana": "major",
    "num": 16,
    "upright": "A sudden, disruptive truth cracks a shaky foundation — it needed to happen.",
    "reversed": "Avoiding an overdue collapse, or fear of change keeping a bad structure standing."
  },
  {
    "id": "major-17",
    "name": "The Star",
    "arcana": "major",
    "num": 17,
    "upright": "Hope and quiet renewal after hard times — a reason to trust things again.",
    "reversed": "Discouragement or lost faith; the hope is still there, just harder to feel right now."
  },
  {
    "id": "major-18",
    "name": "The Moon",
    "arcana": "major",
    "num": 18,
    "upright": "Things aren't fully clear yet — trust intuition over assumption while the fog lifts.",
    "reversed": "Confusion lifting, or anxiety and illusion that's been distorting the real picture."
  },
  {
    "id": "major-19",
    "name": "The Sun",
    "arcana": "major",
    "num": 19,
    "upright": "Clarity, confidence, and genuine good fortune — a straightforwardly good sign.",
    "reversed": "Delayed joy, or success that isn't fully landing yet — the good is still real."
  },
  {
    "id": "major-20",
    "name": "Judgement",
    "arcana": "major",
    "num": 20,
    "upright": "A wake-up call and a chance to reckon honestly with the past before moving on.",
    "reversed": "Self-doubt, or refusing a reckoning that would actually be freeing."
  },
  {
    "id": "major-21",
    "name": "The World",
    "arcana": "major",
    "num": 21,
    "upright": "Completion and full-circle success — a chapter closing with everything integrated.",
    "reversed": "Unfinished business, or being so close to done that stopping now would waste it."
  },
  {
    "id": "wands-0",
    "name": "Ace of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "A fresh spark — a genuine new beginning in work and passion projects.",
    "reversed": "Delays or self-doubt blocking that fresh start in work and passion projects."
  },
  {
    "id": "wands-1",
    "name": "Two of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "A choice or partnership taking shape around work and passion projects.",
    "reversed": "Indecision or an imbalance forming around work and passion projects."
  },
  {
    "id": "wands-2",
    "name": "Three of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Early growth through collaboration in work and passion projects.",
    "reversed": "A setback or disappointment slowing progress in work and passion projects."
  },
  {
    "id": "wands-3",
    "name": "Four of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "A pause to consolidate what you've built in work and passion projects.",
    "reversed": "Stagnation, or stability that's become a rut, in work and passion projects."
  },
  {
    "id": "wands-4",
    "name": "Five of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Friction or a wake-up call in work and passion projects.",
    "reversed": "Conflict finally easing, or avoidance of a needed fight, in work and passion projects."
  },
  {
    "id": "wands-5",
    "name": "Six of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Cooperation and a return to balance in work and passion projects.",
    "reversed": "An old pattern resurfacing, or one-sided generosity, in work and passion projects."
  },
  {
    "id": "wands-6",
    "name": "Seven of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "A moment to assess your strategy in work and passion projects.",
    "reversed": "Overwhelm or a plan that needs rethinking in work and passion projects."
  },
  {
    "id": "wands-7",
    "name": "Eight of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Fast movement and real momentum in work and passion projects.",
    "reversed": "Delays, scattered effort, or self-imposed limits in work and passion projects."
  },
  {
    "id": "wands-8",
    "name": "Nine of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Near the finish line, drawing on resilience in work and passion projects.",
    "reversed": "Exhaustion or guardedness after a long stretch in work and passion projects."
  },
  {
    "id": "wands-9",
    "name": "Ten of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "A cycle completing, for better or worse, in work and passion projects.",
    "reversed": "Being weighed down, or a burden finally lifting, in work and passion projects."
  },
  {
    "id": "wands-10",
    "name": "Page of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "A student's curiosity and willingness to learn about work and passion projects.",
    "reversed": "Immaturity or news that needs double-checking about work and passion projects."
  },
  {
    "id": "wands-11",
    "name": "Knight of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Bold, sometimes reckless pursuit of work and passion projects.",
    "reversed": "Impatience, or a pursuit that's stalled, around work and passion projects."
  },
  {
    "id": "wands-12",
    "name": "Queen of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Intuitive mastery and a nurturing command of work and passion projects.",
    "reversed": "Insecurity, or nurturing that's tipped into overextending, around work and passion projects."
  },
  {
    "id": "wands-13",
    "name": "King of Wands",
    "arcana": "minor",
    "suit": "wands",
    "upright": "Confident authority and real mastery over work and passion projects.",
    "reversed": "Controlling or overbearing use of authority over work and passion projects."
  },
  {
    "id": "cups-0",
    "name": "Ace of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "A fresh spark — a genuine new beginning in love and connection.",
    "reversed": "Delays or self-doubt blocking that fresh start in love and connection."
  },
  {
    "id": "cups-1",
    "name": "Two of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "A choice or partnership taking shape around love and connection.",
    "reversed": "Indecision or an imbalance forming around love and connection."
  },
  {
    "id": "cups-2",
    "name": "Three of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Early growth through collaboration in love and connection.",
    "reversed": "A setback or disappointment slowing progress in love and connection."
  },
  {
    "id": "cups-3",
    "name": "Four of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "A pause to consolidate what you've built in love and connection.",
    "reversed": "Stagnation, or stability that's become a rut, in love and connection."
  },
  {
    "id": "cups-4",
    "name": "Five of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Friction or a wake-up call in love and connection.",
    "reversed": "Conflict finally easing, or avoidance of a needed fight, in love and connection."
  },
  {
    "id": "cups-5",
    "name": "Six of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Cooperation and a return to balance in love and connection.",
    "reversed": "An old pattern resurfacing, or one-sided generosity, in love and connection."
  },
  {
    "id": "cups-6",
    "name": "Seven of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "A moment to assess your strategy in love and connection.",
    "reversed": "Overwhelm or a plan that needs rethinking in love and connection."
  },
  {
    "id": "cups-7",
    "name": "Eight of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Fast movement and real momentum in love and connection.",
    "reversed": "Delays, scattered effort, or self-imposed limits in love and connection."
  },
  {
    "id": "cups-8",
    "name": "Nine of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Near the finish line, drawing on resilience in love and connection.",
    "reversed": "Exhaustion or guardedness after a long stretch in love and connection."
  },
  {
    "id": "cups-9",
    "name": "Ten of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "A cycle completing, for better or worse, in love and connection.",
    "reversed": "Being weighed down, or a burden finally lifting, in love and connection."
  },
  {
    "id": "cups-10",
    "name": "Page of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "A student's curiosity and willingness to learn about love and connection.",
    "reversed": "Immaturity or news that needs double-checking about love and connection."
  },
  {
    "id": "cups-11",
    "name": "Knight of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Bold, sometimes reckless pursuit of love and connection.",
    "reversed": "Impatience, or a pursuit that's stalled, around love and connection."
  },
  {
    "id": "cups-12",
    "name": "Queen of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Intuitive mastery and a nurturing command of love and connection.",
    "reversed": "Insecurity, or nurturing that's tipped into overextending, around love and connection."
  },
  {
    "id": "cups-13",
    "name": "King of Cups",
    "arcana": "minor",
    "suit": "cups",
    "upright": "Confident authority and real mastery over love and connection.",
    "reversed": "Controlling or overbearing use of authority over love and connection."
  },
  {
    "id": "swords-0",
    "name": "Ace of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "A fresh spark — a genuine new beginning in decisions and mental clarity.",
    "reversed": "Delays or self-doubt blocking that fresh start in decisions and mental clarity."
  },
  {
    "id": "swords-1",
    "name": "Two of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "A choice or partnership taking shape around decisions and mental clarity.",
    "reversed": "Indecision or an imbalance forming around decisions and mental clarity."
  },
  {
    "id": "swords-2",
    "name": "Three of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Early growth through collaboration in decisions and mental clarity.",
    "reversed": "A setback or disappointment slowing progress in decisions and mental clarity."
  },
  {
    "id": "swords-3",
    "name": "Four of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "A pause to consolidate what you've built in decisions and mental clarity.",
    "reversed": "Stagnation, or stability that's become a rut, in decisions and mental clarity."
  },
  {
    "id": "swords-4",
    "name": "Five of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Friction or a wake-up call in decisions and mental clarity.",
    "reversed": "Conflict finally easing, or avoidance of a needed fight, in decisions and mental clarity."
  },
  {
    "id": "swords-5",
    "name": "Six of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Cooperation and a return to balance in decisions and mental clarity.",
    "reversed": "An old pattern resurfacing, or one-sided generosity, in decisions and mental clarity."
  },
  {
    "id": "swords-6",
    "name": "Seven of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "A moment to assess your strategy in decisions and mental clarity.",
    "reversed": "Overwhelm or a plan that needs rethinking in decisions and mental clarity."
  },
  {
    "id": "swords-7",
    "name": "Eight of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Fast movement and real momentum in decisions and mental clarity.",
    "reversed": "Delays, scattered effort, or self-imposed limits in decisions and mental clarity."
  },
  {
    "id": "swords-8",
    "name": "Nine of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Near the finish line, drawing on resilience in decisions and mental clarity.",
    "reversed": "Exhaustion or guardedness after a long stretch in decisions and mental clarity."
  },
  {
    "id": "swords-9",
    "name": "Ten of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "A cycle completing, for better or worse, in decisions and mental clarity.",
    "reversed": "Being weighed down, or a burden finally lifting, in decisions and mental clarity."
  },
  {
    "id": "swords-10",
    "name": "Page of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "A student's curiosity and willingness to learn about decisions and mental clarity.",
    "reversed": "Immaturity or news that needs double-checking about decisions and mental clarity."
  },
  {
    "id": "swords-11",
    "name": "Knight of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Bold, sometimes reckless pursuit of decisions and mental clarity.",
    "reversed": "Impatience, or a pursuit that's stalled, around decisions and mental clarity."
  },
  {
    "id": "swords-12",
    "name": "Queen of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Intuitive mastery and a nurturing command of decisions and mental clarity.",
    "reversed": "Insecurity, or nurturing that's tipped into overextending, around decisions and mental clarity."
  },
  {
    "id": "swords-13",
    "name": "King of Swords",
    "arcana": "minor",
    "suit": "swords",
    "upright": "Confident authority and real mastery over decisions and mental clarity.",
    "reversed": "Controlling or overbearing use of authority over decisions and mental clarity."
  },
  {
    "id": "pentacles-0",
    "name": "Ace of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "A fresh spark — a genuine new beginning in money, career, and daily routine.",
    "reversed": "Delays or self-doubt blocking that fresh start in money, career, and daily routine."
  },
  {
    "id": "pentacles-1",
    "name": "Two of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "A choice or partnership taking shape around money, career, and daily routine.",
    "reversed": "Indecision or an imbalance forming around money, career, and daily routine."
  },
  {
    "id": "pentacles-2",
    "name": "Three of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Early growth through collaboration in money, career, and daily routine.",
    "reversed": "A setback or disappointment slowing progress in money, career, and daily routine."
  },
  {
    "id": "pentacles-3",
    "name": "Four of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "A pause to consolidate what you've built in money, career, and daily routine.",
    "reversed": "Stagnation, or stability that's become a rut, in money, career, and daily routine."
  },
  {
    "id": "pentacles-4",
    "name": "Five of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Friction or a wake-up call in money, career, and daily routine.",
    "reversed": "Conflict finally easing, or avoidance of a needed fight, in money, career, and daily routine."
  },
  {
    "id": "pentacles-5",
    "name": "Six of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Cooperation and a return to balance in money, career, and daily routine.",
    "reversed": "An old pattern resurfacing, or one-sided generosity, in money, career, and daily routine."
  },
  {
    "id": "pentacles-6",
    "name": "Seven of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "A moment to assess your strategy in money, career, and daily routine.",
    "reversed": "Overwhelm or a plan that needs rethinking in money, career, and daily routine."
  },
  {
    "id": "pentacles-7",
    "name": "Eight of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Fast movement and real momentum in money, career, and daily routine.",
    "reversed": "Delays, scattered effort, or self-imposed limits in money, career, and daily routine."
  },
  {
    "id": "pentacles-8",
    "name": "Nine of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Near the finish line, drawing on resilience in money, career, and daily routine.",
    "reversed": "Exhaustion or guardedness after a long stretch in money, career, and daily routine."
  },
  {
    "id": "pentacles-9",
    "name": "Ten of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "A cycle completing, for better or worse, in money, career, and daily routine.",
    "reversed": "Being weighed down, or a burden finally lifting, in money, career, and daily routine."
  },
  {
    "id": "pentacles-10",
    "name": "Page of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "A student's curiosity and willingness to learn about money, career, and daily routine.",
    "reversed": "Immaturity or news that needs double-checking about money, career, and daily routine."
  },
  {
    "id": "pentacles-11",
    "name": "Knight of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Bold, sometimes reckless pursuit of money, career, and daily routine.",
    "reversed": "Impatience, or a pursuit that's stalled, around money, career, and daily routine."
  },
  {
    "id": "pentacles-12",
    "name": "Queen of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Intuitive mastery and a nurturing command of money, career, and daily routine.",
    "reversed": "Insecurity, or nurturing that's tipped into overextending, around money, career, and daily routine."
  },
  {
    "id": "pentacles-13",
    "name": "King of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "upright": "Confident authority and real mastery over money, career, and daily routine.",
    "reversed": "Controlling or overbearing use of authority over money, career, and daily routine."
  }
];

export default TAROT_CARDS;
