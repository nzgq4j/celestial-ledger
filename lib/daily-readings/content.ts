import type { LocaleTag } from "@/lib/i18n/config";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import {
  dailyReadingContentSchema,
  type DailyReadingAnalysis,
  type DailyReadingContent,
  type DailySignal,
} from "./domain";

type NarrativeCopy = {
  methodology: string;
  bluf: string;
  sections: Record<string, string>;
  themes: Record<string, string>;
  focus: (theme: string, transit: string, phase: string) => string;
  active: (transit: string, state: string, phase: string) => string;
  priority: (
    index: number,
    theme: string,
    transit: string,
  ) => {
    title: string;
    narrative: string;
  };
  forward: (theme: string, state: string) => string;
  tension: (first: string, second: string) => string;
  sectionNarrative: (
    id: string,
    theme: string,
    transit: string,
    phase: string,
    state: string,
  ) => string;
  applications: (sectionId: string, signal: DailySignal) => string[];
  questions: (theme: string, secondTheme: string) => string[];
};

export const DAILY_READING_BLUF_MIN_WORDS = 425;
export const DAILY_READING_BLUF_MAX_WORDS = 1_000;

const english: NarrativeCopy = {
  methodology:
    "Tropical zodiac · equal natal houses when birth time is known · major transits at local noon",
  bluf: "Bottom Line Up Front",
  sections: {
    "strategic-context": "Strategic context",
    "recent-past": "Recent past",
    "present-conditions": "Present conditions",
    "immediate-application": "Immediate application",
    "work-professional": "Work and professional activity",
    "relationships-communication": "Relationships and communication",
    "energy-self-regulation": "Energy and self-regulation",
    "what-is-ending": "What is ending",
    "what-is-beginning": "What is beginning",
    "next-72-hours": "The next 72 hours",
    "longer-term-staging": "Longer-term staging",
  },
  themes: {},
  focus: (theme, transit, phase) =>
    `${theme} is the clearest thread through this reading. ${transit} provides the leading personal contact, while the ${phase} supplies the lunar rhythm beneath it. Read together, they describe a day for deliberate participation rather than passive observation. The useful question is not whether the sky will make an event occur, but where this pattern is already asking for clearer choices, better timing and more honest allocation of attention. Keep the leading theme visible when smaller demands compete for priority. Give it one concrete expression that can be observed, completed or reviewed before the day closes.`,
  active: (transit, state, phase) =>
    `At the local-noon reference point, ${transit}. Its ${state} condition matters: it shows whether the pattern is gathering, concentrated or moving into integration. The ${phase} adds a second clock, describing whether the lunar cycle is accumulating momentum or asking for review and release. Treat the strongest transit as the main line and the Moon as the pacing signal. This makes room for intensity without turning every passing feeling into a permanent conclusion. Revisit the evidence when the tone changes; the report is built from calculated positions, not from a generic Sun-sign script.`,
  priority: (index, theme, transit) => {
    const items = [
      {
        title: "Make the theme operational",
        narrative: `Translate ${theme.toLowerCase()} into a single action with an owner, boundary or finish line. ${transit} is most useful when its symbolism has a practical destination. Name what you are doing, why it matters now and what would count as enough for today. This prevents a meaningful pattern from becoming only an interesting description.`,
      },
      {
        title: "Check the terms before the pace rises",
        narrative: `Review the information, expectations and exchanges surrounding the leading theme. Separate what has been confirmed from what has merely been assumed. If another person is involved, state the request and the limit in plain language. Precision creates room for movement; it does not diminish the intuitive or relational dimension of the day.`,
      },
      {
        title: "Use timing as part of the decision",
        narrative: `Notice whether the contact is building or separating before deciding how hard to press. Building conditions favour preparation and a clean next step; separating conditions favour review, repair and integration. Leave enough space to see what the first action reveals. A staged commitment can honour the transit without asking one moment to carry the whole outcome.`,
      },
    ];
    return items[index % items.length];
  },
  forward: (theme, state) =>
    `Over the next several days, ${theme.toLowerCase()} remains the organizing frame, but its expression changes as the leading contact continues through a ${state} phase. What begins as an internal recognition may become a conversation, boundary, revision or practical choice. Preserve notes on what changes after the first response; that record will show whether the pattern is intensifying, clarifying or releasing. The current foundation release does not yet calculate every exact ingress, station or void-of-course interval, so the forward view stays with the verified transit direction and duration class rather than inventing precise event times.`,
  tension: (first, second) =>
    `${first} and ${second.toLowerCase()} both deserve room. The first names the dominant emphasis; the second shows what could be lost if the day is handled too narrowly. Hold them as a working polarity rather than choosing one and dismissing the other. A response may combine a firm priority with a reversible method, or a clear boundary with enough listening to revise its form. The tension changes the advice from “push harder” or “wait indefinitely” into a measured sequence: clarify, act, observe and adjust.`,
  sectionNarrative: (id, theme, transit, phase, state) => {
    const endings: Record<string, string> = {
      "strategic-context": `${transit} places ${theme.toLowerCase()} inside a ${state} longer arc. Read this durable influence as context rather than as an isolated mood: the natal target shows where the pattern meets an established part of the chart, while the ${phase} indicates how much of that larger work can reasonably be carried today.`,
      "recent-past": `${transit} is ${state}, so its relevance here is what remains after the contact's recent peak. Look for residue connected with ${theme.toLowerCase()}: a decision still settling, an unfinished exchange, or a lesson becoming clearer after pressure has passed. Integration is more useful here than recreating urgency.`,
      "present-conditions": `The clearest current condition is ${transit}. Its ${state} state concentrates ${theme.toLowerCase()} in observable choices made now. The ${phase} supplies today's pacing, but the transit—not a general daily theme—identifies where attention, language, effort or restraint has the most relevance.`,
      "immediate-application": `For immediate use, translate ${theme.toLowerCase()} into one bounded response to ${transit}. Choose an action, conversation or review that can produce information today. Treat friction as feedback about timing, ownership or scope rather than as a verdict on the whole direction.`,
      "work-professional": `In work and professional activity, ${transit} directs attention specifically to ${theme.toLowerCase()}. Define the purpose, identify the dependency, record the decision and protect the relevant standard. Distinguish genuine priority from urgency created by unclear ownership.`,
      "relationships-communication": `For relationships and communication, ${transit} brings ${theme.toLowerCase()} into the terms of an exchange. Describe your experience and request without assigning a hidden motive. Make reciprocity concrete—what is offered, what is assumed and which boundary keeps the exchange honest.`,
      "energy-self-regulation": `For energy and self-regulation, the useful evidence is ${transit}. Match effort to its ${state} condition and protect attention from unnecessary switching. Let the ${phase} guide rhythm and recovery; do not turn one intense interval into a judgement about the whole day.`,
      "what-is-ending": `${transit} is ${state}, marking ${theme.toLowerCase()} as material ready to move from reaction into integration. Release the version of the task, exchange or expectation that has already yielded its information; completion may be a documented lesson, a repaired gap or a closed loop.`,
      "what-is-beginning": `${transit} is ${state}, so ${theme.toLowerCase()} belongs to the emerging edge of the reading. Prepare without forcing finality: assemble the facts, identify the decision point and choose a first reversible action that lets the developing condition become clearer.`,
      "next-72-hours": `Over the next 72 hours, ${transit} keeps ${theme.toLowerCase()} within a near-term sequence. Clarify the practical question, act at a scale that produces feedback, then review what changed. Later evidence should refine today's interpretation rather than merely repeat it.`,
      "longer-term-staging": `${transit} makes ${theme.toLowerCase()} a longer-term staging concern rather than a prediction about today. Repetition matters more than drama: record the standard, boundary or practice worth maintaining so it can be reviewed when the contact changes phase or returns to the same natal territory.`,
    };
    return (
      endings[id] ??
      `${transit} directs this section toward ${theme.toLowerCase()} under ${state} conditions.`
    );
  },
  applications: (sectionId, signal) => {
    const sectionApplication: Record<string, string> = {
      "strategic-context":
        "Name the durable pattern this influence is developing, without turning it into a prediction.",
      "recent-past":
        "Identify what the recent peak has already taught you and what no longer needs another reaction.",
      "present-conditions":
        "Choose the observable decision that best reflects the current condition.",
      "immediate-application":
        "Take one reversible step today and decide in advance what feedback you will review.",
      "work-professional":
        "Clarify the owner, dependency and finish line for the professional task most affected.",
      "relationships-communication":
        "State one request or boundary plainly, then leave room for an actual response.",
      "energy-self-regulation":
        "Set a sustainable pace and protect one interval from unnecessary switching.",
      "what-is-ending":
        "Close, document or release one loop that has already supplied its lesson.",
      "what-is-beginning":
        "Prepare one first step without demanding a final outcome from an emerging condition.",
      "next-72-hours":
        "Sequence the next three days as clarify, act and review.",
      "longer-term-staging":
        "Record the repeatable standard or practice that deserves continuity beyond today.",
    };
    return [
      sectionApplication[sectionId] ??
        `Give ${signal.theme.toLowerCase()} one observable expression.`,
      ...signal.practicalApplications.slice(0, 2),
    ];
  },
  questions: (theme, secondTheme) => [
    `Where is ${theme.toLowerCase()} already asking for a clearer choice?`,
    `What changes when ${secondTheme.toLowerCase()} is treated as a necessary counterweight?`,
    "Which assumption can be tested through one small, reversible action?",
    "What deserves integration before a new commitment is made?",
  ],
};

