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

function practicalApplications(
  focus: PracticalFocus,
  prompt: string,
  chapterIndex: number,
) {
  const methods = [
    () => [
      `Treat this chapter as a field experiment. The question is not whether the description sounds right; it is whether using it changes an ordinary situation. Choose one day this week to ${focus.start}. Decide beforehand where you will do it, who it is for, and what a finished attempt looks like. Keep the first trial small. A short, completed experiment teaches more than an ambitious plan that remains in your notes.`,
      `Before you begin, write a simple prediction: “If this theme is useful, I expect to notice…” Name a change in clarity, energy, behaviour, or response from another person. Then carry out the action without trying to manufacture the result. Record what actually happened, including anything awkward or unexpected. The difference between your prediction and the result is valuable. It shows where the chapter meets real life rather than the version of life you imagined in advance.`,
      `Repeat the experiment in a second setting by choosing to ${focus.routine}. Change only one variable—the audience, time of day, length, or setting—so you can compare the two attempts. If everything changes at once, it becomes difficult to tell what helped. This is not laboratory science; it is a practical way to slow down assumptions and notice which conditions allow the pattern to work well.`,
      `Ask for one piece of outside evidence. You might ${focus.conversation}. Tell the person you want a concrete observation, not praise and not a judgement of your personality. Ask what they saw before and after the action. Their view may confirm your own impression or show an effect you missed. You remain responsible for interpreting the feedback, but you do not have to rely on self-perception alone.`,
      `Protect the experiment from becoming another obligation. Remember that ${focus.boundary}. If the first attempt is too large, cut it in half. If it depends on cooperation you cannot obtain, redesign it around a choice you control. The point is to create contact with the theme, not to prove dedication through difficulty.`,
      `At the end, look for this specific result: ${focus.evidence}. Then answer: ${prompt} Use the experiment as the basis of your answer. Decide whether to repeat the action, change the conditions, or leave the idea alone for now. A useful chapter should produce a clearer next choice, not pressure to agree with every sentence in it.`,
    ],
    () => [
      `This chapter is best applied through observation before intervention. For seven days, create a small log devoted only to this theme. Begin by choosing to ${focus.start}. Write down the date, what was happening, what you noticed first, and what you did next. Keep each entry to three or four lines. The limit prevents reflection from turning into a long argument with yourself and makes patterns easier to compare.`,
      `Use three columns: signal, interpretation, response. A signal is directly observable—a bodily sensation, a phrase, a delay, a repeated question, or a change in tone. An interpretation is the meaning you gave it. A response is what you actually did. Keeping those parts separate matters because the first meaning that comes to mind is not always the most accurate one. After several entries, you can see which interpretations lead to useful responses and which ones increase confusion.`,
      `Give the log a dependable rhythm: ${focus.routine}. Do not wait for a dramatic event. Ordinary examples reveal the pattern more clearly because they are less likely to be distorted by urgency. If nothing happens on a particular day, write “no clear example.” Absence is information too. It may show that the theme appears only under certain conditions or that your attention has been directed somewhere else.`,
      `Midway through the week, use another person as a reality check. You can ${focus.conversation}. Share one example rather than the whole log. Ask what they observed and whether they separate the signal from its possible meaning in the same way. You are not asking them to overrule your experience. You are testing whether an additional viewpoint makes the situation more precise.`,
      `The discipline for this chapter is restraint: ${focus.boundary}. Observation loses value if every entry becomes a reason to act immediately. Mark urgent items clearly, but allow non-urgent patterns to gather. By the end of the week, repeated evidence will carry more weight than one intense moment.`,
      `Review the log by circling the entries that support this outcome: ${focus.evidence}. Then answer: ${prompt} Quote one entry in your response. Choose one response to keep, one interpretation to question, and one signal you want to notice earlier next time. That turns the record into discernment rather than a diary you never use.`,
    ],
    () => [
      `The practical work in this chapter is a boundary rehearsal. Begin with a real situation in which your intention becomes unclear once another person reacts. Your first move is to ${focus.start}. Write the words you plan to use before the situation occurs. Keep them brief enough to say without reading and specific enough that the other person understands what will change.`,
      `Build the statement in three parts: what you can offer, what you cannot offer, and what you will do next. Avoid a long history of why the limit is justified. Too much explanation often hides the actual decision and invites debate about every supporting detail. Read the statement aloud. If it sounds like an accusation, remove claims about the other person’s motives. If it sounds apologetic, remove language that treats your capacity as wrongdoing.`,
      `Practise the boundary in lower-stakes moments through this routine: ${focus.routine}. Repetition helps your nervous system learn that a clear limit can be ordinary. Start with choices such as timing, response speed, meeting length, or the amount of work you can take on. Small, consistent limits make larger conversations less sudden and reduce the resentment that grows when you agree before checking your capacity.`,
      `Prepare for dialogue rather than a perfect speech. You may ${focus.conversation}. Ask the person to reflect back what they heard. Correct misunderstandings without adding a new defence. If they disagree, return to the behaviour you control. A boundary can remain valid even when it is inconvenient to someone else. Agreement is welcome, but it is not the condition that makes the limit real.`,
      `Use this sentence as the guardrail for the exercise: ${focus.boundary}. Write it somewhere private before the conversation. It will help you distinguish discomfort from actual evidence that you chose badly. Review the limit after the immediate emotion has settled, not during the first reaction.`,
      `Judge the exercise by function, not by whether everyone felt pleased. Look for this result: ${focus.evidence}. Then answer: ${prompt} Name the words you used, the response you received, and what you learned about the size or timing of the limit. Adjust the wording if needed, but do not erase the underlying need simply because the first attempt felt unfamiliar.`,
    ],
    () => [
      `Use an evidence ladder for this chapter. Put the larger theme at the top, then identify the smallest action that would count as one step toward it. Begin by deciding to ${focus.start}. The action should be visible enough that you can tell whether it happened. “Be more aligned” is too vague; a completed call, protected hour, finished page, or direct answer can be observed.`,
      `Draw four rungs beneath the larger aim. The first should take less than fifteen minutes. The second should repeat or extend it. The third should involve a modest commitment of time, attention, or conversation. The fourth should produce something another person could recognise. You do not have to climb all four in one week. The ladder exists to prevent an important theme from being reduced to one dramatic leap. Write a likely obstacle beside every rung and one smaller alternative beneath it. Planning the alternative now makes adaptation part of the method rather than evidence that the plan has failed.`,
      `Place the first two rungs into daily life by choosing to ${focus.routine}. Attach them to existing events rather than waiting for spare time. A reliable cue—after breakfast, before a meeting, at the end of Friday—makes action easier to remember. If a rung repeatedly fails, lower it until it fits the life you currently have, not the life you think you ought to have.`,
      `Use one conversation to test whether the ladder is understandable. You can ${focus.conversation}. Show the other person the actions, not the astrological language behind them. Ask whether each rung is clear, realistic, and connected to the result. This keeps the plan grounded and exposes hidden steps you may have assumed would happen automatically.`,
      `A ladder needs edges. In this case, ${focus.boundary}. Without that limit, new demands can consume the time intended for steady progress. Decide in advance what you will postpone or decline while testing the plan.`,
      `Review the ladder after two weeks. The evidence you want is that ${focus.evidence}. Answer: ${prompt} Move successful actions upward into a regular routine. Rewrite unclear rungs. Remove any step that creates motion without bringing the larger theme closer. Progress here should feel cumulative: several modest pieces of evidence forming a pattern you can trust.`,
    ],
    () => [
      `Apply this chapter by making a relationship map. Write your name in the centre of a page and place the people connected to this theme around it. Use distance to show how close the relationship currently feels, not how close you believe it should be. Begin with one active step: ${focus.start}. The map is not a ranking of human worth. It is a picture of where information, support, challenge, and responsibility actually move. Add institutions, groups, or professional communities when they have a real effect on the theme. Sometimes the missing connection is not an individual but a place where the right kind of exchange can happen.`,
      `Give each relationship one plain label: energising, instructive, demanding, reciprocal, unclear, or distant. Add a second label for what the relationship needs now—contact, a question, repair, a clearer agreement, gratitude, or more space. Avoid diagnosing anyone. The purpose is to identify the kind of exchange that would make this section practical rather than leaving it as a private insight.`,
      `Create a rhythm of contact that fits the map: ${focus.routine}. A relationship grows through dependable behaviour, not only through intense conversations. Choose a frequency you can maintain. If contact is not appropriate, use the routine to review your own expectations or prepare a decision instead.`,
      `Select one conversation from the map. You could ${focus.conversation}. State the purpose at the beginning so the other person knows whether you are seeking information, support, feedback, or agreement. Listen for what they can genuinely offer rather than filling the gap with what you hoped they would say.`,
      `Protect the map with this principle: ${focus.boundary}. Some relationships improve through greater openness; others improve through clearer distance. Let behaviour over time, not guilt or fantasy, show which movement is appropriate.`,
      `After a month, redraw the map without looking at the first version. Compare them and look for this sign: ${focus.evidence}. Then answer: ${prompt} The useful outcome may be a stronger bond, a cleaner limit, a better source of guidance, or acceptance that a particular relationship cannot carry the role you assigned to it.`,
    ],
    () => [
      `This chapter needs a rhythm design, not a burst of motivation. Start by locating the natural high, low, and transition points in a normal week. Then choose to ${focus.start}. Put the action where it has the best chance of being supported by your energy and surroundings. Do not place every meaningful practice in the same idealised morning hour. A workable rhythm distributes effort.`,
      `Choose three anchors: a way to begin, a way to continue after interruption, and a way to close. An anchor is a short action that tells you what phase you are in. It might be opening a document, clearing a surface, reviewing one sentence, changing location, or writing tomorrow’s first step. Anchors reduce the cost of starting again and keep an imperfect day from becoming an abandoned week. Test each anchor separately before joining them into a routine. If an anchor adds preparation instead of reducing it, replace it with something more direct. The best cue is easy to recognise and leads immediately into the intended action.`,
      `Build the middle of the rhythm around this practice: ${focus.routine}. Decide the minimum version and the fuller version. The minimum keeps continuity when capacity is low. The fuller version is available when time and energy allow. Both count. This prevents the plan from swinging between overcommitment and complete withdrawal.`,
      `Coordinate the rhythm with anyone whose plans affect it. You may ${focus.conversation}. Ask for a practical arrangement rather than vague encouragement. Clarify times, expectations, interruptions, or shared duties. A small agreement can protect more energy than repeatedly explaining why the practice matters.`,
      `The rhythm will fail if it ignores this limit: ${focus.boundary}. Put the limit into the calendar or environment so it does not depend on remembering it at the hardest moment. Review exceptions honestly; one exception may be sensible, while a repeating exception shows the design needs adjustment.`,
      `Run the rhythm for fourteen days, then look for this evidence: ${focus.evidence}. Answer: ${prompt} Keep the anchors that helped you return. Move actions that consistently fought the shape of the day. The goal is not a flawless schedule. It is a structure that carries the chapter’s theme often enough for it to become dependable.`,
    ],
    () => [
      `Turn this chapter into a pressure drill. The drill is a short sequence prepared before stress narrows your choices. Begin by writing the situation that usually disrupts this theme, including the earliest sign that pressure is rising. Then decide that your first response will be to ${focus.start}. The first step should slow the situation enough for choice to return; it should not require you to solve everything.`,
      `Write the sequence on one card or phone note. Use no more than five steps and begin each with a verb. Include one action for the body, one for the immediate environment, one for information, and one for communication. Put major decisions at the end, after basic orientation has returned. Practise reading the sequence when calm so the words are familiar under strain. Keep the note where the difficult situation actually occurs. A plan hidden in a journal at home cannot help during a pressured meeting, journey, or evening away.`,
      `Rehearse through a manageable routine: ${focus.routine}. Use a recent but not overwhelming example. Walk through what you would notice and do at each step. If a step is vague—“calm down,” “be better,” “fix it”—replace it with an observable action. Rehearsal exposes complexity while you still have room to simplify it.`,
      `Give one trusted person a role in the drill. You can ${focus.conversation}. Tell them the exact kind of help that is useful and what is not. They might remind you of the first step, help reduce stimulation, provide information, or wait while you decide. Clear roles prevent support from becoming another source of confusion.`,
      `Pressure can make every exception feel necessary, so hold this line: ${focus.boundary}. If immediate safety is involved, seek appropriate direct help rather than relying on a reflective exercise. For ordinary pressure, the limit protects you from conclusions made while capacity is temporarily reduced.`,
      `After using or rehearsing the drill, look for this outcome: ${focus.evidence}. Answer: ${prompt} Revise the sequence based on where you stalled. Keep it short enough to remember and concrete enough to follow. Success does not mean feeling no pressure; it means recovering access to the next sound choice sooner.`,
    ],
    () => [
      `The final chapter calls for an integration review. Lay out the previous themes and ask which one has already begun to appear in daily behaviour. Start by choosing to ${focus.start}. This should gather what you have learned rather than introduce a completely new project. Integration means that insight can survive contact with schedules, relationships, limits, and changing moods.`,
      `Create three headings: established, emerging, and aspirational. Established means you can point to repeated behaviour. Emerging means there is some evidence but the pattern still needs support. Aspirational means you value the idea but cannot yet show it in practice. Place each relevant action under one heading without shame or inflation. Accurate placement helps you invest effort where it can make a difference. Beside each established item, note what keeps it stable. This prevents the review from focusing only on gaps and shows which supports can be reused elsewhere.`,
      `Support the emerging column through this routine: ${focus.routine}. Choose no more than two items. If you try to integrate everything at once, the review becomes another collection of intentions. Give each chosen item a cue, a minimum version, and a date for review. Let established practices continue without adding unnecessary tracking. Write down what could interrupt each emerging practice and how you will resume after that interruption. A return plan matters more than pretending the pattern will never be broken.`,
      `Invite a witness to the integration process. You might ${focus.conversation}. Ask what change they have actually noticed over time. Do not ask whether you have become a better person; ask about behaviour, reliability, communication, or the atmosphere around a repeated choice. Specific observations help separate durable change from a temporary self-image.`,
      `Integration also requires subtraction: ${focus.boundary}. Name one habit, demand, or story that competes with the pattern you are choosing. Decide what reduced access will look like in practice. Making room is often more effective than adding another instruction to an already crowded life.`,
      `Review again in one month and look for this evidence: ${focus.evidence}. Then answer: ${prompt} Write a short account of what became ordinary, what still needs structure, and what you are willing to release. The aim is a coherent way of living, not a perfect performance of the reading.`,
    ],
  ] as const;
  return methods[chapterIndex]();
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
      index,
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
