import type {
  TarotDrawnCard,
  TarotLocale,
  TarotOrientation,
} from "@/lib/tarot/types";

export type TarotNarrativeFormatter = (input: {
  position: string;
  cardName: string;
  orientation: TarotOrientation;
  meaning: string;
}) => string;

export const formatEnglishTarotNarrative: TarotNarrativeFormatter = ({
  position,
  cardName,
  orientation,
  meaning,
}) =>
  `In the position of ${position.toLocaleLowerCase("en-GB")}, ${cardName}${
    orientation === "reversed" ? " reversed" : ""
  } invites you to consider ${meaning.charAt(0).toLocaleLowerCase("en-GB")}${meaning.slice(1)}`;

const FORMATTERS: Record<TarotLocale, TarotNarrativeFormatter> = {
  "en-GB": formatEnglishTarotNarrative,
  "es-ES": ({ position, cardName, orientation, meaning }) =>
    `En la posición «${position.toLocaleLowerCase("es-ES")}», ${cardName}${
      orientation === "reversed" ? " invertida" : ""
    } te invita a considerar ${meaning.charAt(0).toLocaleLowerCase("es-ES")}${meaning.slice(1)}`,
  "fr-FR": ({ position, cardName, orientation, meaning }) =>
    `À la position «${position.toLocaleLowerCase("fr-FR")}», ${cardName}${
      orientation === "reversed" ? " renversée" : ""
    } vous invite à considérer ${meaning.charAt(0).toLocaleLowerCase("fr-FR")}${meaning.slice(1)}`,
  "de-DE": ({ position, cardName, orientation, meaning }) =>
    `In der Position „${position.toLocaleLowerCase("de-DE")}“ regt ${cardName}${
      orientation === "reversed" ? " umgekehrt" : ""
    } diese Reflexion an: ${meaning}`,
};

export function tarotNarrativeFormatter(locale: TarotLocale) {
  return FORMATTERS[locale];
}

/** Ports the prototype's per-position combination into a localizable formatter. */
export function buildNarrative(
  cards: readonly TarotDrawnCard[],
  format: TarotNarrativeFormatter = formatEnglishTarotNarrative,
) {
  return cards
    .map(({ card, position, orientation }) =>
      format({
        position,
        cardName: card.name,
        orientation,
        meaning: card[orientation],
      }),
    )
    .join(" ");
}