const localizedLabels: Record<
  Exclude<LocaleTag, "en-GB">,
  Partial<NarrativeCopy>
> = {
  "es-ES": {
    methodology:
      "Zodiaco tropical · casas natales iguales cuando se conoce la hora · tránsitos mayores al mediodía local",
    bluf: "Conclusión principal",
    sections: {
      "strategic-context": "Contexto estratégico",
      "recent-past": "Pasado reciente",
      "present-conditions": "Condiciones presentes",
      "immediate-application": "Aplicación inmediata",
      "work-professional": "Trabajo y actividad profesional",
      "relationships-communication": "Relaciones y comunicación",
      "energy-self-regulation": "Energía y autorregulación",
      "what-is-ending": "Lo que termina",
      "what-is-beginning": "Lo que comienza",
      "next-72-hours": "Las próximas 72 horas",
      "longer-term-staging": "Desarrollo a largo plazo",
    },
  },
  "fr-FR": {
    methodology:
      "Zodiaque tropical · maisons natales égales lorsque l'heure est connue · transits majeurs à midi local",
    bluf: "L'essentiel d'abord",
    sections: {
      "strategic-context": "Contexte stratégique",
      "recent-past": "Passé récent",
      "present-conditions": "Conditions présentes",
      "immediate-application": "Application immédiate",
      "work-professional": "Travail et activité professionnelle",
      "relationships-communication": "Relations et communication",
      "energy-self-regulation": "Énergie et autorégulation",
      "what-is-ending": "Ce qui se termine",
      "what-is-beginning": "Ce qui commence",
      "next-72-hours": "Les prochaines 72 heures",
      "longer-term-staging": "Mise en place à long terme",
    },
  },
  "de-DE": {
    methodology:
      "Tropischer Tierkreis · gleiche Geburtshäuser bei bekannter Uhrzeit · Haupttransite zur lokalen Mittagszeit",
    bluf: "Das Wichtigste zuerst",
    sections: {
      "strategic-context": "Strategischer Kontext",
      "recent-past": "Jüngste Vergangenheit",
      "present-conditions": "Gegenwärtige Bedingungen",
      "immediate-application": "Unmittelbare Anwendung",
      "work-professional": "Arbeit und berufliche Tätigkeit",
      "relationships-communication": "Beziehungen und Kommunikation",
      "energy-self-regulation": "Energie und Selbstregulation",
      "what-is-ending": "Was endet",
      "what-is-beginning": "Was beginnt",
      "next-72-hours": "Die nächsten 72 Stunden",
      "longer-term-staging": "Längerfristige Entwicklung",
    },
  },
};

