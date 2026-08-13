import { describe, expect, it } from "vitest";
import { horoscopeCopyViolations } from "@/lib/horoscopes/editorial-quality";

function reading(overrides: Record<string, unknown> = {}) {
  return {
    theme: "Make one useful decision",
    overview:
      "A practical choice becomes easier when you name the real priority.",
    bottomLine:
      "Keep the day focused on the decision already in front of you. A clear answer will do more for you than another round of speculation.",
    relationships: "Ask a direct question and leave room for a direct answer.",
    business: "Finish the useful task before adding another commitment.",
    money: "Check the figures you already have before changing the plan.",
    wellbeing: "A steady pace will be more helpful than a dramatic reset.",
    opportunity: "There is room to simplify one complicated arrangement.",
    caution: "Do not confuse urgency with importance.",
    question: "What becomes easier once you make the priority explicit?",
    dayParts: [
      { theme: "Orient", guidance: "Choose the main priority for the day." },
      { theme: "Act", guidance: "Make the practical decision at midday." },
      { theme: "Review", guidance: "Notice what the decision clarified." },
    ],
    ...overrides,
  };
}

describe("horoscope editorial quality gate", () => {
  it("rejects the absurd and internal copy that previously reached readers", () => {
    const violations = horoscopeCopyViolations(
      reading({
        overview:
          "Imagine engineers opening a hatch beneath a running conveyor (evidence:1). This is symbolic reflection, not prediction.",
      }),
    );
    expect(violations).toContain("FORCED_ANALOGY");
    expect(violations).toContain("INLINE_EVIDENCE_ID");
    expect(violations).toContain("META_COPY");
  });

  it("allows clear, coherent and distinct horoscope language", () => {
    expect(horoscopeCopyViolations(reading())).toEqual([]);
  });

  it("rejects em dashes in generated title fields", () => {
    expect(
      horoscopeCopyViolations(
        reading({ theme: "Clear choices — clean action" }),
      ),
    ).toContain("TITLE_EM_DASH");
  });
});
