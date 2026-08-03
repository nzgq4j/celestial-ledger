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
      <article>
        {edition.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </article>
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