function copyFor(locale: LocaleTag): NarrativeCopy {
  if (locale === "en-GB") return english;
  const labels = localizedLabels[locale];
  return {
    ...english,
    ...labels,
    sections: { ...english.sections, ...labels.sections },
  };
}

function signalForTheme(analysis: DailyReadingAnalysis, themeIndex: number) {
  const theme = analysis.themes[themeIndex] ?? analysis.themes[0];
  return analysis.signals.find((signal) =>
    theme?.signalIds.includes(signal.id),
  );
}

type SectionId =
  | "strategic-context"
  | "recent-past"
  | "present-conditions"
  | "immediate-application"
  | "work-professional"
  | "relationships-communication"
  | "energy-self-regulation"
  | "what-is-ending"
  | "what-is-beginning"
  | "next-72-hours"
  | "longer-term-staging";

const requiredSectionIds = [
  "strategic-context",
  "present-conditions",
  "immediate-application",
  "next-72-hours",
] as const satisfies readonly SectionId[];

function signalsForSection(
  analysis: DailyReadingAnalysis,
  sectionId: SectionId,
): DailySignal[] {
  const matching = analysis.signals.filter((signal) => {
    switch (sectionId) {
      case "strategic-context":
      case "longer-term-staging":
        return ["developmental", "structural"].includes(signal.durationClass);
      case "recent-past":
      case "what-is-ending":
        return ["separating", "integrating"].includes(signal.temporalState);
      case "present-conditions":
        return ["exact", "building", "separating"].includes(
          signal.temporalState,
        );
      case "work-professional":
        return signal.lifeDomains.includes("work");
      case "relationships-communication":
        return signal.lifeDomains.some((domain) =>
          ["relationships", "communication"].includes(domain),
        );
      case "energy-self-regulation":
        return signal.lifeDomains.some((domain) =>
          ["restoration", "self-direction"].includes(domain),
        );
      case "what-is-beginning":
        return ["building", "emerging"].includes(signal.temporalState);
      case "next-72-hours":
        return ["intraday", "daily", "short-term"].includes(
          signal.durationClass,
        );
      case "immediate-application":
        return true;
    }
  });
  return [...matching].sort(
    (first, second) =>
      second.relevance - first.relevance ||
      second.intensity - first.intensity ||
      first.id.localeCompare(second.id),
  );
}

