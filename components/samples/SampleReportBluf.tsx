import type { SampleReportKey } from "@/lib/sample-reports/presentation";
import { sampleReportPresentation } from "@/lib/sample-reports/presentation";

export function SampleReportBluf({ report }: { report: SampleReportKey }) {
  const brief = sampleReportPresentation[report].brief;
  return (
    <section className="sample-report-bluf" aria-labelledby="sample-bluf-title">
      <p className="section-kicker">Bottom line up front</p>
      <h2 id="sample-bluf-title">{brief.title}</h2>
      <div className="sample-report-bluf__overview">
        {brief.overview.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="sample-report-bluf__priorities">
        {brief.priorities.map((priority, index) => (
          <article key={priority.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{priority.title}</h3>
            <p>{priority.narrative}</p>
          </article>
        ))}
      </div>
      <div className="sample-report-bluf__closing">
        <article>
          <p className="section-kicker">Tension to hold</p>
          <p>{brief.tension}</p>
        </article>
        <article>
          <p className="section-kicker">Forward look</p>
          <p>{brief.forwardLook}</p>
        </article>
      </div>
    </section>
  );
}
