import type {
  TarotCard,
  TarotDrawnCard,
  TarotReading,
} from "@/lib/tarot/types";

export type TarotRandomSource = () => number;

function assertRandomValue(value: number) {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Tarot random source must return a value in [0, 1).");
  }
}

export function cryptographicTarotRandom(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] / 2 ** 32;
}

/**
 * Draws without replacement. Card selection and orientation consume separate
 * random values so orientation is independent of which card was selected.
 */
export function drawTarotCards(
  cards: readonly TarotCard[],
  reading: Pick<TarotReading, "cardCount" | "positions">,
  random: TarotRandomSource = cryptographicTarotRandom,
): TarotDrawnCard[] {
  if (reading.cardCount !== reading.positions.length) {
    throw new RangeError("Tarot spread card count must match its positions.");
  }
  if (reading.cardCount > cards.length) {
    throw new RangeError(
      "Tarot spread requests more cards than are available.",
    );
  }

  const pool = [...cards];
  return reading.positions.map((position) => {
    const selectionValue = random();
    assertRandomValue(selectionValue);
    const selectedIndex = Math.floor(selectionValue * pool.length);
    const [card] = pool.splice(selectedIndex, 1);

    const orientationValue = random();
    assertRandomValue(orientationValue);

    return {
      card,
      position,
      orientation: orientationValue < 0.5 ? "upright" : "reversed",
    };
  });
}
