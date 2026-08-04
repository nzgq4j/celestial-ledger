import Link from "next/link";
import { notFound } from "next/navigation";
import { sampleChart, sampleIdentity } from "@/lib/samples";

const editions = {
  "career-purpose": {
    eyebrow: "Career and Purpose · sample edition",
    title: "The Messenger’s Vocation",
    intro:
      "A restless, articulate Sun seeks work that moves ideas between worlds. This chart finds purpose where curiosity becomes connection and knowledge becomes something others can use.",
    sections: [
      [
        "The work of the messenger",
        "The Gemini Sun gives this life a many-windowed mind: alert to language, contrast and the hidden link between apparently separate subjects. Purpose gathers wherever questions can be translated into clarity.",
      ],
      [
        "Depth behind the voice",
        "The Moon asks for emotional honesty beneath the quickness of the mind. The most resonant work does not merely inform; it enters the deeper room, names what others avoid and makes transformation speakable.",
      ],
      [
        "A public path of discernment",
        "The angles and houses turn talent into practice. Sustainable contribution comes through exact observation, carefully chosen commitments and the courage to refine a calling rather than force a single permanent identity.",
      ],
      [
        "Questions for the road",
        "Which idea are you uniquely able to translate? Where does curiosity become service? What form of work lets both your range and your depth remain alive?",
      ],
    ],
  },
  "recovery-reflection": {
    eyebrow: "Recovery Reflection · sample edition",
    title: "Returning to the Inner Compass",
    intro:
      "This natal sky carries both motion and depth. Renewal begins by giving the quick mind a steady rhythm, then listening for the quieter truth beneath urgency.",
    sections: [
      [
        "Grounding · the ritual of return",
        "Gemini energy renews through movement, naming and exchange. Grounding need not mean stillness; it can be a faithful sequence of small actions that brings scattered currents back into one channel.",
      ],
      [
        "Self-trust · the voice beneath the noise",
        "The Moon’s deeper register asks for privacy, candour and emotional loyalty. Self-trust grows when feeling is neither dramatized nor dismissed, but allowed to disclose what needs protection and what is ready to change.",
      ],
      [
        "Boundaries · a sacred perimeter",
        "A strong boundary is not a wall against life. In this chart it becomes the vessel that lets curiosity stay bright without being claimed by every invitation, mood or demand.",
      ],
      [
        "Renewal · choosing the next true step",
        "Transformation arrives through repetition rather than spectacle. Each deliberate return to the body, the trusted relationship and the chosen daily rhythm becomes part of a new constellation.",
      ],
    ],
  },
  "weekly-reading": {
    eyebrow: "Weekly Reading · subscriber sample",
    title: "Seven Days Beneath a Moving Sky",
    intro:
      "A weekly edition follows the living conversation between the natal chart and the present sky—showing where momentum gathers, where patience has power and which questions belong to the week ahead.",
    sections: [
      [
        "The week’s threshold",
        "Mercury brings the natal Gemini Sun into sharper focus. Conversations carry unusual weight now: one exchange may reveal the name of a path that has been forming quietly for some time.",
      ],
      [
        "Midweek current",
        "The Moon moves across the chart’s deeper waters, making Wednesday and Thursday suited to private inventory, honest repair and the release of an obligation that no longer carries life.",
      ],
      [
        "The weekend opening",
        "Venus softens the field toward companionship and beauty. Choose environments that restore proportion. What feels spacious, well-made and sincere will be more instructive than what merely demands attention.",
      ],
      [
        "Carry this question",
        "What deserves a place in the coming week because it strengthens both your curiosity and your centre?",
      ],
    ],
  },
} as const;

