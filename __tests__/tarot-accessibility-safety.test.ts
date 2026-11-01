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
const atlasStyles = readFileSync("app/styles/atlas-public.css", "utf8");

describe("tarot accessibility and content safety", () => {
  it("exposes state, locks, errors, and the draw cue without relying on colour", () => {
    expect(experience).toContain("aria-pressed={selected}");
    expect(experience).toContain('role="group"');
    expect(experience).toContain("aria-label={copy.spreadsLabel}");
    expect(experience).toContain('role="alert"');
    expect(experience).toContain('role="status"');
    expect(experience).toContain("formatTarotMessage");
    expect(experience).toContain("copy.lockedAtlas");
    expect(experience).toContain("copy.lockedSpreadLabel");
    expect(experience).toContain('aria-describedby="tarot-draw-hint"');
    expect(experience).toContain("planMeetsTarotMinimum");
    expect(accountDraw).toContain('role="alert"');
    expect(uploadForm).toContain('aria-live="polite"');
    expect(uploadForm).toContain('name="cardId"');
    expect(uploadForm).toContain("copy.adminCardFaceSelect");
    expect(uploadForm).toContain("uploadedCardIds");
    expect(uploadForm).toContain("admin-card-face-list");
  });

  it("provides keyboard focus treatment and a reduced-motion alternative", () => {
    expect(atlasStyles).toContain(".tarot-big-card:focus-visible");
    expect(atlasStyles).toContain(".tarot-panel__title:focus-visible");
    expect(atlasStyles).toContain(
      ".tarot-results .tarot-draw-card:focus-visible",
    );
    expect(atlasStyles).toContain(".tarot-big-card.is-shuffling");
    expect(atlasStyles).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*?\.tarot-big-card[\s\S]*?animation: none/,
    );
    expect(experience).toContain('"(prefers-reduced-motion: reduce)"');
    expect(styles).toContain(".admin-artwork-form__button");
    expect(styles).toContain(".admin-card-face-list");
  });

  it("keeps the native admin card selector legible in both themes", () => {
    expect(uploadForm).toContain('className="admin-card-face-select"');
    expect(styles).toMatch(
      /\.admin-card-face-select option\s*{[\s\S]*?background:\s*#101b29;[\s\S]*?color:\s*#eef1f3/,
    );
    expect(styles).toMatch(
      /html\[data-admin-theme="light"\] \.admin-card-face-select option\s*{[\s\S]*?background:\s*#ffffff;[\s\S]*?color:\s*#18233a/,
    );
  });

  it("keeps the tarot draw flow direct and card-shaped", () => {
    expect(experience).not.toContain("shuffleComplete");
    expect(experience).not.toContain("copy.selectDeck");
    expect(experience).not.toContain("{copy.reveal}");
    expect(experience).toContain("function beginShuffleAndReveal()");
    expect(experience).toContain("void reveal();");
    expect(experience).toContain('fetch("/api/tarot/draw"');
    expect(experience).toContain("selectedDeck.cardBackImageUrl");
    expect(experience).toContain('className="tarot-big-card__frame"');
    expect(experience).toContain("copy.tapToTurn");
    expect(atlasStyles).toMatch(
      /\.tarot-big-card\s*{[\s\S]*?aspect-ratio:\s*2 \/ 3\.3[\s\S]*?var\(--atlas-wine\)/,
    );
    expect(atlasStyles).toMatch(
      /\.tarot-big-card__frame\s*{[\s\S]*?inset:\s*12px/,
    );
    expect(styles).toMatch(
      /\.tarot-card-back\s*{[\s\S]*?aspect-ratio:\s*5 \/ 8/,
    );
    expect(styles).toMatch(
      /\.tarot-card-plate\s*{[\s\S]*?aspect-ratio:\s*5 \/ 8/,
    );
    expect(styles).toMatch(
      /\.tarot-symbolic-face\s*{[\s\S]*?aspect-ratio:\s*5 \/ 8/,
    );
  });

  it("provides a decorative, art-independent symbolic card face", () => {
    expect(symbolicFace).toContain('aria-hidden="true"');
    expect(symbolicFace).toContain("orientation?: TarotOrientation");
    expect(symbolicFace).toContain("tarot-symbolic-face--reversed");
    expect(experience).toContain("orientation={card.orientation}");
    expect(accountDraw).toContain("orientation={card.orientation}");
    expect(styles).toContain(".tarot-symbolic-face--reversed");
    expect(styles).toContain("transform: rotate(180deg)");
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
