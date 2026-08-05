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
  applications: (theme: string) => string[];
  questions: (theme: string, secondTheme: string) => string[];
};

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
    const common = `${theme} is supported by ${transit}. The contact is ${state}, and the ${phase} sets the broader daily rhythm.`;
    const endings: Record<string, string> = {
      "strategic-context": `${common} Place the day inside the longer arc of the transiting planet rather than reading it as an isolated mood. The natal target shows where the pattern meets an established part of the chart. What matters now is the stage of development: build structure around a durable transit, make room for revision under a changing one, and use the lunar signal to decide how much can reasonably be carried today.`,
      "recent-past": `${common} Separating contacts describe material that has recently peaked and now asks to be understood in practice. Look for the residue rather than inventing a specific event: an unfinished conversation, a decision still settling, a boundary that needs reinforcement, or a lesson becoming clearer after pressure has passed. Today differs because integration can replace immediate reaction.`,
      "present-conditions": `${common} This is the most concentrated part of the reading. The aspect describes the relationship between the active planet and the natal function; the orb and phase describe its present emphasis. Keep the symbolism close to observable choices. What receives attention, language, effort or restraint today becomes the place where the chart is most directly lived.`,
      "immediate-application": `${common} Give the pattern a narrow practical destination. Choose one action, one conversation or one review that can reveal useful information. Establish the terms before expanding the scope. If the first step produces friction, treat that response as feedback about timing, ownership or boundaries rather than as proof that the entire direction is wrong.`,
      "work-professional": `${common} In work, convert the theme into sequence: define the purpose, identify the dependency, record the decision and protect the standard that matters. The transit favours work that makes the invisible structure visible. Avoid absorbing every urgent request into the main plan; distinguish genuine priority from noise created by unclear ownership.`,
      "relationships-communication": `${common} In relationship, describe your experience and request without assigning another person a hidden motive. Let reciprocity be practical: who is offering what, what is being assumed, and which boundary keeps the exchange honest? A clear sentence may do more than a long explanation. Leave room for the response to alter the form without erasing the need.`,
      "energy-self-regulation": `${common} Match effort to the duration of the influence. A fast lunar trigger may need a pause and a reset; a developmental or structural transit needs sustainable repetition. Protect attention from unnecessary switching, and do not turn one intense interval into a judgement about the whole day. Rhythm is part of interpretation, not an afterthought.`,
      "what-is-ending": `${common} The separating side of the pattern is ready to move from reaction into integration. Release the version of the task, conversation or expectation that has already given its information. Completion may mean documenting the lesson, repairing a small gap, closing an unnecessary loop or allowing a former urgency to lose authority.`,
      "what-is-beginning": `${common} The applying side of the pattern is beginning to gather definition. Prepare without forcing finality: assemble the facts, identify the decision point, name the boundary and choose the first reversible action. Emerging conditions become easier to work with when preparation is concrete and the desired direction is stated plainly.`,
      "next-72-hours": `${common} Carry the leading theme forward as a sequence rather than a single verdict. First clarify the practical question; then act at a scale that produces feedback; finally review what changed. The transit duration indicates whether this is a brief trigger or part of a larger developmental cycle. Let later evidence refine today's interpretation.`,
      "longer-term-staging": `${common} The day is a staging point inside a larger pattern. Repetition matters more than drama: the standard you keep, the conversation you improve, the resource boundary you maintain or the creative practice you return to. Record the small choice that best expresses the theme; it becomes a useful reference when the transit changes phase or returns to the same natal territory.`,
    };
    return endings[id] ?? common;
  },
  applications: (theme) => [
    `Give ${theme.toLowerCase()} one observable task for today.`,
    "Write down the assumption that most needs verification.",
    "Choose a boundary or stopping point before expanding the work.",
  ],
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
  ];
  const sections = sectionIds.map((id) => ({
    id,
    title: copy.sections[id],
    narrative: copy.sectionNarrative(
      id,
      leadingTheme.label,
      primaryTransit,
      analysis.lunarPhase.name,
      state,
    ),
    practicalApplications: copy.applications(leadingTheme.label),
    evidenceIds,
    signalIds: leadingTheme.signalIds,
    themeIds: [leadingTheme.id],
  }));
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
        sourceSectionIds: ["next-72-hours", "longer-term-staging"],
      },
      ...(secondTheme && secondTheme.id !== leadingTheme.id
        ? {
            tensionToHold: {
              narrative: copy.tension(leadingTheme.label, secondTheme.label),
              evidenceIds: [
                ...new Set([...evidenceIds, ...secondTheme.evidenceIds]),
              ],
              sourceSectionIds: [
                "relationships-communication",
                "energy-self-regulation",
              ],
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
  if (analysis.locale === "en-GB" && (wordCount < 425 || wordCount > 575))
    throw new Error(
      `BLUF word count ${wordCount} is outside the 425–575 contract.`,
    );
  return content;
}
