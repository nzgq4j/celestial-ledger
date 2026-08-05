import type { ReadingDayPhase } from "@/components/reports/ReadingDayArc";

export type SampleReportKey =
  "career-purpose" | "recovery-reflection" | "weekly-reading";

type SampleReportPresentation = {
  brief: {
    title: string;
    overview: readonly string[];
    priorities: readonly { title: string; narrative: string }[];
    tension: string;
    forwardLook: string;
  };
  dayArc: {
    introduction: string;
    phases: readonly ReadingDayPhase[];
    note: string;
  };
};

export const sampleReportPresentation: Record<
  SampleReportKey,
  SampleReportPresentation
> = {
  "career-purpose": {
    brief: {
      title: "A vocation built from translation, depth and dependable form",
      overview: [
        "This chart’s vocational promise is not contained in one job title. Its central function is to discover the governing pattern inside complex material, give that pattern clear language, and help other people use what has been found. The Gemini Sun supplies range, curiosity and an instinct for connections; the deeper lunar register refuses to let communication remain superficial. Together they describe a messenger whose authority grows when information is joined to emotional truth, human stakes and a practical destination.",
        "The strongest path therefore combines movement with a recognisable method. Research, advising, teaching, writing, facilitation, strategy and systems work can all belong to the same calling when they move people from confusion into orientation. The chart does not ask range to disappear. It asks range to gather around a promise that an audience, client or team can recognise. Reputation strengthens through exact observation, careful editing and work that remains useful after the excitement of the first idea has passed.",
      ],
      priorities: [
        {
          title: "Name the enduring function",
          narrative:
            "Look beneath former titles and list the repeated service: translating, connecting, diagnosing, teaching or guiding. Write that function as one sentence beginning, ‘My work helps people move from…’. Use it to judge opportunities that look different on the surface but may belong to the same vocational thread.",
        },
        {
          title: "Give curiosity an audience",
          narrative:
            "Choose a real person or group for the next piece of thinking. A brief, workshop, article, consultation or prototype gives the Mercurial gift productive pressure. Questions become sharper when they must reach someone, and feedback reveals which part of the range is becoming a trusted contribution.",
        },
        {
          title: "Build the vessel of mastery",
          narrative:
            "Protect one recurring block for the craft that turns insight into authority. Define a finish line, an editorial standard and a review rhythm. Saturn’s contribution is simple but demanding: repeat the work after novelty fades, then let the completed body of work become evidence of what you can be trusted to carry.",
        },
      ],
      tension:
        "Variety keeps the mind alive, yet unbounded variety can make the public path difficult to recognise. The answer is neither premature specialisation nor endless reinvention. Keep several subjects if they serve one clear function. Decline attractive work when it requires you to abandon depth, quality or the human purpose beneath the communication.",
      forwardLook:
        "The next stage is architectural. Gather three past projects that reveal the same hidden function, identify the standard they share, and design one offer or body of work that makes the pattern visible. The mature signature is a bridge-builder with depth: someone who can cross disciplines, return with the essential truth, and place that truth in other people’s hands in a form they can act upon.",
    },
    dayArc: {
      introduction:
        "Use the day as a small vocational laboratory: listen for the living question, shape the useful answer, then preserve what deserves to become part of your method.",
      phases: [
        {
          period: "morning",
          label: "Morning",
          title: "Gather the signal",
          guidance:
            "Read before declaring. Capture the phrase, request or problem that appears twice; repetition points toward the question your work is ready to answer.",
          level: 2,
        },
        {
          period: "noon",
          label: "Noon",
          title: "Give the idea form",
          guidance:
            "Turn one insight into a useful artefact: a paragraph, diagram, agenda, decision or invitation with a named audience and a clear next step.",
          level: 3,
        },
        {
          period: "evening",
          label: "Evening",
          title: "Keep the golden thread",
          guidance:
            "Record what people needed, what you clarified and which part of the work carried energy. Let that evidence refine the method you are building.",
          level: 2,
        },
      ],
      note: "This arc is a practical application of the natal vocational pattern, not a separate set of timed transit calculations.",
    },
  },
  "recovery-reflection": {
    brief: {
      title:
        "Renewal becomes trustworthy through return, rhythm and relationship",
      overview: [
        "The central movement in this reading is a return to the inner compass through ordinary, repeatable acts. A quick Mercurial nature may first regain orientation through movement, naming and sequence rather than forced stillness. Walking, preparing food, putting one space in order or writing a few honest lines can gather scattered currents into one channel. The aim is not to manufacture a perfect state. It is to recognise the route back to the present and make that route easier to find each time it is needed.",
        "Beneath the quick mind, the Moon asks for emotional loyalty: the willingness to receive an inner signal before arguing it away. Self-trust grows when feeling is neither made into a verdict nor dismissed as inconvenience. Boundaries then become the vessel that protects this listening. A delayed reply, a clear no, or a choice to leave an overstimulating setting confirms that energy has a rightful shape. Trusted relationships support the process through candour, mutuality and enough spaciousness for performance to soften.",
      ],
      priorities: [
        {
          title: "Prepare a return sequence",
          narrative:
            "Write three steps simple enough to remember under pressure: first orient to the body, then reduce the immediate demand, then contact the next trustworthy person or action. Practise the sequence on an ordinary unsettled day. Familiarity makes the path available before the mind tries to solve every feeling at once.",
        },
        {
          title: "Protect two daily anchors",
          narrative:
            "Choose one morning cue and one evening cue that remain realistic when capacity is low. The minimum version must count. A glass of water, opened curtains, a short walk, a prepared meal or a closing note can become a dependable threshold without turning renewal into another performance standard.",
        },
        {
          title: "Make support specific",
          narrative:
            "Tell one trusted person what useful support looks like in observable terms: listening without fixing, sharing a meal, checking a practical detail or waiting while you decide. Clear requests make mutual care easier to receive and prevent intensity from being mistaken for reliability.",
        },
      ],
      tension:
        "The mind may seek one dramatic explanation or decisive transformation, while the chart’s deeper wisdom asks for sequence. Respect the desire for change without asking one difficult hour to define the whole horizon. Return first to the body, the environment and the next grounded choice; interpretation can follow when proportion has returned.",
      forwardLook:
        "Integration is visible when care enters the calendar, the home, the relationships you choose and the language used after an imperfect day. Review the next month by looking for behaviour rather than declarations: boundaries kept, requests made, routines resumed and environments chosen with greater discernment. Renewal becomes lasting when it is no longer exceptional, but an ordinary and loyal relationship with your own life.",
    },
    dayArc: {
      introduction:
        "Let the day move through three acts of renewal: arrive in the body, protect the centre, and close with a compassionate account of what was actually lived.",
      phases: [
        {
          period: "morning",
          label: "Morning",
          title: "Return to the body",
          guidance:
            "Begin with the smallest dependable anchor before taking in other people’s demands. Let nourishment, light, movement or breath establish the first boundary of the day.",
          level: 2,
        },
        {
          period: "noon",
          label: "Noon",
          title: "Protect the next sound choice",
          guidance:
            "Pause before pressure becomes momentum. Name what is happening, reduce the field to one decision, and ask for specific support if the choice should not be carried alone.",
          level: 3,
        },
        {
          period: "evening",
          label: "Evening",
          title: "Make the return visible",
          guidance:
            "Notice one promise kept, one boundary honoured or one moment of honest connection. Let evidence of return matter more than an account of perfection.",
          level: 2,
        },
      ],
      note: "The arc offers a reviewed reflective rhythm. It does not replace direct professional or emergency support when immediate safety is involved.",
    },
  },
  "weekly-reading": {
    brief: {
      title:
        "A week for hearing the signal, choosing the line and restoring proportion",
      overview: [
        "This week begins in a Mercurial field: language, introductions and repeated subjects carry unusual weight. The opening days are better used for observation than immediate declaration. Notice which phrase appears in separate conversations, which unfinished idea returns with new relevance, and where two parts of life unexpectedly connect. Curiosity is the instrument, but discernment decides which signal deserves a place in the week’s actual structure.",
        "The middle of the week turns from gathering toward selection. Emotional material may become clearer in private than in performance, making Wednesday and Thursday suited to inventory, repair and the release of an obligation that has outlived its purpose. The later week then opens toward Venusian restoration: companionship, beauty and well-made surroundings return events to proportion. What feels spacious and sincere will teach more than what merely makes the loudest demand.",
      ],
      priorities: [
        {
          title: "Keep a signal ledger",
          narrative:
            "For the first two days, record repeated names, questions and invitations without promising action. At the end of Tuesday, circle only the signals that connect with an existing priority. The ledger separates genuine recurrence from the passing stimulation of a busy opening.",
        },
        {
          title: "Make one midweek choice",
          narrative:
            "By Thursday, give one conversation or task a firmer boundary: commit, revise, delegate or release it. Put the choice in writing. A clear line restores energy because the mind no longer has to keep every possible future equally available.",
        },
        {
          title: "Schedule proportion",
          narrative:
            "Reserve a later-week experience chosen for delight, companionship or restoration rather than usefulness. Treat it as part of the reading’s work. A wider sense of life helps you recognise which earlier signals belong to a sustainable future rather than a temporary rush.",
        },
      ],
      tension:
        "The week offers more than it asks you to carry. A lively signal is not automatically an instruction, and an emotionally charged realisation does not always need an immediate audience. Let observation mature into selection. Preserve enough unclaimed space for the next true connection to appear without forcing the story ahead of its timing.",
      forwardLook:
        "By Sunday, gather the week into one sentence: what became clearer, what was chosen, and what restored your centre? Move only the live commitment into the next calendar. Archive the rest without contempt; some signals reveal their purpose simply by helping you see the pattern. Name the relationship, place or practice that restored perspective, and protect a return to it before the next week becomes crowded. The week succeeds when curiosity produces a cleaner line of action and restoration protects the capacity to continue it.",
    },
    dayArc: {
      introduction:
        "The report’s wider seven-day movement can be practised inside each day: receive the signal, choose its place, then restore enough quiet to hear what remains true.",
      phases: [
        {
          period: "morning",
          label: "Morning",
          title: "Receive before deciding",
          guidance:
            "Notice what returns to attention and place it in the signal ledger. Do not turn the first interesting message into a full week of obligation.",
          level: 2,
        },
        {
          period: "noon",
          label: "Noon",
          title: "Choose the line",
          guidance:
            "Give the strongest relevant signal a boundary in time, language or responsibility. A precise next step is more useful than a broad declaration.",
          level: 3,
        },
        {
          period: "evening",
          label: "Evening",
          title: "Restore proportion",
          guidance:
            "Step away from urgency long enough to recognise value. Keep what still feels coherent in quiet; let the merely loud return to the background.",
          level: 1,
        },
      ],
      note: "This daily rhythm mirrors the edition’s weekly interpretive sequence; the timed weekly chapters remain the governing structure.",
    },
  },
};

export function sampleBriefWordCount(report: SampleReportKey) {
  const brief = sampleReportPresentation[report].brief;
  return [
    ...brief.overview,
    ...brief.priorities.map((item) => `${item.title} ${item.narrative}`),
    brief.tension,
    brief.forwardLook,
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
