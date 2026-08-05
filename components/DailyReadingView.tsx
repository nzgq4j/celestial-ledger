import type {
  DailyReadingAnalysis,
  DailyReadingContent,
} from "@/lib/daily-readings/domain";
import { DailyReadingVisuals } from "@/components/DailyReadingVisuals";
import { ReadingDayArc } from "@/components/reports/ReadingDayArc";
import { buildDailyReadingDayArc } from "@/lib/daily-readings/day-arc";

export function DailyReadingView({
  content,
  analysis,
  evidence,
  profileLabel,
  sample = false,
}: {
  content: DailyReadingContent;
  analysis: DailyReadingAnalysis;
  evidence: DailyReadingAnalysis["evidence"];
  profileLabel: string;
  sample?: boolean;
}) {
  const evidenceMap = new Map(evidence.map((item) => [item.id, item]));
  const bluf = content.bottomLineUpFront;
  const dayArc = buildDailyReadingDayArc(analysis);
  return (
    <article className="daily-reading-view">
      <header className="daily-reading-view__header">
        <div>
          <p className="eyebrow">
            {sample ? "Sample daily reading" : "Your daily reading"}
          </p>
          <h1>{content.header.headline}</h1>
          <p>{content.header.dateLabel}</p>
        </div>
        <dl>
          <div>
            <dt>Birth profile</dt>
            <dd>{profileLabel}</dd>
          </div>
          <div>
            <dt>Reading time zone</dt>
            <dd>{content.header.observationTimeZoneLabel}</dd>
          </div>
          <div>
            <dt>Method</dt>
            <dd>{content.header.methodologyLabel}</dd>
          </div>
        </dl>
      </header>

      <section
        className="daily-reading-bluf"
        aria-labelledby="daily-bluf-title"
      >
        <p className="section-kicker">Daily intelligence brief</p>
        <h2 id="daily-bluf-title">{bluf.title}</h2>
        <p>{bluf.overview.narrative}</p>
        <h3>Active now</h3>
        <p>{bluf.activeNow.narrative}</p>
        <div className="daily-reading-priorities">
          {bluf.practicalPriorities.map((priority) => (
            <article key={priority.title}>
              <h3>{priority.title}</h3>
              <p>{priority.narrative}</p>
            </article>
          ))}
        </div>
        {bluf.tensionToHold && (
          <aside>
            <h3>Tension to hold</h3>
            <p>{bluf.tensionToHold.narrative}</p>
          </aside>
        )}
        <h3>Forward look</h3>
        <p>{bluf.forwardLook.narrative}</p>
      </section>

      <ReadingDayArc
        eyebrow="Morning · noon · evening"
        title="The day meridian"
        introduction="Carry the local-noon reading through the day in three deliberate movements: receive the signal, act where the pattern is strongest, and integrate what the day has revealed."
        phases={dayArc}
        note="The day meridian paces the recorded local-noon reading; the evidence references identify its source positions, transits and lunar phase."
      />

      <DailyReadingVisuals analysis={analysis} />

      <section
        className="daily-reading-themes"
        aria-labelledby="daily-themes-title"
      >
        <p className="section-kicker">Ranked convergence</p>
        <h2 id="daily-themes-title">Dominant themes</h2>
        <p>
          These values show relative interpretive weighting, not probability or
          predicted outcome.
        </p>
        <div className="daily-theme-list">
          {content.dominantThemes.map((theme) => (
            <article key={theme.id}>
              <div>
                <h3>{theme.label}</h3>
                <span>{theme.temporalState}</span>
              </div>
              <dl>
                <div>
                  <dt>Relevance</dt>
                  <dd>{Math.round(theme.relevance * 100)}%</dd>
                </div>
                <div>
                  <dt>Intensity</dt>
                  <dd>{Math.round(theme.intensity * 100)}%</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{Math.round(theme.confidence * 100)}%</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{theme.durationClass}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <div className="daily-reading-sections">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            <p>{section.narrative}</p>
            <div className="daily-reading-applications">
              <h3>Practical applications</h3>
              <ul>
                {section.practicalApplications.map((application) => (
                  <li key={application}>{application}</li>
                ))}
              </ul>
            </div>
            <details>
              <summary>Why this matters</summary>
              <ul className="daily-reading-evidence">
                {section.evidenceIds.map((evidenceId) => (
                  <li key={evidenceId}>
                    <strong>
                      {evidenceMap.get(evidenceId)?.label ?? evidenceId}
                    </strong>
                    <code>{evidenceId}</code>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        ))}
      </div>

      <section className="daily-reading-questions">
        <p className="section-kicker">Journal prompts</p>
        <h2>Reflective questions</h2>
        <ol>
          {content.reflectiveQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      <section className="daily-reading-technical">
        <details>
          <summary>Technical appendix and current limitations</summary>
          <dl>
            <div>
              <dt>Method version</dt>
              <dd>{content.technicalAppendix.methodVersion}</dd>
            </div>
            <div>
              <dt>Calculation version</dt>
              <dd>{content.technicalAppendix.calculationVersion}</dd>
            </div>
            <div>
              <dt>Ephemeris version</dt>
              <dd>{content.technicalAppendix.ephemerisVersion}</dd>
            </div>
            <div>
              <dt>Birth time</dt>
              <dd>{content.technicalAppendix.birthTimeStatus}</dd>
            </div>
          </dl>
          <ul>
            {content.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </details>
      </section>
    </article>
  );
}
