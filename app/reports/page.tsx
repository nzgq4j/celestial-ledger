import Link from "next/link";

export const metadata = {
  title: "Personal astrology readings — Celestial Atlas",
  description:
    "Explore private astrology readings for vocation, renewal, and the future patterns unfolding through your natal chart.",
};

const reports = [
  {
    status: "Available now",
    title: "Career and Purpose",
    price: "Complimentary during preview",
    promise:
      "Discover the work your chart is calling you toward—and the gifts, tensions, and deeper motives that shape a meaningful path.",
    reveals: [
      "Your natural modes of contribution",
      "Work environments where your gifts can thrive",
      "The tensions that sharpen vocation",
      "Questions that open the next chapter",
    ],
    sample: "/samples/career-purpose",
  },
  {
    status: "Available now",
    title: "Recovery Reflection",
    price: "Complimentary during preview",
    promise:
      "Return to the inner compass of your natal sky through a private reading of grounding, self-trust, boundaries, relationships, and renewal.",
    reveals: [
      "The rhythms that return you to centre",
      "Your patterns of trust and protection",
      "Boundaries that preserve vital energy",
      "Personal reflections for the road ahead",
    ],
    sample: "/samples/recovery-reflection",
  },
  {
    status: "In development",
    title: "Future Trends",
    price: "A twelve-month atlas",
    promise:
      "Follow the changing sky as it meets your natal chart, revealing seasons of movement, consolidation, encounter, and transformation.",
    reveals: [
      "Your most significant coming transits",
      "Dated windows of changing emphasis",
      "Longer cycles beneath immediate events",
      "A personal map for the year ahead",
    ],
    sample: null,
  },
] as const;

export default function ReportsPage() {
  return (
    <main className="page-shell report-collection">
      <section className="collection-hero">
        <div>
          <p className="eyebrow">The private reading room</p>
          <h1>Ask a deeper question of your birth chart.</h1>
        </div>
        <p>
          Your natal sky contains more than a portrait of personality. Each
          Celestial Atlas reading follows one living thread through the chart,
          gathering its symbols into guidance for the path before you.
        </p>
      </section>

      <section className="report-catalog" aria-label="Personal readings">
        {reports.map((report, index) => (
          <article className="report-edition" key={report.title}>
            <div className="report-edition__index">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="report-edition__body">
              <div className="report-edition__meta">
                <span>{report.status}</span>
                <strong>{report.price}</strong>
              </div>
              <h2>{report.title}</h2>
              <p>{report.promise}</p>
              <ul className="report-edition__reveals">
                {report.reveals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="report-edition__actions">
                {report.sample && (
                  <Link href={report.sample} className="button-quiet">
                    Read the sample
                  </Link>
                )}
                {report.status === "Available now" && (
                  <Link href="/account#reports" className="button-primary">
                    Create this report
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="privacy-note">
        <p className="eyebrow">Private by design</p>
        <h2>Your readings belong inside your atlas.</h2>
        <p>
          Each report is held privately in My Celestial Atlas for one year, and
          you can delete it sooner whenever you choose.
        </p>
        <Link href="/account" className="button-primary">
          Open My Celestial Atlas
        </Link>
      </section>
    </main>
  );
}