const chapterCompanions = {
  "career-purpose": [
    {
      analysis:
        "With the Sun high in Gemini's field of exchange, intelligence is not meant to remain private. The chart repeatedly draws knowledge toward an audience: a client who needs orientation, a team that needs a common language, or a community ready for a more useful way to understand itself. Variety is essential, but it becomes vocation only when it is gathered around a recognisable promise.",
      prompt:
        "Name the subject people already ask you to explain. What larger body of work could grow from that natural role?",
    },
    {
      analysis:
        "The Moon adds instinct, memory and emotional perception to the verbal gift. This is why purely transactional communication eventually feels thin. The stronger path combines facts with human stakes: research with story, strategy with empathy, or instruction with the ability to sense what has not yet been said aloud.",
      prompt:
        "Where has your insight helped someone feel understood as well as informed?",
    },
    {
      analysis:
        "The Midheaven describes a public image built through refinement rather than spectacle. Reputation grows when the work is exact, well edited and dependable. This favours roles in which discernment matters: advising, designing systems, curating information, diagnosing organisational problems, or improving an experience until it feels inevitable.",
      prompt:
        "Which standard of quality do you uphold even when nobody else has asked for it?",
    },
    {
      analysis:
        "These questions belong together. The chart does not ask you to choose between range and mastery; it asks you to create a structure spacious enough for both. A portfolio career, a teaching practice, a consultancy, or a leadership role spanning several disciplines can turn apparent restlessness into a distinctive method.",
      prompt:
        "Write one sentence beginning: My work helps people move from ___ to ___.",
    },
    {
      analysis:
        "Mercury's condition shows that your best thinking is relational. Ideas sharpen through dialogue, comparison and the pressure of a real question. Solitary preparation has value, yet the final intelligence arrives in exchange—through the interview, workshop, editorial conversation or strategic room where several perspectives meet.",
      prompt:
        "Which conversation would move your most important idea forward this month?",
    },
    {
      analysis:
        "Mars brings protective feeling into the pattern of effort. You work hardest for what you consider worth safeguarding: a person, a culture, a body of knowledge or a future possibility. When motivation disappears, reconnect the task to the life it protects. Emotional allegiance is a more durable fuel here than competition alone.",
      prompt:
        "What are you willing to build patiently because you care about what it protects?",
    },
    {
      analysis:
        "Saturn asks the imagination to accept form. Inspiration becomes authority through schedules, repeatable processes and work completed when the mood is absent. The long apprenticeship is not punishment; it is the architecture that allows a subtle gift to become trustworthy in the hands of others.",
      prompt:
        "Choose one craft to practise at the same time each week for the next twelve weeks.",
    },
    {
      analysis:
        "The mature vocational signature is a bridge-builder with depth: someone able to travel between disciplines, recognise the governing pattern and return with language others can act upon. Titles may change across the years, but this function remains the golden thread. Following it creates coherence without demanding sameness.",
      prompt:
        "Which three past roles reveal the same hidden function when you look beneath their titles?",
    },
  ],
  "recovery-reflection": [
    {
      analysis:
        "A quick Mercurial nature often returns to centre through rhythm before stillness. Walking, preparing food, writing a few honest lines or completing one familiar task can become a threshold back into the present. The point is not perfection; it is the repeated experience of finding the path home.",
      prompt:
        "Choose a five-minute ritual that can mark your return to yourself on an unsettled day.",
    },
    {
      analysis:
        "Self-trust strengthens when inner signals are received before they are debated. The chart's emotional depth can detect a shift long before the reasoning mind has assembled an explanation. Recording the signal without immediately judging it creates room for discernment and restores confidence in your own timing.",
      prompt:
        "What quiet signal have you noticed recently, and what would respectful attention to it look like?",
    },
    {
      analysis:
        "Boundaries protect the conditions in which renewal can continue. A clear no, a delayed reply, or a decision to leave an overstimulating setting may look small from outside, yet each act confirms that your energy has a rightful shape. Consistency makes the perimeter feel natural rather than defensive.",
      prompt:
        "Complete the sentence: I remain available for connection, but I am no longer available for ___.",
    },
    {
      analysis:
        "The chart favours renewal that can be witnessed in ordinary life. A room put back in order, a promise kept, or an evening protected for rest carries more power than a dramatic declaration. The new constellation appears through accumulated evidence that you can rely upon yourself today.",
      prompt:
        "What is the smallest visible action that would make today feel aligned with the life you are renewing?",
    },
    {
      analysis:
        "Trusted relationships offer both candour and spaciousness. The right circle does not require a polished performance or constant explanation. It makes room for direct requests, changing capacity and the dignity of silence. Mutuality—not intensity—is the clearest sign that a bond can support the path ahead.",
      prompt:
        "Who helps you feel more like yourself after time together, and how can you invite more of that connection?",
    },
    {
      analysis:
        "Daily rhythm is a vessel, not a verdict. It should be strong enough to carry you and flexible enough to survive an imperfect day. Anchoring morning, nourishment, movement and rest around a few dependable cues reduces the number of decisions required when energy is low.",
      prompt:
        "Identify one morning anchor and one evening anchor that are realistic even on a difficult day.",
    },
    {
      analysis:
        "Under pressure, many possible futures may arrive at once. Sequence restores proportion: first the body, then the immediate environment, then the next conversation or decision. This order gives emotional weather time to move without asking it to define the whole horizon.",
      prompt:
        "Write your three-step return sequence in language simple enough to remember without effort.",
    },
    {
      analysis:
        "Integration becomes visible when care is no longer reserved for exceptional moments. It enters the calendar, the home, the friendships you choose and the way you speak to yourself after a difficult hour. Renewal then becomes less a destination than a loyal relationship with your own life.",
      prompt:
        "Which part of your renewed pattern is ready to become ordinary—and therefore lasting?",
    },
  ],
  "weekly-reading": [
    {
      analysis:
        "The opening transit activates the chart's gift for language and pattern recognition. Messages, repeated phrases and unexpected introductions deserve attention, especially when they connect two areas of life that previously seemed separate. Curiosity is the compass, but discernment chooses which signal becomes a path.",
      prompt:
        "Keep a short signal log: what subject, name or invitation appears more than once?",
    },
    {
      analysis:
        "As the Moon touches deeper natal territory, the middle of the week turns inward. This is fertile space for reviewing motives, repairing a small breach of trust, or naming the emotional cost of an old obligation. Privacy supports clarity; not every realisation needs an immediate audience.",
      prompt:
        "What becomes clear when you stop explaining it and simply listen?",
    },
    {
      analysis:
        "Venus changes the tempo toward receptivity. Beauty, companionship and well-made surroundings are not distractions now; they restore the proportion needed to recognise what is genuinely valuable. Let the weekend contain one experience chosen for delight rather than usefulness.",
      prompt:
        "Choose one place, person or creative practice that reliably returns you to a wider sense of life.",
    },
    {
      analysis:
        "The week's central question joins movement with centre. Opportunity is abundant, but only the choices that strengthen inner coherence deserve continuation. The answer may be less about adding something new than giving a clearer place to what already feels quietly alive.",
      prompt:
        "Which possibility expands your world without requiring you to abandon your centre?",
    },
    {
      analysis:
        "Monday and Tuesday are for collection rather than conclusion. Gather facts, listen for tone and notice where your attention returns after interruption. A premature answer would narrow the field; observation lets the true shape of the week disclose itself.",
      prompt:
        "Delay one non-urgent conclusion until you have gathered a second perspective.",
    },
    {
      analysis:
        "Wednesday and Thursday favour a clean line of commitment. The chart responds well to a decision that can be expressed in plain language and supported by a concrete next action. Selection creates energy because it releases the burden of carrying every option at once.",
      prompt:
        "What can you decide, schedule or respectfully decline before Thursday evening?",
    },
    {
      analysis:
        "From Friday onward, the sky rewards restoration and reciprocal company. Leave margin around plans; the most nourishing exchange may arise between scheduled events. A quieter pace allows both body and intuition to catch up with everything the mind has gathered.",
      prompt:
        "Protect one unclaimed hour this weekend and let its use emerge naturally.",
    },
    {
      analysis:
        "The week resolves through a simple movement: receive the signal, choose the line, then create space around the choice. This rhythm turns information into wisdom and action into something sustainable. Carry it forward whenever the coming days begin to feel crowded.",
      prompt:
        "At week's end, name one signal you followed, one choice you made and one space you protected.",
    },
  ],
} as const;