function themeForSignal(analysis: DailyReadingAnalysis, signal: DailySignal) {
  return analysis.themes.find((theme) => theme.signalIds.includes(signal.id));
}

function transitLabel(
  analysis: DailyReadingAnalysis,
  signal: DailySignal,
): string {
  const transit = analysis.transits.find((item) =>
    signal.evidenceIds.includes(item.evidenceId),
  );
  if (!transit)
    return (
      analysis.evidence.find((item) => signal.evidenceIds.includes(item.id))
        ?.label ?? signal.theme
    );
  return `transiting ${localizeAstroTerm(transit.transitingBody, analysis.locale)} ${localizeAstroTerm(transit.aspect, analysis.locale).toLowerCase()} natal ${localizeAstroTerm(transit.natalTarget, analysis.locale)} at ${transit.orbDegrees.toFixed(2)}° orb`;
}

export function bottomLineWordCount(content: DailyReadingContent): number {
  const bluf = content.bottomLineUpFront;
  return [
    bluf.title,
    bluf.overview.narrative,
    bluf.activeNow.narrative,
    ...bluf.practicalPriorities.flatMap((item) => [item.title, item.narrative]),
    bluf.forwardLook.narrative,
    bluf.tensionToHold?.narrative ?? "",
  ]
    .join(" ")
    .trim()
    .split(/\s+/u).length;
}

