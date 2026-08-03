import Link from "next/link";

export const metadata = {
  title: "Personal reports — Celestial Atlas",
  description:
    "Private, evidence-linked astrological reports built from a server-authoritative natal chart.",
};

const reports = [
  {
    status: "Available",
    title: "Career and Purpose",
    price: "$15",
    copy: "A structured reflection on motivation, contribution, values, work environments and the tensions that shape meaningful direction.",
    evidence: "Natal placements · houses · major aspects",
  },
  {
    status: "Available",
    title: "Recovery Reflection",
    price: "$5",
    copy: "A private natal reading for grounding, self-trust, relationships, daily rhythms, boundaries and renewal. Choose the themes calling for your attention now.",
    evidence: "Your natal chart · chosen themes · reflective questions",
  },
  {
    status: "In development",
    title: "Future Trends",
    price: "12 months",
    copy: "A dated transit atlas showing symbolic periods across the year, with every timing window linked to calculated evidence.",
    evidence: "Natal chart · transits · applying and separating windows",
  },
] as const;

export default function ReportsPage() {
  return (
    <main className="page-shell">
      <section className="collection-hero">
        <div>
          <p className="eyebrow">The report collection</p>
          <h1>Interpretation you can trace back to the chart.</h1>
        </div>
        <p>
          Each report begins with a new server calculation. Narrative and
          visuals point to stable evidence, while your report remains private
          and non-indexable.
        </p>
      </section>
      <section className="report-catalog" aria-label="Available reports">
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
              <p>{report.copy}</p>
              <small>{report.evidence}</small>
            </div>
          </article>
        ))}
      </section>
      <section className="privacy-note">
        <p className="eyebrow">A private object</p>
        <h2>Purchased reports stay in your library for one year.</h2>
        <p>
          You can delete a report or birth profile sooner. Report pages use
          owner authorization, private no-store responses and no search
          indexing.
        </p>
        <Link href="/auth/login" className="button-primary">
          Open My Celestial Atlas
        </Link>
      </section>
    </main>
  );
}
