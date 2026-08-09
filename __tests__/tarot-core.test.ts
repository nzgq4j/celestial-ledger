import { describe, expect, it } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { tarotCardsForLocale } from "@/lib/tarot/card-locales";
import { drawTarotCards } from "@/lib/tarot/draw";
import {
  decideTarotAccess,
  planMeetsTarotMinimum,
} from "@/lib/tarot/entitlement";
import { buildNarrative } from "@/lib/tarot/narrative";
import { localizeTarotReadings } from "@/lib/tarot/reading-locales";
import {
  configureTarotReadings,
  TAROT_READING_BLUEPRINTS,
  TAROT_READING_PLAN_MATRIX,
} from "@/lib/tarot/readings";
import { TAROT_UI_MESSAGES } from "@/lib/tarot/ui-locales";

const planMatrix = {
  daily: "free",
  ppf: "personal",
  love5: "personal",
  celtic: "premium",
  grand: "premium",
} as const;

describe("tarot domain", () => {
  it("ports a complete, unique 78-card library", () => {
    expect(TAROT_CARDS).toHaveLength(78);
    expect(new Set(TAROT_CARDS.map((card) => card.id)).size).toBe(78);
    expect(TAROT_CARDS.filter((card) => card.arcana === "major")).toHaveLength(
      22,
    );
    expect(TAROT_CARDS.filter((card) => card.arcana === "minor")).toHaveLength(
      56,
    );
  });

  it("provides all 78 meanings in every supported locale", () => {
    for (const locale of ["en-GB", "es-ES", "fr-FR", "de-DE"] as const) {
      const cards = tarotCardsForLocale(locale);
      expect(cards).toHaveLength(78);
      expect(
        cards.every(
          ({ name, upright, reversed }) => name && upright && reversed,
        ),
      ).toBe(true);
    }
    expect(tarotCardsForLocale("de-DE")[22].name).toBe("Ass der Stäbe");
  });

  it("draws without replacement and assigns orientation independently", () => {
    const reading = configureTarotReadings(planMatrix).find(
      ({ id }) => id === "ppf",
    );
    expect(reading).toBeDefined();

    const values = [0, 0.75, 0, 0.25, 0, 0.75];
    const draw = drawTarotCards(TAROT_CARDS, reading!, () => values.shift()!);

    expect(new Set(draw.map(({ card }) => card.id)).size).toBe(3);
    expect(draw.map(({ orientation }) => orientation)).toEqual([
      "reversed",
      "upright",
      "reversed",
    ]);
    expect(draw.map(({ position }) => position)).toEqual([
      "Past",
      "Present",
      "Possible Future",
    ]);
  });

  it("keeps every spread's card count aligned with its position labels", () => {
    expect(TAROT_READING_BLUEPRINTS).toHaveLength(5);
    for (const spread of TAROT_READING_BLUEPRINTS) {
      expect(spread.positions).toHaveLength(spread.cardCount);
    }
  });

  it("localizes every spread name, blurb, and position without changing count", () => {
    const readings = configureTarotReadings(planMatrix);
    for (const locale of ["en-GB", "es-ES", "fr-FR", "de-DE"] as const) {
      const localized = localizeTarotReadings(readings, locale);
      expect(localized).toHaveLength(5);
      for (const spread of localized) {
        expect(spread.name).not.toBe("");
        expect(spread.blurb).not.toBe("");
        expect(spread.positions).toHaveLength(spread.cardCount);
        expect(spread.positions.every(Boolean)).toBe(true);
      }
    }
  });

  it("keeps every public and administrator UI label localized", () => {
    const englishKeys = Object.keys(TAROT_UI_MESSAGES["en-GB"]).sort();
    for (const locale of ["es-ES", "fr-FR", "de-DE"] as const) {
      const messages = TAROT_UI_MESSAGES[locale];
      expect(Object.keys(messages).sort()).toEqual(englishKeys);
      expect(Object.values(messages).every(Boolean)).toBe(true);
    }
  });

  it("applies spread and deck gates as independent plan axes", () => {
    expect(TAROT_READING_PLAN_MATRIX).toEqual({
      daily: "free",
      ppf: "personal",
      love5: "personal",
      celtic: "premium",
      grand: "premium",
    });
    expect(planMeetsTarotMinimum("personal", "free")).toBe(true);
    expect(planMeetsTarotMinimum("personal", "premium")).toBe(false);
    expect(
      decideTarotAccess({
        currentPlan: "personal",
        deckMinimumPlan: "premium",
        spreadMinimumPlan: "free",
      }),
    ).toEqual({
      allowed: false,
      reason: "deck_locked",
      minimumPlan: "premium",
    });
    expect(
      decideTarotAccess({
        currentPlan: "personal",
        deckMinimumPlan: "free",
        spreadMinimumPlan: "premium",
      }),
    ).toEqual({
      allowed: false,
      reason: "spread_locked",
      minimumPlan: "premium",
    });
  });

  it("builds a combined reflection from each position and orientation", () => {
    const reading = configureTarotReadings(planMatrix)[0];
    const draw = drawTarotCards(TAROT_CARDS, reading, () => 0);
    const narrative = buildNarrative(draw);

    expect(narrative).toContain("In the position of today");
    expect(narrative).toContain("The Fool");
    expect(narrative).toContain("invites you to consider");
  });
});
