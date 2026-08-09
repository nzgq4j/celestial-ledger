import {
  WEEKLY_READING_LEGACY_CONTENT_VERSION,
  type WeeklyReadingAnalysis,
  type WeeklyReadingContent,
} from "@/lib/weekly-readings/domain";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";

const viewCopy = {
  "en-GB": {
    private: "Private weekly reading",
    profile: "Birth profile",
    zone: "Reading time zone",
    method: "Method",
    brief: "Your orientation",
    forward: "What to carry forward",
    rhythm: "The rhythm of your next seven days",
    rhythmDescription:
      "This plot shows how strongly the week’s leading themes are emphasised from one day to the next. It is a relative reflection map, not a prediction of events.",
    plot: "Weekly emphasis plot",
    timeline: "Seven-day timeline",
    dayGuide: "Your day-by-day guide",
    evidence: "Astrological basis",
    guidance: "Try this",
    watchFor: "Watch for",
    practice: "Bring this into your week",
    journal: "Make it your own",
    questions: "Questions for reflection",
  },
  "de-DE": {
    private: "Private Wochenanalyse",
    profile: "Geburtsprofil",
    zone: "Zeitzone der Analyse",
    method: "Methode",
    brief: "Ihre Orientierung",
    forward: "Was Sie mitnehmen können",
    rhythm: "Der Rhythmus Ihrer nächsten sieben Tage",
    rhythmDescription:
      "Die Kurve zeigt die relative Stärke der Wochenthemen von Tag zu Tag. Sie ist eine Reflexionskarte, keine Vorhersage.",
    plot: "Wochenverlauf",
    timeline: "Siebentägige Zeitleiste",
    dayGuide: "Ihr Leitfaden für jeden Tag",
    evidence: "Astrologische Grundlage",
    guidance: "Das können Sie versuchen",
    watchFor: "Achten Sie auf",
    practice: "In die Woche integrieren",
    journal: "Machen Sie es zu Ihrem eigenen",
    questions: "Fragen zur Reflexion",
  },
  "es-ES": {
    private: "Lectura semanal privada",
    profile: "Perfil natal",
    zone: "Zona horaria de la lectura",
    method: "Método",
    brief: "Tu orientación",
    forward: "Qué llevar contigo",
    rhythm: "El ritmo de tus próximos siete días",
    rhythmDescription:
      "La curva muestra la intensidad relativa de los temas de la semana día a día. Es un mapa de reflexión, no una predicción.",
    plot: "Gráfico de énfasis semanal",
    timeline: "Cronología de siete días",
    dayGuide: "Tu guía día a día",
    evidence: "Base astrológica",
    guidance: "Prueba esto",
    watchFor: "Presta atención a",
    practice: "Llévalo a tu semana",
    journal: "Hazlo tuyo",
    questions: "Preguntas de reflexión",
  },
  "fr-FR": {
    private: "Lecture hebdomadaire privée",
    profile: "Profil natal",
    zone: "Fuseau horaire de la lecture",
    method: "Méthode",
    brief: "Votre orientation",
    forward: "Ce qu’il faut retenir",
    rhythm: "Le rythme de vos sept prochains jours",
    rhythmDescription:
      "La courbe montre l’intensité relative des thèmes de la semaine, jour après jour. C’est une carte de réflexion, pas une prédiction.",
    plot: "Courbe des accents de la semaine",
    timeline: "Chronologie sur sept jours",
    dayGuide: "Votre guide jour après jour",
    evidence: "Base astrologique",
    guidance: "À essayer",
    watchFor: "Soyez attentif à",
    practice: "Intégrer cela à votre semaine",
    journal: "Appropriez-vous la lecture",
    questions: "Questions de réflexion",
  },
} as const;

