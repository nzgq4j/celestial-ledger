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
            <section key={title} id={`chapter-${index + 1}`}>
              <span>Chapter {String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{body}</p>
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
