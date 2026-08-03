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

export function generateStaticParams() {
  return Object.keys(editions).map((report) => ({ report }));
}

export default async function SampleReportPage({
  params,
}: {
  params: Promise<{ report: string }>;
}) {
  const { report } = await params;
  const edition = editions[report as keyof typeof editions];
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
  const companions =
    chapterCompanions[report as keyof typeof chapterCompanions];
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
