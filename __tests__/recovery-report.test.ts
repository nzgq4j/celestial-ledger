import { describe, expect, it } from "vitest";
import {
  buildRecoveryEvidence,
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

function report(narrative = "The Sun offers a steady centre for renewal.") {
  return recoveryReportSchema.parse({
    title: "A Map of Renewal",
    introduction: "Your natal sky opens a path of attentive reflection.",
    sections: ["grounding", "renewal"].map((theme) => ({
      title:
        theme === "grounding" ? "The Returning Ground" : "The New Moon Gate",
      theme,
      narrative,
      evidenceIds: ["placement:sun"],
      reflectionQuestions: ["What helps you return to your own centre?"],
    })),
    closing: "Carry these patterns as living points of orientation.",
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
  ])("rejects prohibited recovery language: %s", async (unsafe) => {
    const bundle = await evidence();
    expect(() =>
      validateRecoveryReport(report(unsafe), bundle, ["grounding", "renewal"]),
    ).toThrow("RECOVERY_SAFETY_REJECTED");
  });
});
