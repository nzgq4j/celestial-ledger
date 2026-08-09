import type {
  DailyReadingAnalysis,
  DailyReadingContent,
} from "@/lib/daily-readings/domain";
import { buildDailyReadingDayArc } from "@/lib/daily-readings/day-arc";
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
    evidenceMap.get(evidenceId) ?? "Supporting chart factor";
  const bluf = input.content.bottomLineUpFront;
  const visualEvidence = [
    ...input.analysis.positions.map((position) => ({
      id: `placement:${position.body.toLowerCase().replaceAll(" ", "-")}`,
      label: `${position.body} in ${position.sign}`,
      kind: "placement" as const,
      body1: position.body,
    })),
    ...input.analysis.transits.slice(0, 10).map((transit) => ({
      id: transit.evidenceId,
      label: `${transit.transitingBody} ${transit.aspect.toLowerCase()} ${transit.natalTarget}`,
      kind: "aspect" as const,
      body1: transit.transitingBody,
      body2: transit.natalTarget,
    })),
  ];
  const dayArc = buildDailyReadingDayArc(input.analysis);
  return buildReportPdf({
    edition: "Daily Astrological Reading",
    title: input.content.header.headline,
    introduction: bluf.overview.narrative,
    uncertainty: input.analysis.birthTimeKnown
      ? []
      : ["Birth time is unknown; houses and angles are excluded."],
    visualPlacement: "cover",
    visualEvidence,
    sections: [
      {
        title: bluf.title,
        bottomLine: bluf.activeNow.narrative,
        narrative: [
          bluf.overview.narrative,
          ...bluf.practicalPriorities.map(
            (priority) => `${priority.title}\n${priority.narrative}`,
          ),
          bluf.tensionToHold
            ? `Tension to hold\n${bluf.tensionToHold.narrative}`
            : "",
        ]
          .filter(Boolean)
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
      {
        title: "The day meridian",
        narrative:
          "Carry the local-noon reading through the day in three deliberate movements: receive the signal, act where the pattern is strongest, and integrate what the day has revealed.",
        bringIntoLife: dayArc
          .map((phase) => `${phase.label}: ${phase.title}\n${phase.guidance}`)
          .join("\n\n"),
        reflectionQuestions: [],
        evidence: [],
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
    evidenceTitle: "Astrological basis",
    evidence: [...new Set(input.evidence.map((item) => item.label))],
    generatedAt: input.generatedAt,
    labels: {
      bottomLine: "Active now",
      bringIntoLife: "Practical applications",
      journalingPrompts: "Journal prompts",
      questions: "Reflective questions",
    },
  });
}
