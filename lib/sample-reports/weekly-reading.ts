import { sampleBirthInput, sampleChart, sampleIdentity } from "@/lib/samples";
import { buildWeeklyReadingAnalysis } from "@/lib/weekly-readings/calculation";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";
import { weeklyReadingContentSchema } from "@/lib/weekly-readings/domain";

const SAMPLE_READING_ID = "4b891153-bb9b-4b27-a933-a83d9357411c";
const SAMPLE_READING_START = "2026-08-09";

const editorial = {
  headline: "A week for measured expansion and clearer direction",
  overview: [
    "The week begins by asking you to listen before you organise. Sunday’s emotional weather is quick and revealing: an instinctive response may show you what has been waiting for acknowledgement, but it does not require an immediate verdict. Give the feeling a name, let it settle into the body, and notice what remains true once the first intensity has passed. A useful beginning is quiet, honest, and deliberately free of pressure to explain everything at once.",
    "Monday and Tuesday widen the horizon. Jupiter’s supportive relationship with your natal Saturn joins possibility to structure, making this the strongest constructive current of the week. The invitation is not to say yes to more; it is to recognise which opportunity could become durable with the right boundary, sequence, and standard. Compare any exciting opening with the longer life you want to build. A modest trial, a defined scope, or a clear next milestone will tell you more than an unlimited promise.",
    "Midweek turns expansion into choice. Mars presses against the public and vocational angle of the chart, which can make competing priorities feel louder than they are. Wednesday and Thursday favour a clean line: complete one consequential action, state one limit before frustration speaks for you, and release work that belongs to someone else. Directness will be most effective when it is narrow and specific. You do not need to solve the whole situation to change its direction.",
    "Friday rewards careful language. Put the important point in writing, confirm the practical details, and allow precision to replace speed. By Saturday the week becomes more visible and self-defining. The Sun’s contact with natal Neptune can illuminate a genuine aspiration while also making performance tempting. Choose the commitment that still feels coherent without applause. The week closes well when you can name what you are building, what you are declining, and the next observable action that makes your direction real.",
  ].join("\n\n"),
  priorities: [
    {
      title: "Let the first feeling become information",
      narrative:
        "Sunday is a listening day. Record the response that arrives before analysis, then revisit it after a short pause. What persists deserves attention; what fades may simply have needed room to move.",
    },
    {
      title: "Give the promising path a workable shape",
      narrative:
        "Use Monday and Tuesday to test an opportunity against time, capacity, and the future you actually want. Define a bounded experiment or milestone before offering a larger commitment.",
    },
    {
      title: "Choose substance over performance",
      narrative:
        "Saturday asks for visible self-direction without manufactured certainty. Name one priority you can support with action even if nobody is watching or immediately agrees.",
    },
    {
      title: "Make one clean decision at midweek",
      narrative:
        "On Wednesday, concentrate effort instead of escalating it. Finish, schedule, delegate, or decline one specific thing so the rest of the week has a clearer line to follow.",
    },
  ],
  forwardLook:
    "Carry forward the structure that made growth feel credible. A useful opportunity should become clearer when you give it limits, and a true direction should survive the absence of urgency. Keep the decision, boundary, or written agreement that created more coherence; release the pressure to appear certain before experience has had its say.",
  days: [
    {
      narrative:
        "The week opens with a quick emotional signal that can reveal where your daily rhythm needs adjustment. You may notice a preference, concern, or desire before you have language for it. Treat that first response as information rather than instruction. A short pause will help you distinguish a meaningful inner cue from a passing crest. If the signal remains after rest, food, movement, or a change of setting, give it one proportionate response instead of building an entire story around it.",
      guidance: [
        "Write one sentence naming the response that arrived before analysis.",
        "Pause before acting and check what remains true after your body settles.",
        "Make one small adjustment to timing, rest, or availability.",
      ],
      watchFor:
        "Treating a brief emotional peak as a permanent truth about yourself or another person.",
    },
    {
      narrative:
        "The horizon widens, but the best opening is the one that can support weight. Compare any invitation, idea, or ambition with the longer direction you want to establish. Growth becomes credible when it has a boundary: a trial period, a defined budget, a named responsibility, or a date for review. This is a good day to explore without pretending exploration is already commitment. Let curiosity gather evidence while your standards decide what deserves a place in the larger plan.",
      guidance: [
        "Compare one immediate opportunity with your twelve-month direction.",
        "Define the smallest useful experiment before making a larger promise.",
        "Name the resource or boundary that sustainable growth would require.",
      ],
      watchFor:
        "Assuming a larger option is automatically the more meaningful one.",
    },
    {
      narrative:
        "Tuesday concentrates the constructive potential that began yesterday. An idea is ready to move from possibility into architecture. Choose the version you can explain, schedule, and evaluate. If other people are involved, clarify ownership before enthusiasm creates invisible obligations. This is strong ground for a decision that joins optimism with patience: not the fastest route, but the one whose foundations you are willing to maintain. A precise next milestone will protect the vision from becoming either inflated or prematurely abandoned.",
      guidance: [
        "Turn one promising idea into a dated next milestone.",
        "Clarify who owns the next action and what completion will look like.",
        "Choose a pace you could sustain after the initial excitement passes.",
      ],
      watchFor:
        "Expanding the scope before the first useful version has been tested.",
    },
    {
      narrative:
        "Midweek asks for a clean use of force. Friction may point to an overextended commitment, blurred responsibility, or task that has remained undecided for too long. Narrow the field. One completed action or clearly stated limit will create more movement than a dramatic attempt to fix everything. If frustration rises, translate it into the specific change you can make or request. Directness works best here when it is practical, time-bound, and free of accumulated accusation.",
      guidance: [
        "Complete, schedule, delegate, or decline one consequential task.",
        "State one boundary before irritation has to communicate it for you.",
        "Reduce a broad problem to the next action you can control.",
      ],
      watchFor:
        "Escalating urgency when a narrower action would resolve the real issue.",
    },
    {
      narrative:
        "Thursday is for holding the line you chose yesterday. The pressure is easing, which makes it possible to distinguish necessary effort from momentum driven by frustration. Review the decision in calmer conditions. Keep what creates clarity; revise what was merely reactive. This is also a useful day to make the boundary operational through a calendar change, written agreement, or reassigned responsibility. A limit becomes trustworthy when daily structure supports it after the emotion has passed.",
      guidance: [
        "Review yesterday’s decision after the immediate pressure has eased.",
        "Put the boundary into a calendar, hand-off, or written agreement.",
        "Remove one task that no longer belongs inside the chosen scope.",
      ],
      watchFor:
        "Reopening a sound decision simply because the original urgency has faded.",
    },
    {
      narrative:
        "Friday favours language that can carry responsibility. Put the central point in writing before a consequential conversation, then check the details that keep meaning from becoming ambiguous: names, dates, assumptions, dependencies, and hand-offs. Emotional depth may sit beneath an apparently practical exchange, so precision is kinder than speed. You do not need to disclose everything you feel, but you do need to make the agreement understandable. Leave the conversation with a shared sentence about what happens next.",
      guidance: [
        "Write the central point in one clear sentence before speaking.",
        "Confirm dates, ownership, and the next hand-off explicitly.",
        "Ask the other person to describe the agreement in their own words.",
      ],
      watchFor:
        "Letting fluency or speed substitute for a precise shared understanding.",
    },
    {
      narrative:
        "The week closes with a question of visible self-direction. A genuine aspiration may feel vivid, but so may the urge to appear resolved before the decision is ready. Choose substance over performance. Name the priority that remains meaningful without immediate recognition and make one action that supports it. If uncertainty remains, let your commitment be to the next honest step rather than a polished final identity. Direction becomes credible through repeated choices, not through the force of a single declaration.",
      guidance: [
        "Name the priority you would choose even without immediate recognition.",
        "Make one visible action that supports that direction.",
        "Separate the next honest step from the pressure to present a finished identity.",
      ],
      watchFor:
        "Performing certainty or making a public promise before the underlying choice is ready.",
    },
  ],
  sections: [
    {
      title: "Listen first, then shape the response",
      narrative:
        "The emotional opening of the week is brief but useful. Its value lies in revealing what needs attention before habit or explanation takes over. The practice is not to obey every feeling; it is to receive the signal, regulate the immediate response, and see what remains. This makes emotional timing part of discernment rather than a competitor to it.",
      practicalApplications: [
        "Use a short written check-in before changing a plan.",
        "Review important reactions after basic physical needs are met.",
        "Let repeated signals earn more weight than isolated intensity.",
      ],
    },
    {
      title: "Growth needs a container",
      narrative:
        "The strongest constructive thread joins expansion to responsibility. Possibility becomes useful when it can be translated into scope, sequence, resources, and review. This is not a demand to think smaller. It is an invitation to build in a way that protects the idea from both overreach and neglect. The right structure should make the opportunity easier to inhabit, not merely harder to escape.",
      practicalApplications: [
        "Give new work a trial period and a review date.",
        "Define success before increasing time or financial commitment.",
        "Keep one margin for rest, revision, or unexpected information.",
      ],
    },
    {
      title: "Visible direction without false certainty",
      narrative:
        "By the weekend, the question is no longer what might be possible but what you are willing to make visible through action. Vision matters, yet it needs contact with reality. A grounded commitment can remain provisional while still being sincere. Let conduct carry the message: choose the priority, take the next step, and allow identity to emerge from what you repeatedly support.",
      practicalApplications: [
        "Make the commitment observable through a scheduled action.",
        "Use private standards before seeking public confirmation.",
        "Revise the story when experience contradicts the first interpretation.",
      ],
    },
  ],
  questions: [
    "Which emotional signal remained meaningful after the first intensity passed?",
    "What opportunity became more credible when you gave it a boundary or sequence?",
    "Where did one clean decision create more space than additional effort?",
    "What do you want to make visible through action rather than explanation?",
  ],
} as const;

