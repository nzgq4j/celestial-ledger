import { describe, expect, it } from "vitest";
import {
  buildCareerEvidence,
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
});