type PracticalFocus = {
  start: string;
  routine: string;
  conversation: string;
  boundary: string;
  evidence: string;
};

const practicalFocus: Record<keyof typeof editions, readonly PracticalFocus[]> =
  {
    "career-purpose": [
      {
        start:
          "choose one idea you understand well and explain it in one page for a real person who needs it",
        routine:
          "keep a weekly list of questions people ask you, then turn one repeated question into a useful note, guide, or short talk",
        conversation:
          "ask a colleague which part of your explanation helped them act and which part still felt unclear",
        boundary:
          "do not accept every interesting subject as a new project; keep only the work that serves the promise you want your career to make",
        evidence:
          "a reader, client, or colleague can describe the next step more clearly after hearing from you",
      },
      {
        start:
          "rewrite one piece of professional communication so that it names both the facts and the human concern underneath them",
        routine:
          "after important meetings, write down what was said, what was felt, and what was avoided",
        conversation:
          "invite one trusted person to tell you when your language feels warm and precise, and when it becomes clever but distant",
        boundary:
          "share emotional insight only when it serves the work and respects another person’s privacy",
        evidence:
          "people leave an exchange feeling understood as well as informed",
      },
      {
        start:
          "pick one piece of work that represents your standards and improve its structure, wording, and finish before showing it again",
        routine:
          "reserve a fixed review period each week for editing, checking, and simplifying work that is already in progress",
        conversation:
          "ask a respected peer what they rely on you to notice that others often miss",
        boundary:
          "separate careful refinement from endless perfectionism by deciding in advance what finished means",
        evidence:
          "your work requires fewer corrections and people begin to seek your judgement earlier in a project",
      },
      {
        start:
          "write a single sentence that explains who your work helps, what change you help create, and how you do it",
        routine:
          "review current projects every Friday and remove, delegate, or pause anything that does not support that sentence",
        conversation:
          "test your sentence with three people from different parts of your working life and notice which words they remember",
        boundary:
          "allow variety in your roles without letting other people’s urgent requests replace your central direction",
        evidence:
          "different projects begin to look like parts of one body of work rather than unrelated jobs",
      },
      {
        start:
          "schedule the conversation that could answer the most important open question in your current work",
        routine:
          "prepare three precise questions before interviews, workshops, or planning meetings and record the useful differences in the answers",
        conversation:
          "speak with someone who sees the problem from another discipline, level of seniority, or lived experience",
        boundary:
          "do not use conversation to delay a decision once the same answer has appeared several times",
        evidence:
          "dialogue produces a clearer choice, stronger draft, or better-defined problem",
      },
      {
        start:
          "name the person, place, value, or future possibility that your current effort is meant to protect",
        routine:
          "begin difficult work sessions by writing one line about why the result matters beyond status or competition",
        conversation:
          "tell a collaborator what you are trying to safeguard and ask what they believe is worth protecting too",
        boundary:
          "do not turn care into overwork; protection must include your own time, health, and capacity",
        evidence:
          "motivation becomes steadier because daily tasks are connected to a meaningful purpose",
      },
      {
        start:
          "choose one craft that would make your contribution more trustworthy and define a twelve-week practice plan",
        routine:
          "work on that craft at the same time each week, even when the session is short or the result is ordinary",
        conversation:
          "ask an experienced practitioner to identify the one basic skill you should strengthen before chasing advanced techniques",
        boundary:
          "protect practice time from novelty, comparison, and the urge to redesign the plan after a difficult week",
        evidence:
          "you can point to completed exercises, cleaner work, and fewer repeated mistakes",
      },
      {
        start:
          "list three past roles and describe the useful function you performed in each without using job titles",
        routine:
          "collect examples of moments when you found a pattern, gave it clear language, and helped someone orient themselves",
        conversation:
          "ask former colleagues what contribution remained consistent even when your formal responsibilities changed",
        boundary:
          "do not force your career into one narrow title if the deeper function is coherent and valuable",
        evidence:
          "you can explain your vocational thread simply and use it to assess new opportunities",
      },
    ],
    "recovery-reflection": [
      {
        start:
          "choose a five-minute action—walking, washing a cup, making tea, or writing three honest lines—that marks a return to the present",
        routine:
          "use the same action after waking, after stress, or whenever the day begins to scatter",
        conversation:
          "tell one trusted person what your return ritual is so you can name it plainly when you need space to use it",
        boundary:
          "keep the ritual small enough to do on a difficult day and do not turn it into another test of perfection",
        evidence:
          "you notice the body settling and can identify the next manageable action",
      },
      {
        start:
          "record one physical or emotional signal before trying to explain, solve, or dismiss it",
        routine:
          "pause at the same two times each day and ask what you feel, what you need, and what can wait",
        conversation:
          "share one clear signal with a trusted person without apologising for it or demanding an immediate solution",
        boundary:
          "treat a signal as information rather than a command; listen first, then choose your response",
        evidence:
          "decisions feel less reactive because your own experience is included early",
      },
      {
        start:
          "complete the sentence ‘I am available for this, but I am not available for that’ about one current demand",
        routine:
          "delay non-urgent replies until you have checked your time, energy, and existing commitments",
        conversation:
          "state one boundary in short, respectful language without building a long defence around it",
        boundary:
          "remember that another person’s disappointment does not automatically mean the boundary is wrong",
        evidence:
          "you keep more promises, feel less resentment, and recover more quickly after social contact",
      },
      {
        start:
          "choose the smallest visible action that would make today support renewal, then complete it before planning a larger change",
        routine:
          "end each day by noting one promise kept, one useful limit, and one moment of honest care",
        conversation:
          "tell a supportive person what small action you are taking today rather than making a dramatic promise about the future",
        boundary:
          "avoid all-or-nothing plans that make one imperfect day feel like the end of the path",
        evidence:
          "ordinary days contain more repeated proof that you can rely on yourself",
      },
      {
        start:
          "identify one person after whose company you feel steadier, clearer, and more like yourself",
        routine:
          "make one regular point of contact that does not depend on a crisis or a perfect mood",
        conversation:
          "ask directly for the kind of connection you need, such as listening, company, practical help, or quiet presence",
        boundary:
          "step back from relationships that demand performance, secrecy, or constant access to your attention",
        evidence:
          "contact leaves more capacity than it consumes and support becomes mutual rather than dramatic",
      },
      {
        start:
          "choose one realistic morning anchor and one evening anchor that can survive a low-energy day",
        routine:
          "connect food, movement, rest, and necessary tasks to a few dependable cues instead of relying on motivation",
        conversation:
          "explain your basic rhythm to the people you live or work with and ask for one practical form of support",
        boundary:
          "protect sleep and nourishment from plans that repeatedly borrow energy from the following day",
        evidence:
          "fewer basic decisions are made in crisis and difficult days have a familiar shape",
      },
      {
        start:
          "write a three-step sequence beginning with the body, moving to the immediate environment, and ending with one decision or conversation",
        routine:
          "use that sequence before analysing the whole future whenever pressure makes every problem feel equally urgent",
        conversation:
          "give a trusted person the simple words you will use when you need help returning to the sequence",
        boundary:
          "postpone major conclusions while you are hungry, exhausted, overwhelmed, or physically unsafe",
        evidence:
          "pressure becomes a series of manageable steps rather than one totalising story",
      },
      {
        start:
          "choose one part of renewal that is ready to become an ordinary calendar commitment",
        routine:
          "place that commitment beside existing responsibilities instead of treating care as something added only when time remains",
        conversation:
          "describe the change in practical terms to someone affected by it and invite a clear, respectful agreement",
        boundary:
          "do not abandon a sustaining pattern simply because it no longer feels new or dramatic",
        evidence:
          "care appears consistently in your schedule, home, relationships, and inner language",
      },
    ],
    "weekly-reading": [
      {
        start:
          "keep a short note of names, subjects, requests, and phrases that repeat during Monday and Tuesday",
        routine:
          "review the note at the end of each day and circle only the signals connected to a real responsibility or opportunity",
        conversation:
          "ask one direct follow-up question instead of guessing what an important message means",
        boundary:
          "do not treat every coincidence or notification as an instruction to act",
        evidence:
          "one repeated signal leads to a useful conversation, decision, or piece of work",
      },
      {
        start:
          "set aside twenty quiet minutes on Wednesday to name the emotional cost of one unfinished obligation",
        routine:
          "separate what happened, what you felt, and what action is now possible",
        conversation:
          "repair one small breach with plain words, or ask for time before discussing something that is not yet clear",
        boundary:
          "keep private reflection private until sharing it would serve understanding rather than discharge tension",
        evidence: "an old demand becomes clearer, smaller, or ready to release",
      },
      {
        start:
          "choose one weekend experience for beauty, companionship, or simple pleasure without asking it to be productive",
        routine:
          "leave open space around plans so the body and attention can change pace",
        conversation:
          "invite someone whose company feels reciprocal and easy rather than impressive or demanding",
        boundary:
          "decline one environment that is likely to leave you overstimulated, rushed, or out of proportion",
        evidence:
          "the weekend restores perspective and you begin the next week with more room inside your attention",
      },
      {
        start:
          "compare current possibilities by asking which one expands curiosity while also strengthening your centre",
        routine:
          "write one sentence each evening about what gave energy and what scattered it",
        conversation:
          "describe your leading option to someone who will ask practical questions without taking the decision away from you",
        boundary:
          "do not add a new commitment unless you can name what will receive less time as a result",
        evidence:
          "the chosen possibility creates both movement and greater coherence",
      },
      {
        start:
          "delay one non-urgent conclusion until you have gathered a second perspective or one more useful fact",
        routine:
          "use Monday and Tuesday for notes, questions, and observation rather than public declarations",
        conversation:
          "listen for tone and hesitation as carefully as you listen for the stated answer",
        boundary:
          "set a clear time when collection ends so openness does not become avoidance",
        evidence:
          "the eventual decision reflects the real shape of the situation rather than the first impression",
      },
      {
        start:
          "choose one matter that can be decided, scheduled, delegated, or respectfully declined by Thursday evening",
        routine:
          "translate every decision into one visible next action with a person, date, or place attached",
        conversation:
          "state the decision in one or two sentences and invite only the feedback needed to carry it out",
        boundary:
          "stop reopening options that no longer meet the week’s central priority",
        evidence:
          "energy returns because fewer unresolved choices are competing for attention",
      },
      {
        start:
          "protect one unclaimed hour between Friday and Sunday and decide how to use it only when it arrives",
        routine:
          "reduce the pace of transitions by leaving margin between work, travel, social plans, and rest",
        conversation:
          "choose company that allows pauses, honest changes of plan, and shared attention",
        boundary:
          "do not fill restored space simply because an empty hour feels unfamiliar",
        evidence:
          "body and intuition catch up with what the mind learned earlier in the week",
      },
      {
        start:
          "write down one signal received, one choice made, and one space protected during the week",
        routine:
          "use this three-line review every Sunday before planning the next seven days",
        conversation:
          "share the clearest lesson with a person who is involved in the week ahead",
        boundary:
          "carry forward the lesson without carrying forward every unfinished detail",
        evidence:
          "the week produces a simple principle you can use again instead of becoming a blur of events",
      },
    ],
  };

