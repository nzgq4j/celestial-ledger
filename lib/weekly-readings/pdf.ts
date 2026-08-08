import type { WeeklyReadingAnalysis, WeeklyReadingContent } from "./domain";
import { buildReportPdf } from "@/lib/reports/pdf";

export function buildWeeklyReadingPdf(input: {
  content: WeeklyReadingContent;
  analysis: WeeklyReadingAnalysis;
  generatedAt: string;
}) {
  const evidenceMap = new Map(
    input.analysis.evidence.map((item) => [item.id, item.label]),
  );
  const evidenceLabel = (id: string) => `${id} - ${evidenceMap.get(id) ?? id}`;
  return buildReportPdf({
    edition: "Weekly Astrological Reading",
    title: input.content.header.headline,
    introduction: input.content.bottomLineUpFront.overview.narrative,
    uncertainty: input.analysis.birthTimeKnown
      ? []
      : [
          "Birth time is unknown; houses, angles, and exact-time claims are excluded.",
        ],
    sections: [
      {
        title: input.content.bottomLineUpFront.title,
        bottomLine: input.content.bottomLineUpFront.practicalPriorities
          .map((item) => `${item.dayRange}: ${item.title}`)
          .join("\n"),
        narrative: input.content.bottomLineUpFront.overview.narrative,
        bringIntoLife: input.content.bottomLineUpFront.forwardLook.narrative,
        reflectionQuestions: input.content.reflectiveQuestions,
        evidence:
          input.content.bottomLineUpFront.overview.evidenceIds.map(
            evidenceLabel,
          ),
      },
      {
        title: "Day-by-day emphasis map",
        narrative: input.content.dayByDay
          .map((day) => `${day.label} — ${day.themeLabel}\n${day.narrative}`)
          .join("\n\n"),
        bringIntoLife:
          "Use stronger days for focused action and quieter days for observation and integration.",
        reflectionQuestions: [],
        evidence: input.content.dayByDay
          .flatMap((day) => day.evidenceIds)
          .map(evidenceLabel),
      },
      ...input.content.sections.map((section) => ({
        title: section.title,
        narrative: section.narrative,
        bringIntoLife: section.practicalApplications.join("\n"),
        reflectionQuestions: [],
        evidence: section.evidenceIds.map(evidenceLabel),
      })),
    ],
    closing:
      "Carry forward what proves useful in lived experience, with your own judgement primary.",
    disclaimer:
      "Astrology is a symbolic reflective practice, not a scientifically validated prediction.",
    evidenceTitle: "Technical evidence register",
    evidence: input.analysis.evidence.map(
      (item) => `${item.id} - ${item.label}`,
    ),
    generatedAt: input.generatedAt,
    labels: {
      bottomLine: "Weekly priorities",
      bringIntoLife: "Bring this into your week",
      journalingPrompts: "Journal prompts",
      questions: "Reflective questions",
    },
  });
}
