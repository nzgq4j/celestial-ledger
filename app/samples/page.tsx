import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sample Astrology Reports",
  description:
    "Explore complete sample editions of Celestial Atlas natal reports and weekly readings.",
  path: "/samples",
  keywords: ["sample astrology report", "sample natal reading"],
});

export default function SamplesPage() {
  return (
    <main className="page-shell sample-library">
      <header className="sample-library__hero">
        <p className="eyebrow">Open the sample folio</p>
        <h1>See what your private atlas will reveal.</h1>
        <p>
          Each edition reflects the depth, structure, and practical guidance of
          a typical Celestial Atlas reading. Your own report will be shaped by
          the distinct patterns held in your natal chart.
        </p>
      </header>
      <section className="sample-editions">
        <article>
          <span className="sample-editions__folio">I</span>
          <div className="sample-editions__content">
            <p>One-time report</p>
            <h2>Career and Purpose</h2>
            <p className="sample-editions__description">
              A focused exploration of how motivation, natural strengths and
              working style combine into a more personally meaningful sense of
              direction. The report distinguishes enduring vocational patterns
              from passing pressure and translates them into practical choices.
            </p>
            <h3>Inside this report</h3>
            <ul>
              <li>Purpose, contribution and the work worth pursuing</li>
              <li>Strengths, leadership style and professional visibility</li>
              <li>
                Supportive environments, growth edges and sustainable reward
              </li>
              <li>Section summaries, actions and guided journaling prompts</li>
            </ul>
            <Link
              href="/samples/career-purpose"
              className="sample-editions__cta"
            >
              Read the Career and Purpose sample{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
        <article>
          <span className="sample-editions__folio">II</span>
          <div className="sample-editions__content">
            <p>One-time report</p>
            <h2>Recovery Reflection</h2>
            <p className="sample-editions__description">
              A private, compassionate reflection on the patterns that can
              support steadiness, honest self-observation and renewed choice. It
              uses the natal chart as a symbolic framework for reflection, never
              as a diagnosis or prediction.
            </p>
            <h3>Inside this report</h3>
            <ul>
              <li>Grounding practices and sustainable daily rhythms</li>
              <li>Relationships, accountability and protective boundaries</li>
              <li>Self-trust, renewal and responding to difficult patterns</li>
              <li>Practical invitations and specific writing prompts</li>
            </ul>
            <Link
              href="/samples/recovery-reflection"
              className="sample-editions__cta"
            >
              Read the Recovery Reflection sample{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
        <article>
          <span className="sample-editions__folio">III</span>
          <div className="sample-editions__content">
            <p>Subscriber edition</p>
            <h2>Weekly Reading</h2>
            <p className="sample-editions__description">
              A seven-day view of current planetary movement in relation to a
              natal chart. It separates the week into distinct phases so the
              reader can see when a theme gathers, peaks and begins to release.
            </p>
            <h3>Inside this reading</h3>
            <ul>
              <li>The week’s central theme and underlying natal context</li>
              <li>Daily shifts, turning points and changes in emphasis</li>
              <li>Practical ways to work with the week’s symbolic weather</li>
              <li>Transparent chart evidence behind each interpretation</li>
            </ul>
            <Link
              href="/samples/weekly-reading"
              className="sample-editions__cta"
            >
              Read the Weekly Reading sample <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
        <article>
          <span className="sample-editions__folio">IV</span>
          <div className="sample-editions__content">
            <p>Registered-user sample</p>
            <h2>Daily Astrological Reading</h2>
            <p className="sample-editions__description">
              A concise reading of the day’s most relevant transits, ranked by
              their relationship to the natal chart. Each section answers a
              different question so the guidance stays specific rather than
              repeating one general theme.
            </p>
            <h3>Inside this reading</h3>
            <ul>
              <li>A clear overview of the day’s strongest personal theme</li>
              <li>
                Separate sections for action, relationships and reflection
              </li>
              <li>Lunar phase context and grounded practical guidance</li>
              <li>Evidence references for every interpreted chart factor</li>
            </ul>
            <Link
              href="/samples/daily-reading"
              className="sample-editions__cta"
            >
              Read the Daily Reading sample <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
