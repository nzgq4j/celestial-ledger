export type ReadingDayPhase = {
  period: "morning" | "noon" | "evening";
  label: string;
  title: string;
  guidance: string;
  level: 1 | 2 | 3;
  evidenceIds?: string[];
};

export function ReadingDayArc({
  eyebrow = "Morning · noon · evening",
  title = "The day meridian",
  introduction,
  phases,
  note,
}: {
  eyebrow?: string;
  title?: string;
  introduction: string;
  phases: readonly ReadingDayPhase[];
  note?: string;
}) {
  return (
    <section
      className="reading-day-arc"
      aria-labelledby="reading-day-arc-title"
    >
      <header>
        <div>
          <p className="section-kicker">{eyebrow}</p>
          <h2 id="reading-day-arc-title">{title}</h2>
        </div>
        <p>{introduction}</p>
      </header>
      <div className="reading-day-arc__horizon" aria-hidden="true">
        <span />
      </div>
      <ol>
        {phases.map((phase) => (
          <li key={phase.period} data-level={phase.level}>
            <span className="reading-day-arc__marker" aria-hidden="true" />
            <p className="reading-day-arc__period">{phase.label}</p>
            <h3>{phase.title}</h3>
            <p>{phase.guidance}</p>
            {phase.evidenceIds?.length ? (
              <p className="reading-day-arc__evidence">
                Evidence {phase.evidenceIds.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      {note ? <p className="reading-day-arc__note">{note}</p> : null}
    </section>
  );
}
