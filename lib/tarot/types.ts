import type { PlanKey } from "@/lib/entitlements/domain";

export const TAROT_LOCALES = ["en-GB", "es-ES", "fr-FR", "de-DE"] as const;

export type TarotLocale = (typeof TAROT_LOCALES)[number];

export type TarotOrientation = "upright" | "reversed";

export type TarotArcana = "major" | "minor";

export type TarotSuit = "wands" | "cups" | "swords" | "pentacles";

export type TarotCard = {
  id: string;
  name: string;
  arcana: TarotArcana;
  suit?: TarotSuit;
  number?: number;
  upright: string;
  reversed: string;
};

export type TarotReadingId = "daily" | "ppf" | "love5" | "celtic" | "grand";

export type TarotReading = {
  id: TarotReadingId;
  name: string;
  cardCount: number;
  durationLabel: string;
  blurb: string;
  positions: readonly string[];
  minimumPlan: PlanKey;
};

export type TarotReadingBlueprint = Omit<TarotReading, "minimumPlan">;

export type TarotDeckAccent =
  "gold" | "copper" | "map-cyan" | "map-red" | "map-chalk";

export type TarotDeck = {
  id: string;
  name: string;
  tagline: string;
  accentToken: TarotDeckAccent;
  coverImageUrl: string | null;
  cardBackImageUrl: string | null;
  minimumPlan: PlanKey;
  active: boolean;
};

export type TarotDrawnCard = {
  card: TarotCard;
  position: string;
  orientation: TarotOrientation;
};

export type TarotAccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "deck_locked" | "spread_locked";
      minimumPlan: PlanKey;
    };
