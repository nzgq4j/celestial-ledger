import type {
  WeeklyReadingAnalysis,
  WeeklyReadingContent,
} from "@/lib/weekly-readings/domain";

const viewCopy = {
  "en-GB": {
    private: "Private weekly reading",
    profile: "Birth profile",
    zone: "Reading time zone",
    method: "Method",
    brief: "Weekly intelligence brief",
    forward: "Forward look",
    sequence: "Seven-day sequence",
    map: "Day-by-day emphasis map",
    evidence: "Evidence",
    practice: "Bring this into your week",
    journal: "Journal prompts",
    questions: "Reflective questions",
  },
  "de-DE": {
    private: "Private Wochenanalyse",
    profile: "Geburtsprofil",
    zone: "Zeitzone der Analyse",
    method: "Methode",
    brief: "Kompakter Wochenüberblick",
    forward: "Ausblick",
    sequence: "Siebentägige Abfolge",
    map: "Tägliche Schwerpunktkarte",
    evidence: "Evidenz",
    practice: "In die Woche integrieren",
    journal: "Schreibimpulse",
    questions: "Fragen zur Reflexion",
  },
  "es-ES": {
    private: "Lectura semanal privada",
    profile: "Perfil natal",
    zone: "Zona horaria de la lectura",
    method: "Método",
    brief: "Resumen esencial de la semana",
    forward: "Mirada hacia delante",
    sequence: "Secuencia de siete días",
    map: "Mapa diario de énfasis",
    evidence: "Evidencia",
    practice: "Llévalo a tu semana",
    journal: "Propuestas para escribir",
    questions: "Preguntas de reflexión",
  },
  "fr-FR": {
    private: "Lecture hebdomadaire privée",
    profile: "Profil natal",
    zone: "Fuseau horaire de la lecture",
    method: "Méthode",
    brief: "Synthèse essentielle de la semaine",
    forward: "Perspective",
    sequence: "Séquence sur sept jours",
    map: "Carte des accents quotidiens",
    evidence: "Éléments probants",
    practice: "Intégrer cela à votre semaine",
    journal: "Invitations à écrire",
    questions: "Questions de réflexion",
  },
} as const;

export function WeeklyReadingView({
  content,
  analysis,
  profileLabel,
}: {
  content: WeeklyReadingContent;
  analysis: WeeklyReadingAnalysis;
  profileLabel: string;
}) {
  const text = viewCopy[content.locale];
  const evidenceMap = new Map(
    analysis.evidence.map((item) => [item.id, item.label]),
  );
  return (
    <article className="daily-reading-view weekly-reading-view">
      <header className="daily-reading-view__header">
        <div>
          <p className="eyebrow">{text.private}</p>
          <h1>{content.header.headline}</h1>
          <p>{content.header.dateLabel}</p>
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
            <dd>{content.header.methodologyLabel}</dd>
          </div>
        </dl>
      </header>
      <section
        className="daily-reading-bluf"
        aria-labelledby="weekly-bluf-title"
      >
        <p className="section-kicker">{text.brief}</p>
        <h2 id="weekly-bluf-title">{content.bottomLineUpFront.title}</h2>
        {content.bottomLineUpFront.overview.narrative
          .split("\n\n")
          .map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        <div className="daily-reading-priorities">
          {content.bottomLineUpFront.practicalPriorities.map((priority) => (
            <article key={priority.title}>
              <span>{priority.dayRange}</span>
              <h3>{priority.title}</h3>
              <p>{priority.narrative}</p>
            </article>
          ))}
        </div>
        <h3>{text.forward}</h3>
        <p>{content.bottomLineUpFront.forwardLook.narrative}</p>
      </section>
      <section className="weekly-emphasis-map">
        <p className="section-kicker">{text.sequence}</p>
        <h2>{text.map}</h2>
        <div>
          {content.dayByDay.map((day) => (
            <article key={day.date}>
              <time dateTime={day.date}>{day.label}</time>
              <h3>{day.themeLabel}</h3>
              <meter min={0} max={1} value={day.strength}>
                {day.strength}
              </meter>
              <p>{day.narrative}</p>
              <details>
                <summary>{text.evidence}</summary>
                <ul>
                  {day.evidenceIds.map((id) => (
                    <li key={id}>
                      <strong>{evidenceMap.get(id) ?? id}</strong>
                      <code>{id}</code>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      </section>
      <div className="daily-reading-sections">
        {content.sections.map((section) => (
          <section key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.narrative}</p>
            <h3>{text.practice}</h3>
            <ul>
              {section.practicalApplications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="daily-reading-questions">
        <p className="section-kicker">{text.journal}</p>
        <h2>{text.questions}</h2>
        <ol>
          {content.reflectiveQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