function practicalApplications(focus: PracticalFocus, prompt: string) {
  return [
    `Start with something you can do, not a perfect explanation. This week, ${focus.start}. Put it on a real day and give it a clear beginning and end. If it takes more than an hour, reduce it until you can begin without needing ideal conditions. The aim is to test the reading in ordinary life. Notice what becomes easier, what creates resistance, and what new information appears once you act. Do not judge the whole direction from one attempt. Treat the first action as a useful experiment that gives you better facts about yourself.`,
    `Build repetition around the theme. A practical way to do that is to ${focus.routine}. Keep the method simple enough to use during a crowded week. A note in your calendar, a short checklist, or a recurring reminder is enough. Consistency matters more than intensity because a pattern becomes visible only when you can compare several real examples. At the end of each attempt, write one sentence about what happened. Over four weeks, those sentences will show whether the practice supports clearer choices, steadier energy, or better relationships.`,
    `Bring another person into the process when that would create useful feedback or support. You could ${focus.conversation}. Be specific about what you are asking for. You may want an observation, a practical agreement, a listening ear, or an honest answer. Avoid asking someone else to decide what the section means for you. Their role is to help you see the effect of your choices more clearly. After the conversation, write down what you heard in plain language and decide which part, if any, belongs in your next action.`,
    `Use a boundary to protect the practice. In this section, that means remembering: ${focus.boundary}. Say the boundary in a short sentence and connect it to a behaviour you control. A boundary is not a demand that everybody agree with you. It is a decision about what you will do, accept, postpone, or leave. Review it after a week rather than changing it in the heat of one uncomfortable moment. A useful boundary should create enough space for the central practice to continue without turning your life into a rigid set of rules.`,
    `Look for evidence instead of waiting for a dramatic feeling of certainty. The clearest sign of movement here is that ${focus.evidence}. Choose one way to observe that sign: a completed item, a short weekly rating, a note about a conversation, or a visible change in your schedule. Keep the measure close to daily life and do not turn it into a score of your worth. Its purpose is to show whether the experiment is helping. If the evidence stays flat, change the size or timing of the action before abandoning the underlying theme.`,
    `At the end of the week, return to this question: ${prompt} Answer with one concrete example rather than a general statement. Then choose what to continue, what to adjust, and what to stop. Continue the part that created useful movement. Adjust anything that was too large, vague, or dependent on another person’s cooperation. Stop the part that produced activity without meaning. This short review turns reflection into a living practice. It also keeps the reading flexible: the chart offers a pattern, while your choices show how that pattern can be expressed with greater skill in the life you are actually living.`,
  ];
}

