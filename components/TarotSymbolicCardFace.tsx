import type { TarotSuit } from "@/lib/tarot/types";

const ROMAN_NUMERALS = [
  "0",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
] as const;

const MINOR_INDICES: Record<number, string> = {
  1: "A",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "P",
  12: "Kn",
  13: "Q",
  14: "K",
};

export function tarotCardIndex(
  arcana: "major" | "minor",
  number: number | null,
) {
  if (number === null) return "—";
  if (arcana === "major") return ROMAN_NUMERALS[number] ?? String(number);
  return MINOR_INDICES[number] ?? String(number);
}

export function TarotSymbolicCardFace({
  arcana,
  suit,
  number,
  name,
  className = "",
}: {
  arcana: "major" | "minor";
  suit: TarotSuit | null;
  number: number | null;
  name: string;
  className?: string;
}) {
  const index = tarotCardIndex(arcana, number);
  const faceClassName = [
    "tarot-symbolic-face",
    `tarot-symbolic-face--${arcana}`,
    suit ? `tarot-symbolic-face--${suit}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={faceClassName} aria-hidden="true">
      <span className="tarot-symbolic-face__index tarot-symbolic-face__index--top">
        {index}
      </span>
      <span className="tarot-symbolic-face__index tarot-symbolic-face__index--bottom">
        {index}
      </span>
      <span
        className={`tarot-symbolic-face__emblem tarot-symbolic-face__emblem--${arcana}`}
      >
        <i />
      </span>
      <strong className="tarot-symbolic-face__name">{name}</strong>
    </div>
  );
}
