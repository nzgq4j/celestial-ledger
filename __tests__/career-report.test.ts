import { describe, expect, it } from "vitest";
import {
  buildCareerEvidence,
  careerPrompt,
  careerReportJsonSchema,
  careerReportSchema,
  validateEvidenceLinks,
} from "@/lib/reports/career";

const birthplace = {
  id: "greenwich",
  city: "London",
  country: "United Kingdom",
  displayName: "London, United Kingdom",
  latitude: 51.4769,
  longitude: 0,
  timeZone: "Europe/London",
};

describe("career report evidence", () => {
  it("binds provider text lengths to the runtime validation limits", () => {
    expect(
      careerReportJsonSchema.properties.sections.items.properties.narrative,
    ).toMatchObject({ minLength: 1, maxLength: 1800 });
    expect(careerReportJsonSchema.properties.disclaimer).toMatchObject({
      minLength: 1,
      maxLength: 400,
    });
  });

  it("binds the requested report language without altering evidence IDs", async () => {
    const { evidence } = await buildCareerEvidence({
      date: "1990-01-15",
      time: "12:00",
      timeUnknown: false,
      place: birthplace,
    });
    const prompt = careerPrompt(evidence, ["direction_purpose"], "es-ES");
    expect(prompt).toContain("Spanish as used in Spain (es-ES)");
    expect(prompt).toContain("placement:sun");
    expect(prompt).toContain("Preserve supplied evidence IDs exactly");
    expect(prompt).toContain("direction_purpose: Direction & purpose");
  });

  it("builds stable evidence IDs from a server calculation", async () => {
    const { evidence } = await buildCareerEvidence({
      date: "1990-01-15",
      time: "12:00",
      timeUnknown: false,
      place: birthplace,
    });
    expect(
      evidence.items.find((item) => item.id === "placement:sun"),
    ).toBeTruthy();
    expect(
      evidence.items.find((item) => item.id === "angle:midheaven"),
    ).toBeTruthy();
    expect(new Set(evidence.items.map((item) => item.id)).size).toBe(
      evidence.items.length,
    );
  });

  it("excludes time-dependent evidence when birth time is unknown", async () => {
    const { evidence } = await buildCareerEvidence({
      date: "1990-01-15",
      timeUnknown: true,
      place: birthplace,
    });
    expect(evidence.timeKnown).toBe(false);
    expect(
      evidence.items.some(
        (item) => item.kind === "angle" || item.kind === "house",
      ),
    ).toBe(false);
    expect(evidence.uncertainty).toHaveLength(1);
  });

  it("rejects fabricated evidence references", async () => {
    const { evidence } = await buildCareerEvidence({
      date: "1990-01-15",
      time: "12:00",
      timeUnknown: false,
      place: birthplace,
    });
    const report = careerReportSchema.parse({
      title: "Career and Purpose",
      introduction: "A reflective introduction.",
      sections: Array.from({ length: 4 }, (_, i) => ({
        title: `Section ${i + 1}`,
        theme: "direction_purpose",
        narrative: "A measured reflection.",
        evidenceIds: [i === 0 ? "placement:not-real" : "placement:sun"],
        reflectionQuestions: [],
      })),
      closing: "A reflective close.",
      disclaimer: "This is symbolic reflection, not prediction.",
    });
    expect(() => validateEvidenceLinks(report, evidence)).toThrow(
      "UNKNOWN_EVIDENCE_ID",
    );
  });

  it("requires exactly one generated section per selected theme", async () => {
    const { evidence } = await buildCareerEvidence({
      date: "1990-01-15",
      time: "12:00",
      timeUnknown: false,
      place: birthplace,
    });
    const section = (theme: "direction_purpose" | "strengths_talents") => ({
      title: theme,
      theme,
      narrative: `A measured reflection about ${theme}.`,
      evidenceIds: ["placement:sun"],
      reflectionQuestions: [],
    });
    const base = {
      title: "Career and Purpose",
      introduction: "A reflective introduction.",
      closing: "A reflective close.",
      disclaimer: "This is symbolic reflection, not prediction.",
    };
    const valid = careerReportSchema.parse({
      ...base,
      sections: [section("direction_purpose"), section("strengths_talents")],
    });
    expect(() =>
      validateEvidenceLinks(valid, evidence, [
        "direction_purpose",
        "strengths_talents",
      ]),
    ).not.toThrow();
    const duplicate = careerReportSchema.parse({
      ...base,
      sections: [section("direction_purpose"), section("direction_purpose")],
    });
    expect(() =>
      validateEvidenceLinks(duplicate, evidence, [
        "direction_purpose",
        "strengths_talents",
      ]),
    ).toThrow("DUPLICATE_CAREER_THEME");
  });
});