export async function buildSampleWeeklyReading() {
  const natalChart = await sampleChart();
  const analysis = buildWeeklyReadingAnalysis({
    natalChart,
    readingStartDate: SAMPLE_READING_START,
    observationTimeZone: sampleBirthInput.place.timeZone,
    locale: "en-GB",
    calculatedAtUtc: "2026-08-09T12:00:00.000Z",
  });
  const base = buildWeeklyReadingContent(analysis, SAMPLE_READING_ID);
  if (
    base.bottomLineUpFront.practicalPriorities.length !==
      editorial.priorities.length ||
    base.dayByDay.length !== editorial.days.length ||
    base.sections.length !== editorial.sections.length
  )
    throw new Error("SAMPLE_WEEKLY_READING_STRUCTURE_CHANGED");

  const content = weeklyReadingContentSchema.parse({
    ...base,
    header: {
      ...base.header,
      headline: editorial.headline,
      methodologyLabel: `${base.header.methodologyLabel} · sample edition`,
    },
    bottomLineUpFront: {
      ...base.bottomLineUpFront,
      title: "Build the larger path one deliberate choice at a time",
      overview: {
        ...base.bottomLineUpFront.overview,
        narrative: editorial.overview,
      },
      practicalPriorities: base.bottomLineUpFront.practicalPriorities.map(
        (priority, index) => ({
          ...priority,
          ...editorial.priorities[index],
        }),
      ),
      forwardLook: {
        ...base.bottomLineUpFront.forwardLook,
        narrative: editorial.forwardLook,
      },
    },
    dayByDay: base.dayByDay.map((day, index) => ({
      ...day,
      ...editorial.days[index],
    })),
    sections: base.sections.map((section, index) => ({
      ...section,
      ...editorial.sections[index],
    })),
    reflectiveQuestions: editorial.questions,
  });

  return {
    analysis,
    content,
    profileLabel: `${sampleIdentity.name} birth chart`,
  };
}
