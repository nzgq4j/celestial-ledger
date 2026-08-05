import Link from "next/link";
import { sampleChart, sampleIdentity } from "@/lib/samples";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sample Astrology Reports",
  description:
    "Explore complete sample editions of Celestial Atlas natal reports and weekly readings.",
  path: "/samples",
  keywords: ["sample astrology report", "sample natal reading"],
});

export default async function SamplesPage() {
  const chart = await sampleChart();
  const sun = chart.placements.find((item) => item.name === "Sun");
  const moon = chart.placements.find((item) => item.name === "Moon");
  return (
    <main className="page-shell sample-library">
      <header className="sample-library__hero">
        <p className="eyebrow">Open the sample folio</p>
        <h1>See what your private atlas will reveal.</h1>
        <p>
          These complete sample editions are drawn from one calculated natal
          sky: {sampleIdentity.born}, {sampleIdentity.place}. The chart begins
          with a {sun?.sign} Sun and {moon?.sign} Moon.
        </p>
      </header>
      <section className="sample-editions">
        <Link href="/samples/career-purpose">
          <span>I</span>
          <div>
            <p>One-time report</p>
            <h2>Career and Purpose</h2>
            <small>
              Motivation, contribution, work environments and vocation.
            </small>
          </div>
        </Link>
        <Link href="/samples/recovery-reflection">
          <span>II</span>
          <div>
            <p>One-time report</p>
            <h2>Recovery Reflection</h2>
            <small>Grounding, self-trust, boundaries and renewal.</small>
          </div>
        </Link>
        <Link href="/samples/weekly-reading">
          <span>III</span>
          <div>
            <p>Subscriber edition</p>
            <h2>Weekly Reading</h2>
            <small>Seven days of transits meeting the natal chart.</small>
          </div>
        </Link>
        <Link href="/samples/daily-reading">
          <span>IV</span>
          <div>
            <p>Registered-user sample</p>
            <h2>Daily Astrological Reading</h2>
            <small>
              Current transits, lunar phase, ranked themes, practical guidance
              and evidence.
            </small>
          </div>
        </Link>
      </section>
    </main>
  );
}
