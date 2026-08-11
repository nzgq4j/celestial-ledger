import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { TAROT_READING_BLUEPRINTS } from "@/lib/tarot/readings";

const experience = readFileSync(
  "components/TarotReadingExperience.tsx",
  "utf8",
);
const accountDraw = readFileSync(
  "components/AccountTarotDailyDraw.tsx",
  "utf8",
);
const uploadForm = readFileSync("components/TarotDeckArtworkForm.tsx", "utf8");
const symbolicFace = readFileSync(
  "components/TarotSymbolicCardFace.tsx",
  "utf8",
);
const symbolicBack = readFileSync(
  "components/TarotSymbolicCardBack.tsx",
  "utf8",
);
const styles = readFileSync("app/globals.css", "utf8");

describe("tarot accessibility and content safety", () => {
  it("exposes state, progress, errors, and image purpose without relying on colour", () => {
    expect(experience).toContain('aria-current={stage === step ? "step"');
    expect(experience).toContain("aria-pressed={selected}");
    expect(experience).toContain('role="alert"');
    expect(experience).toContain("copy.deckCoverLabel");
    expect(experience).toContain("formatTarotMessage");
    expect(experience).toContain("copy.locked");
    expect(accountDraw).toContain('role="alert"');
    expect(uploadForm).toContain('aria-live="polite"');
    expect(uploadForm).toContain('name="cardId"');
    expect(uploadForm).toContain("copy.adminCardFaceSelect");
    expect(uploadForm).toContain("uploadedCardIds");
    expect(uploadForm).toContain("admin-card-face-list");
  });

  it("provides keyboard focus treatment and a reduced-motion alternative", () => {
    expect(styles).toContain(".tarot-progress button:focus-visible");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(".tarot-shuffle.is-shuffling");
    expect(experience).toContain('className="tarot-shuffle__axis"');
    expect(styles).toContain(".tarot-shuffle__axis");
    expect(styles).toContain(".tarot-card-back.tarot-shuffle__card");
    expect(styles).toContain(".admin-artwork-form__button");
    expect(styles).toContain(".admin-card-face-list");
    expect(styles).not.toContain(".tarot-shuffle > span");
    expect(styles).toMatch(
      /prefers-reduced-motion:[\s\S]*?\.tarot-shuffle[\s\S]*?animation: none/,
    );
  });

  it("provides a decorative, art-independent symbolic card face", () => {
    expect(symbolicFace).toContain('aria-hidden="true"');
    expect(symbolicFace).toContain("tarot-symbolic-face__index--top");
    expect(symbolicFace).toContain("tarot-symbolic-face__index--bottom");
    expect(styles).toContain(".tarot-symbolic-face__emblem--major");
    for (const suit of ["wands", "cups", "swords", "pentacles"]) {
      expect(styles).toContain(`.tarot-symbolic-face--${suit}`);
    }
  });

  it("replaces missing or failed private artwork with a symbolic card back", () => {
    expect(symbolicBack).toContain('className="tarot-card-back__seal"');
    expect(symbolicBack).toContain("event.currentTarget.hidden = true");
    expect(symbolicBack).toContain('aria-hidden="true"');
    expect(styles).toContain(".tarot-card-back__seal");
    expect(styles).toContain(".tarot-card-back__artwork");
  });

  it("keeps card copy reflective instead of predictive or diagnostic", () => {
    const meanings = TAROT_CARDS.flatMap(({ upright, reversed }) => [
      upright,
      reversed,
    ]).join(" ");
    expect(meanings).not.toMatch(
      /will happen|definitely|inevitable|you are destined|they (?:feel|think|want)|relapse|medication|treatment advice/i,
    );
    expect(meanings).toContain("reflection is not a diagnosis");
  });

  it("uses conditional future labels and first-person relationship framing", () => {
    const positions = TAROT_READING_BLUEPRINTS.flatMap(
      ({ positions: labels }) => labels,
    );
    expect(positions).toContain("Possible Future");
    expect(positions).not.toContain("Future");
    expect(positions).toContain("Your View of Them");
    expect(positions).not.toContain("Them");
  });
});
