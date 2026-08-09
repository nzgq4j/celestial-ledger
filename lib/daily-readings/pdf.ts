import type {
  DailyReadingAnalysis,
  DailyReadingContent,
} from "@/lib/daily-readings/domain";
import { buildDailyReadingDayArc } from "@/lib/daily-readings/day-arc";
import { buildReportPdf } from "@/lib/reports/pdf";

type DailyPdfSection = DailyReadingContent["sections"][number];

const DAILY_PDF_SECTION_MIN_WORDS = 350;
const DAILY_PDF_SECTION_MAX_WORDS = 500;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function userFacingText(value: string) {
  return value
    .replace(/Evidence:\s*[^.]+(?:\([^)]*\))?\.\s*/gi, "")
    .replace(/[^.?!]*\btransiting\s+[^.?!]*\bnatal\s+[^.?!]*[.?!]\s*/gi, "")
    .replace(/[^.?!]*\borb\b[^.?!]*[.?!]\s*/gi, "")
    .replace(/\btransit_[a-z0-9]+\b/gi, "")
    .replace(/\([^)]*\btransit_[^)]*\)/gi, "")
    .replace(/\b\d+(?:\.\d+)?\s*deg\s+orb\b/gi, "")
    .replace(/\b\d+(?:\.\d+)?°\s+orb\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function proseList(items: string[]) {
  const clean = items.map(userFacingText).filter(Boolean);
  if (!clean.length) return "choose one small, reversible action";
  if (clean.length === 1) return clean[0].replace(/\.$/, "").toLowerCase();
  return `${clean
    .slice(0, -1)
    .map((item) => item.replace(/\.$/, "").toLowerCase())
    .join("; ")}; and ${clean.at(-1)!.replace(/\.$/, "").toLowerCase()}`;
}

function interpretiveDailySection(
  section: DailyPdfSection,
  analysis: DailyReadingAnalysis,
) {
  const signal = analysis.signals.find((item) =>
    section.signalIds.includes(item.id),
  );
  const theme =
    analysis.themes.find((item) => section.themeIds.includes(item.id))?.label ??
    signal?.theme ??
    section.title;
  const domains = signal?.lifeDomains.length
    ? signal.lifeDomains.map((domain) => domain.replaceAll("-", " ")).join(", ")
    : "daily choices";
  const opening = userFacingText(section.narrative);
  const interpretation = userFacingText(signal?.interpretation ?? "");
  const applications = proseList(section.practicalApplications);
  const watchFor = proseList(signal?.watchFor ?? []);
  const duration =
    signal?.durationClass === "intraday"
      ? "brief and immediate"
      : signal?.durationClass === "daily"
        ? "most useful when handled today"
        : signal?.durationClass === "short-term"
          ? "developing across the next few days"
          : signal?.durationClass === "developmental"
            ? "part of a wider developmental pattern"
            : "best treated as a structural pattern rather than a passing mood";
  const state =
    signal?.temporalState === "building"
      ? "gathering, so preparation matters more than force"
      : signal?.temporalState === "exact"
        ? "clear enough to act on, provided the action stays proportionate"
        : signal?.temporalState === "separating"
          ? "moving into review, which makes integration more useful than escalation"
          : signal?.temporalState === "integrating"
            ? "asking to be absorbed into behaviour rather than repeated as drama"
            : signal?.temporalState === "emerging"
              ? "only beginning to show itself, so the first response should be exploratory"
              : "returning for another pass, so repetition is information";

  const paragraphs = [
    `${section.title} is about how ${theme.toLowerCase()} wants to become usable in ordinary life. ${opening || interpretation || `The emphasis is less about naming a sky event and more about noticing where ${theme.toLowerCase()} is already shaping attention, choices and expectations.`} The practical value of this section is to turn the symbolic pattern into a grounded response. Instead of asking what will happen, ask what this part of the day is asking you to handle with more honesty, precision or care.`,
    `In lived terms, the emphasis touches ${domains}. That does not mean every conversation, task or feeling in those areas needs to become important. It means those are the places where small signals deserve better interpretation before they become automatic reactions. If something feels unusually charged, treat the charge as information. Slow it down enough to separate the feeling from the conclusion you might be tempted to draw from it. The pattern is ${duration}; it is ${state}.`,
    `A useful response is to ${applications}. Keep the scale modest enough that you can learn from it today. If the matter involves another person, make the request or boundary concrete rather than implied. If it involves work, write down the outcome, owner and next step. If it involves self-regulation, protect the conditions that make good judgement possible: enough time, fewer unnecessary inputs and a clear stopping point. The goal is not to perform insight; it is to make the next action cleaner.`,
    `The main thing to watch for is ${watchFor}. When that tendency appears, do not treat it as failure. Treat it as the edge of the practice. Return to the simplest question: what would be a proportionate response now? A viable answer may be a note, a pause, a clarification, a small repair, or a decision not to spend more energy until better information is available. This section is successful when it leaves you with one grounded move and one thing to observe afterwards.`,
  ];

  let narrative = paragraphs.join("\n\n");
  const fallback =
    `Stay with ${theme.toLowerCase()} as a practical theme rather than a technical chart fact. Let it guide one clear choice, one cleaner boundary and one point of review before the day closes.`;
  while (countWords(narrative) < DAILY_PDF_SECTION_MIN_WORDS) {
    narrative = `${narrative}\n\n${fallback}`;
  }
  const words = narrative.split(/\s+/);
  if (words.length > DAILY_PDF_SECTION_MAX_WORDS)
    narrative = `${words.slice(0, DAILY_PDF_SECTION_MAX_WORDS).join(" ").replace(/[,:;]$/, "")}.`;
  return narrative;
}

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
    showCoverIntroduction: false,
    sections: [
      {
        title: bluf.title,
        bottomLine: bluf.activeNow.narrative,
        narrative: [
          bluf.overview.narrative,
          ...bluf.practicalPriorities.map(
            (priority) => `${priority.title}: ${priority.narrative}`,
          ),
          bluf.tensionToHold
            ? `Tension to hold: ${bluf.tensionToHold.narrative}`
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
          .map(
            (phase) =>
              `${phase.label} - ${phase.title}: ${phase.guidance}`,
          )
          .join("\n\n"),
        reflectionQuestions: [],
        evidence: [],
      },
      ...input.content.sections.map((section) => ({
        title: section.title,
        narrative: interpretiveDailySection(section, input.analysis),
        bringIntoLife: section.practicalApplications
          .map((application) => userFacingText(application))
          .filter(Boolean)
          .join("\n"),
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