export function buildDailyReadingContent(
  analysis: DailyReadingAnalysis,
  readingId: string,
): DailyReadingContent {
  const copy = copyFor(analysis.locale);
  const leadingTheme = analysis.themes[0];
  const secondTheme = analysis.themes[1] ?? leadingTheme;
  const leadingSignal = signalForTheme(analysis, 0) ?? analysis.signals[0];
  if (!leadingTheme || !leadingSignal)
    throw new Error("Daily analysis contains no interpretable signal.");
  const primaryTransit = transitLabel(analysis, leadingSignal);
  const state = leadingSignal.temporalState;
  const evidenceIds = leadingTheme.evidenceIds;
  const sectionIds = [
    "strategic-context",
    "recent-past",
    "present-conditions",
    "immediate-application",
    "work-professional",
    "relationships-communication",
    "energy-self-regulation",
    "what-is-ending",
    "what-is-beginning",
    "next-72-hours",
    "longer-term-staging",
  ] as const satisfies readonly SectionId[];
  const sections = sectionIds.flatMap((id) => {
    const sectionSignal =
      signalsForSection(analysis, id)[0] ??
      (requiredSectionIds.includes(id as (typeof requiredSectionIds)[number])
        ? leadingSignal
        : undefined);
    if (!sectionSignal) {
      if (
        requiredSectionIds.includes(id as (typeof requiredSectionIds)[number])
      )
        throw new Error(
          `Daily analysis cannot support required section ${id}.`,
        );
      return [];
    }
    const sectionTheme = themeForSignal(analysis, sectionSignal);
    if (!sectionTheme) return [];
    return [
      {
        id,
        title: copy.sections[id],
        narrative: copy.sectionNarrative(
          id,
          sectionTheme.label,
          transitLabel(analysis, sectionSignal),
          analysis.lunarPhase.name,
          sectionSignal.temporalState,
        ),
        practicalApplications: copy.applications(id, sectionSignal),
        evidenceIds: sectionSignal.evidenceIds,
        signalIds: [sectionSignal.id],
        themeIds: [sectionTheme.id],
      },
    ];
  });
  const renderedSectionIds = new Set(sections.map((section) => section.id));
  const content = dailyReadingContentSchema.parse({
    schemaVersion: analysis.schemaVersion,
    readingId,
    civilDate: analysis.readingDate,
    locale: analysis.locale,
    header: {
      headline: `${leadingTheme.label}: ${state} conditions shape the day`,
      dateLabel: new Intl.DateTimeFormat(analysis.locale, {
        dateStyle: "long",
        timeZone: analysis.observationTimeZone,
      }).format(new Date(analysis.observedAtUtc)),
      observationTimeZoneLabel: analysis.observationTimeZone,
      methodologyLabel: copy.methodology,
    },
    bottomLineUpFront: {
      sectionId: "bottom-line-up-front",
      title: copy.bluf,
      overview: {
        narrative: copy.focus(
          leadingTheme.label,
          primaryTransit,
          analysis.lunarPhase.name,
        ),
        evidenceIds,
        sourceSectionIds: ["strategic-context", "present-conditions"],
      },
      activeNow: {
        narrative: copy.active(primaryTransit, state, analysis.lunarPhase.name),
        evidenceIds,
        sourceSectionIds: ["present-conditions"],
      },
      practicalPriorities: [0, 1, 2].map((index) => ({
        ...copy.priority(index, leadingTheme.label, primaryTransit),
        evidenceIds,
        sourceSectionIds: ["immediate-application"],
      })),
      forwardLook: {
        narrative: copy.forward(leadingTheme.label, state),
        evidenceIds,
        sourceSectionIds: (
          ["next-72-hours", "longer-term-staging"] as const
        ).filter((id) => renderedSectionIds.has(id)),
      },
      ...(secondTheme && secondTheme.id !== leadingTheme.id
        ? {
            tensionToHold: {
              narrative: copy.tension(leadingTheme.label, secondTheme.label),
              evidenceIds: [
                ...new Set([...evidenceIds, ...secondTheme.evidenceIds]),
              ],
              sourceSectionIds: (
                [
                  "relationships-communication",
                  "energy-self-regulation",
                ] as const
              ).filter((id) => renderedSectionIds.has(id)),
            },
          }
        : {}),
    },
    dominantThemes: analysis.themes.slice(0, 5),
    sections,
    reflectiveQuestions: copy.questions(
      leadingTheme.label,
      secondTheme?.label ?? leadingTheme.label,
    ),
    technicalAppendix: {
      methodVersion: analysis.method.version,
      calculationVersion: analysis.method.calculationVersion,
      ephemerisVersion: analysis.method.ephemerisVersion,
      birthTimeStatus: analysis.birthTimeKnown ? "known" : "unknown",
      positionEvidenceIds: analysis.positions.map((item) => item.evidenceId),
      transitEvidenceIds: analysis.transits.map((item) => item.evidenceId),
    },
    limitations: analysis.limitations,
  });
  const wordCount = bottomLineWordCount(content);
  if (
    analysis.locale === "en-GB" &&
    (wordCount < DAILY_READING_BLUF_MIN_WORDS ||
      wordCount > DAILY_READING_BLUF_MAX_WORDS)
  )
    throw new Error(
      `BLUF word count ${wordCount} is outside the ${DAILY_READING_BLUF_MIN_WORDS}–${DAILY_READING_BLUF_MAX_WORDS} contract.`,
    );
  return content;
}