function countWords(parts: readonly string[]) {
  return parts.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

export function generateStaticParams() {
  return Object.keys(editions).map((report) => ({ report }));
}

export default async function SampleReportPage({
  params,
}: {
  params: Promise<{ report: string }>;
}) {
  const { report } = await params;
  const reportKey = report as keyof typeof editions;
  const edition = editions[reportKey];
  if (!edition) notFound();
  const chart = await sampleChart();
  const expanded =
    {
      "career-purpose": [
        [
          "Mercury · the instrument of thought",
          "Mercury describes the mind at work: how information is gathered, ordered and offered back to the world. Vocation strengthens when language has a practical destination—teaching, advising, writing, analysis or any role that turns complexity into a route another person can follow.",
        ],
        [
          "Mars · the pattern of effort",
          "Mars reveals how purpose is pursued. This chart asks for work with a living pulse rather than endless abstraction. Momentum returns when a large ambition is divided into visible acts, each one small enough to complete and meaningful enough to sustain desire.",
        ],
        [
          "Saturn · the long apprenticeship",
          "Saturn marks the chamber of mastery. Its lessons mature slowly, asking for standards, repetition and the willingness to remain with a craft after novelty fades. What first feels like limitation becomes authority once patience has forged a dependable method.",
        ],
        [
          "The vocational synthesis",
          "Taken together, the chart describes a translator, investigator and guide. The calling is less a single title than a recognisable function: discover the pattern, give it language, and help others orient themselves within it.",
        ],
      ],
      "recovery-reflection": [
        [
          "Relationships · the trusted circle",
          "The natal pattern values intelligent companionship, but renewal asks for more than conversation. The trusted circle is made of people before whom performance can soften—relationships that allow both truthful speech and restorative silence.",
        ],
        [
          "Daily rhythms · the vessel of change",
          "Daily life becomes the place where intention takes form. A reliable morning threshold, nourishment at regular hours, movement, rest and a closing ritual give the inner world a recognisable constellation to return to.",
        ],
        [
          "Patterns under pressure",
          "Under strain, the quick mind may try to solve every feeling at once. The wiser movement is sequential: name the present sensation, choose the next grounded action, then let perspective return in its own time.",
        ],
        [
          "Integration · living the new pattern",
          "Integration is the art of making the chosen pattern ordinary. Each boundary kept, each request for support and each return to a sustaining rhythm makes renewal not a distant event but a way of inhabiting the day.",
        ],
      ],
      "weekly-reading": [
        [
          "Monday and Tuesday · gather the signals",
          "The opening days favour observation before declaration. Notice repeated phrases, unexpected invitations and the subject that keeps returning to the edge of attention. The week begins by revealing its central question.",
        ],
        [
          "Wednesday and Thursday · choose the line",
          "Midweek asks for selection. One conversation or task deserves a firmer commitment; another can be released. Clarity grows when energy is given a boundary.",
        ],
        [
          "Friday through Sunday · restore proportion",
          "The later week turns toward relationship, beauty and replenishment. Make room for the people and places that return you to scale. A quieter choice may carry more future than a dramatic one.",
        ],
        [
          "The week in one sentence",
          "Speak clearly, choose deliberately, and leave enough space for the next true signal to arrive.",
        ],
      ],
    }[report as keyof typeof editions] ?? [];
  const chapters = [...edition.sections, ...expanded] as readonly (readonly [
    string,
    string,
  ])[];
  const companions = chapterCompanions[reportKey];
  const chapterApplications = chapters.map((_, index) =>
    practicalApplications(
      practicalFocus[reportKey][index],
      companions[index].prompt,
    ),
  );
  chapters.forEach(([, body], index) => {
    const words = countWords([
      body,
      companions[index].analysis,
      companions[index].prompt,
      ...chapterApplications[index],
    ]);
    if (words < 500 || words > 1000) {
      throw new Error(
        `Sample chapter ${reportKey}/${index + 1} contains ${words} words; expected 500–1000.`,
      );
    }
  });
  return (
    <main className="page-shell sample-report">
      <Link href="/samples" className="horoscope-back">
        ← All sample editions
      </Link>
      <header>
        <p className="eyebrow">{edition.eyebrow}</p>
        <h1>{edition.title}</h1>
        <p>{edition.intro}</p>
        <dl>
          <div>
            <dt>Sample subject</dt>
            <dd>
              {sampleIdentity.name} · {sampleIdentity.sex}
            </dd>
          </div>
          <div>
            <dt>Birth data</dt>
            <dd>
              {sampleIdentity.born} · {sampleIdentity.place}
            </dd>
          </div>
          <div>
            <dt>Natal anchors</dt>
            <dd>
              {chart.placements
                .slice(0, 3)
                .map((item) => `${item.name} in ${item.sign}`)
                .join(" · ")}
            </dd>
          </div>
        </dl>
      </header>
      <div className="sample-report__folio">
        <nav aria-label="Report contents">
          <p className="section-kicker">In this edition</p>
          {chapters.map(([title], index) => (
            <a key={title} href={`#chapter-${index + 1}`}>
              {title}
            </a>
          ))}
          <a href="#chart-data">Chart data</a>
        </nav>
        <article>
          {chapters.map(([title, body], index) => (
            <section
              className="sample-report__chapter"
              key={title}
              id={`chapter-${index + 1}`}
            >
              <span>Chapter {String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{body}</p>
              <p>{companions[index].analysis}</p>
              <div className="sample-report__applications">
                <h3>Practical applications</h3>
                {chapterApplications[index].map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <blockquote>
                <strong>Bring it into your life</strong>
                <p>{companions[index].prompt}</p>
              </blockquote>
            </section>
          ))}
        </article>
      </div>
      <section className="sample-chart-data" id="chart-data">
        <header>
          <p className="eyebrow">Calculated chart appendix</p>
          <h2>The celestial evidence behind this edition</h2>
        </header>
        <div className="sample-chart-data__tables">
          <table>
            <caption>Planetary positions</caption>
            <thead>
              <tr>
                <th>Point</th>
                <th>Position</th>
                <th>House</th>
                <th>Motion</th>
              </tr>
            </thead>
            <tbody>
              {chart.placements.map((item) => (
                <tr key={item.name}>
                  <th>{item.name}</th>
                  <td>
                    {item.degree}° {item.minute}′ {item.sign}
                  </td>
                  <td>{item.house ?? "—"}</td>
                  <td>{item.retrograde ? "Retrograde" : "Direct"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <caption>House cusps</caption>
            <thead>
              <tr>
                <th>House</th>
                <th>Cusp</th>
              </tr>
            </thead>
            <tbody>
              {chart.houses.map((house) => (
                <tr key={house.house}>
                  <th>{house.house}</th>
                  <td>
                    {house.degree}° {house.minute}′ {house.sign}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <table>
          <caption>Major aspects</caption>
          <thead>
            <tr>
              <th>First point</th>
              <th>Aspect</th>
              <th>Second point</th>
              <th>Orb</th>
            </tr>
          </thead>
          <tbody>
            {chart.aspects.map((aspect, index) => (
              <tr key={`${aspect.body1}-${aspect.body2}-${index}`}>
                <th>{aspect.body1}</th>
                <td>{aspect.type}</td>
                <td>{aspect.body2}</td>
                <td>{aspect.orb.toFixed(2)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <aside>
        <p className="eyebrow">Your chart will tell a different story</p>
        <h2>Begin with the sky at your own first breath.</h2>
        <Link href="/#chart" className="button-primary">
          Create my free natal chart
        </Link>
      </aside>
    </main>
  );
}
