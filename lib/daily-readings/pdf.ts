import type {
  DailyReadingAnalysis,
  DailyReadingContent,
} from "@/lib/daily-readings/domain";
import { buildReportPdf } from "@/lib/reports/pdf";

export async function buildDailyReadingPdf(input: {
  content: DailyReadingContent;
  analysis: DailyReadingAnalysis;
  evidence: DailyReadingAnalysis["evidence"];
  generatedAt: string;
}) {
  const evidenceMap = new Map(
    input.evidence.map((item) => [item.id, item.label]),
  );
  const evidenceLabel = (evidenceId: string) =>
    `${evidenceId} - ${evidenceMap.get(evidenceId) ?? evidenceId}`;
  const bluf = input.content.bottomLineUpFront;
  return buildReportPdf({
    edition: "Daily Astrological Reading",
    title: input.content.header.headline,
    introduction: bluf.overview.narrative,
    uncertainty: input.analysis.birthTimeKnown
      ? []
      : ["Birth time is unknown; houses and angles are excluded."],
    sections: [
      {
        title: bluf.title,
        bottomLine: bluf.activeNow.narrative,
        narrative: bluf.practicalPriorities
          .map((priority) => `${priority.title}\n${priority.narrative}`)
          .join("\n\n"),
        bringIntoLife: bluf.forwardLook.narrative,
        reflectionQuestions: input.content.reflectiveQuestions,
        evidence: [
          ...new Set([
            ...bluf.overview.evidenceIds,
            ...bluf.activeNow.evidenceIds,
            ...bluf.forwardLook.evidenceIds,
          ]),
        ].map(evidenceLabel),
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
      "Carry the clearest signal forward with curiosity, proportion, and your own judgement.",
    disclaimer:
      "Astrology is a symbolic reflective practice, not a scientifically validated prediction.",
    evidenceTitle: "Technical evidence register",
    evidence: input.evidence.map((item) => `${item.id} - ${item.label}`),
    generatedAt: input.generatedAt,
    labels: {
      bottomLine: "Active now",
      bringIntoLife: "Practical applications",
      journalingPrompts: "Journal prompts",
      questions: "Reflective questions",
    },
  });
}
