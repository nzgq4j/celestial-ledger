import { describe, expect, it } from "vitest";
import {
  buildRecoveryEvidence,
  RECOVERY_NARRATIVE_MIN_WORDS,
  recoveryReportJsonSchema,
  recoveryReportSchema,
  validateRecoveryReport,
} from "@/lib/reports/recovery";
import { bindEvidenceIds } from "@/lib/reports/evidence-schema";

const birthplace = {
  id: "greenwich",
  city: "London",
  country: "United Kingdom",
  displayName: "London, United Kingdom",
  latitude: 51.4769,
  longitude: 0,
  timeZone: "Europe/London",
};

async function evidence() {
  return (
    await buildRecoveryEvidence({
      date: "1990-01-15",
      time: "12:00",
      timeUnknown: false,
      place: birthplace,
    })
  ).evidence;
}

function report(narrative?: string) {
  return recoveryReportSchema.parse({
    title: "A Map of Renewal",
    introduction: "Your natal sky opens a path of attentive reflection.",
    sections: ["grounding", "renewal"].map((theme) => ({
      title:
        theme === "grounding" ? "The Returning Ground" : "The New Moon Gate",
      theme,
      narrative:
        narrative ??
        (theme === "grounding"
          ? "The Sun offers a steady centre through repeated acts of attention, embodiment, and honest appraisal of what is present now."
          : "Renewal begins at the edge of an old identity, where release creates enough space for experiment, imagination, and a consciously chosen next chapter."),
      evidenceIds: ["placement:sun"],
      reflectionQuestions: ["What helps you return to your own centre?"],
    })),
    closing: "Carry these patterns as living points of orientation.",
  });
}

function formattedSingleThemeReport(narrativeWords: number) {
  const vocabulary = [
    "steady",
    "attention",
    "choice",
    "rhythm",
    "support",
    "renewal",
    "practice",
    "reflection",
  ];
  return recoveryReportSchema.parse({
    title: "The Returning Ground",
    introduction: "A focused reflection on steadiness and choice.",
    sections: [
      {
        title: "Grounding",
        theme: "grounding",
        bottomLine: "Return to the next steady choice.",
        narrative: Array.from(
          { length: narrativeWords },
          (_, index) => vocabulary[index % vocabulary.length],
        ).join(" "),
        bringIntoLife: "Pause, notice what is present, and choose one step.",
        evidenceIds: ["placement:sun"],
        reflectionQuestions: ["What helps you return to centre?"],
        journalingPrompts: [
          "Name one source of steadiness.",
          "Describe one workable next choice.",
          "Notice what support feels available.",
        ],
      },
    ],
    closing: "Carry this point of orientation with you.",
  });
}

describe("Recovery Reflection safety and evidence", () => {
  it("constrains generated citations to immutable evidence IDs", () => {
    const schema = bindEvidenceIds(recoveryReportJsonSchema, [
      "placement:sun",
      "aspect:7",
    ]);
    expect(
      schema.properties.sections.items.properties.evidenceIds.items,
    ).toEqual({
      type: "string",
      enum: ["placement:sun", "aspect:7"],
    });
  });

  it("binds provider text lengths to the runtime validation limits", () => {
    expect(
      recoveryReportJsonSchema.properties.sections.items.properties.narrative,
    ).toMatchObject({ minLength: 4500, maxLength: 9000 });
    expect(
      recoveryReportJsonSchema.properties.sections.items.properties
        .reflectionQuestions.items,
    ).toMatchObject({ minLength: 1, maxLength: 240 });
  });

  it("keeps substantive near-boundary drafts instead of discarding them", async () => {
    const bundle = await evidence();
    expect(() =>
      validateRecoveryReport(
        formattedSingleThemeReport(RECOVERY_NARRATIVE_MIN_WORDS),
        bundle,
        ["grounding"],
      ),
    ).not.toThrow();
    expect(() =>
      validateRecoveryReport(
        formattedSingleThemeReport(RECOVERY_NARRATIVE_MIN_WORDS - 1),
        bundle,
        ["grounding"],
      ),
    ).toThrow("RECOVERY_SECTION_TOO_SHORT");
  });

  it("accepts selected reviewed themes linked to natal evidence", async () => {
    const bundle = await evidence();
    expect(() =>
      validateRecoveryReport(report(), bundle, ["grounding", "renewal"]),
    ).not.toThrow();
  });

  it("accepts one selected theme without padding the report", async () => {
    const bundle = await evidence();
    const single = recoveryReportSchema.parse({
      title: "The Returning Ground",
      introduction: "A focused reflection.",
      sections: [
        {
          title: "Grounding",
          theme: "grounding",
          narrative: "The Sun offers a steady centre.",
          evidenceIds: ["placement:sun"],
          reflectionQuestions: ["What helps you return to centre?"],
        },
      ],
      closing: "Carry this point of orientation with you.",
    });
    expect(() =>
      validateRecoveryReport(single, bundle, ["grounding"]),
    ).not.toThrow();
  });

  it("rejects duplicate selected themes", async () => {
    const bundle = await evidence();
    const duplicate = report();
    duplicate.sections[1].theme = "grounding";
    expect(() =>
      validateRecoveryReport(duplicate, bundle, ["grounding", "renewal"]),
    ).toThrow("DUPLICATE_RECOVERY_THEME");
  });

  it("rejects an unselected theme or fabricated chart evidence", async () => {
    const bundle = await evidence();
    expect(() =>
      validateRecoveryReport(report(), bundle, ["grounding"]),
    ).toThrow("UNSELECTED_RECOVERY_THEME");
    const fabricated = report();
    fabricated.sections[0].evidenceIds = ["placement:not-real"];
    expect(() =>
      validateRecoveryReport(fabricated, bundle, ["grounding", "renewal"]),
    ).toThrow("UNKNOWN_EVIDENCE_ID");
  });

  it.each([
    "You have an addiction disorder.",
    "You will relapse under this transit.",
    "Stop your medication during this cycle.",
    "Your chart caused substance use.",
    "Avoid professional support.",
    "This follows a 12-step model.",
    "Use CBT to challenge this thought.",
  ])("rejects prohibited recovery language: %s", async (unsafe) => {
    const bundle = await evidence();
    expect(() =>
      validateRecoveryReport(report(unsafe), bundle, ["grounding", "renewal"]),
    ).toThrow("RECOVERY_SAFETY_REJECTED");
  });
});