function WeeklyRhythmPlot({
  days,
  title,
  locale,
}: {
  days: WeeklyReadingContent["dayByDay"];
  title: string;
  locale: WeeklyReadingContent["locale"];
}) {
  const width = 720;
  const height = 250;
  const left = 42;
  const right = 22;
  const top = 22;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = days.map((day, index) => ({
    x: left + (plotWidth * index) / (days.length - 1),
    y: top + plotHeight * (1 - day.strength),
    day,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${points[0].x} ${top + plotHeight} L ${points
    .map((point) => `${point.x} ${point.y}`)
    .join(" L ")} L ${points.at(-1)!.x} ${top + plotHeight} Z`;
  return (
    <figure className="weekly-rhythm-plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <defs>
          <linearGradient id="weekly-rhythm-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.34" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((level) => {
          const y = top + plotHeight * (1 - level);
          return (
            <line
              key={level}
              className="weekly-rhythm-plot__grid"
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
            />
          );
        })}
        <path className="weekly-rhythm-plot__area" d={area} />
        <polyline className="weekly-rhythm-plot__line" points={line} />
        {points.map(({ x, y, day }) => (
          <g key={day.date}>
            <circle className="weekly-rhythm-plot__point" cx={x} cy={y} r="5" />
            <text className="weekly-rhythm-plot__day" x={x} y={height - 29}>
              {new Intl.DateTimeFormat(locale, {
                weekday: "short",
                timeZone: "UTC",
              }).format(new Date(`${day.date}T12:00:00Z`))}
            </text>
            <text className="weekly-rhythm-plot__value" x={x} y={height - 12}>
              {Math.round(day.strength * 100)}
            </text>
            <title>{`${day.label}: ${day.themeLabel}, ${Math.round(day.strength * 100)}% relative emphasis`}</title>
          </g>
        ))}
      </svg>
      <figcaption>
        0–100 shows relative emphasis within this reading only.
      </figcaption>
    </figure>
  );
}

export function WeeklyReadingView({
  content,
  analysis,
  profileLabel,
}: {
  content: WeeklyReadingContent;
  analysis: WeeklyReadingAnalysis;
  profileLabel: string;
}) {
  const displayedContent =
    content.schemaVersion === WEEKLY_READING_LEGACY_CONTENT_VERSION
      ? buildWeeklyReadingContent(analysis, content.readingId)
      : content;
  const text = viewCopy[displayedContent.locale];
  const evidenceMap = new Map(
    analysis.evidence.map((item) => [item.id, item.label]),
  );
  const days = displayedContent.dayByDay.map((day) => {
    const analysisDay = analysis.days.find(
      (item) => item.readingDate === day.date,
    );
    const signal = analysisDay?.signals.find(
      (item) => item.theme === day.themeLabel,
    );
    return {
      ...day,
      narrative: day.narrative,
      guidance: day.guidance ??
        signal?.practicalApplications.slice(0, 3) ?? [
          "Notice where this theme is already present before deciding what it means.",
          "Choose one proportionate response that you can review later.",
        ],
      watchFor:
        day.watchFor ??
        signal?.watchFor[0] ??
        "Treating a symbolic emphasis as a fixed outcome.",
    };
  });
  return (
    <article className="daily-reading-view weekly-reading-view">
      <header className="daily-reading-view__header">
        <div>
          <p className="eyebrow">{text.private}</p>
          <h1>{displayedContent.header.headline}</h1>
          <p>{displayedContent.header.dateLabel}</p>
        </div>
        <dl>
          <div>
            <dt>{text.profile}</dt>
            <dd>{profileLabel}</dd>
          </div>
          <div>
            <dt>{text.zone}</dt>
            <dd>{analysis.observationTimeZone}</dd>
          </div>
          <div>
            <dt>{text.method}</dt>
            <dd>{displayedContent.header.methodologyLabel}</dd>
          </div>
        </dl>
      </header>

      <section
        className="daily-reading-bluf"
        aria-labelledby="weekly-bluf-title"
      >
        <p className="section-kicker">{text.brief}</p>
        <h2 id="weekly-bluf-title">
          {displayedContent.bottomLineUpFront.title}
        </h2>
        {displayedContent.bottomLineUpFront.overview.narrative
          .split("\n\n")
          .map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        <div className="daily-reading-priorities">
          {displayedContent.bottomLineUpFront.practicalPriorities.map(
            (priority) => (
              <article key={priority.title}>
                <span>{priority.dayRange}</span>
                <h3>{priority.title}</h3>
                <p>{priority.narrative}</p>
              </article>
            ),
          )}
        </div>
        <h3>{text.forward}</h3>
        <p>{displayedContent.bottomLineUpFront.forwardLook.narrative}</p>
      </section>

      <section
        className="weekly-reading-visuals"
        aria-labelledby="weekly-rhythm-title"
      >
        <div className="weekly-reading-visuals__heading">
          <div>
            <p className="section-kicker">{text.plot}</p>
            <h2 id="weekly-rhythm-title">{text.rhythm}</h2>
          </div>
          <p>{text.rhythmDescription}</p>
        </div>
        <div className="weekly-reading-visuals__grid">
          <WeeklyRhythmPlot
            days={days}
            title={text.plot}
            locale={displayedContent.locale}
          />
          <div className="weekly-timeline">
            <h3>{text.timeline}</h3>
            <ol>
              {days.map((day) => (
                <li key={day.date}>
                  <a href={`#weekly-day-${day.date}`}>
                    <time dateTime={day.date}>{day.label}</time>
                    <span>{day.themeLabel}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        className="weekly-day-guide"
        aria-labelledby="weekly-day-guide-title"
      >
        <p className="section-kicker">{text.timeline}</p>
        <h2 id="weekly-day-guide-title">{text.dayGuide}</h2>
        <div className="weekly-day-guide__list">
          {days.map((day, index) => (
            <article id={`weekly-day-${day.date}`} key={day.date}>
              <div className="weekly-day-guide__marker" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i style={{ height: `${Math.max(18, day.strength * 100)}%` }} />
              </div>
              <div className="weekly-day-guide__content">
                <time dateTime={day.date}>{day.label}</time>
                <h3>{day.themeLabel}</h3>
                <p className="weekly-day-guide__interpretation">
                  {day.narrative}
                </p>
                <div className="weekly-day-guide__practice">
                  <h4>{text.guidance}</h4>
                  <ul>
                    {day.guidance.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="weekly-day-guide__watch">
                  <strong>{text.watchFor}:</strong> {day.watchFor}
                </p>
                <details>
                  <summary>{text.evidence}</summary>
                  <ul>
                    {day.evidenceIds.map((id) => (
                      <li key={id}>
                        {evidenceMap.get(id) ?? "Supporting chart factor"}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="daily-reading-sections weekly-reading-themes">
        {displayedContent.sections.map((section) => (
          <section key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.narrative}</p>
            <div className="daily-reading-applications">
              <h3>{text.practice}</h3>
              <ul>
                {section.practicalApplications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section className="daily-reading-questions">
        <p className="section-kicker">{text.journal}</p>
        <h2>{text.questions}</h2>
        <ol>
          {displayedContent.reflectiveQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
