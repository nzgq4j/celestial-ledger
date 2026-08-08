import {
  WEEKLY_READING_CONTENT_VERSION,
  weeklyReadingContentSchema,
  type WeeklyReadingAnalysis,
  type WeeklyReadingContent,
} from "./domain";

const copy = {
  "en-GB": {
    headline: "Your week in the sky",
    method: "Seven-day tropical transit analysis",
    title: "Bottom line up front",
    opening:
      "This week is best read as a sequence rather than a single verdict. The calculated transits show changing concentrations of attention across seven days; they describe symbolic emphasis, not certain events. Use the strongest periods to choose proportionate action, and let quieter periods supply context rather than forcing every signal into a decision.",
    day: (label: string, theme: string, detail: string) =>
      `${label} centres ${theme}. ${detail} Notice where this pattern is already visible, choose one bounded response, and leave room for experience to contradict the first interpretation. Record what changes after that response, including any practical fact, conversation, or bodily cue that makes the symbolic emphasis more precise.`,
    closing:
      "Across the week, the useful discipline is to distinguish a recurring pattern from a passing peak. Repeated themes deserve patient attention; isolated intensity deserves observation before commitment. Keep your own judgement primary, verify practical facts independently, and use this brief as a structured prompt for reflection rather than a forecast of what must happen.",
    forward:
      "At the end of the week, review what actually occurred against the evidence-linked emphasis map. Carry forward only the observations that proved useful, and release interpretations that did not fit your lived experience.",
    priority: "Weekly priority",
    questions: [
      "Which repeated emphasis became clearer through direct experience?",
      "Where did a quieter day change how you understood a stronger one?",
      "What proportionate action deserves to continue into next week?",
    ],
  },
  "de-DE": {
    headline: "Ihre Woche am Himmel",
    method: "Siebentägige tropische Transitanalyse",
    title: "Das Wichtigste zuerst",
    opening:
      "Diese Woche lässt sich am besten als Abfolge und nicht als einzelnes Urteil lesen. Die berechneten Transite zeigen wechselnde Schwerpunkte über sieben Tage; sie beschreiben symbolische Betonungen, keine sicheren Ereignisse. Nutzen Sie starke Phasen für angemessenes Handeln und ruhigere Phasen als Kontext.",
    day: (label: string, theme: string, detail: string) =>
      `${label} rückt ${theme} in den Mittelpunkt. ${detail} Beobachten Sie, wo dieses Muster bereits sichtbar ist, wählen Sie eine begrenzte Reaktion und lassen Sie Raum dafür, dass die Erfahrung der ersten Deutung widerspricht.`,
    closing:
      "Die hilfreiche Aufgabe der Woche besteht darin, wiederkehrende Muster von vorübergehenden Spitzen zu unterscheiden. Wiederholte Themen verdienen geduldige Aufmerksamkeit; einzelne Intensität sollte vor einer Festlegung beobachtet werden. Behalten Sie Ihr eigenes Urteil an erster Stelle und prüfen Sie praktische Fakten unabhängig.",
    forward:
      "Vergleichen Sie am Ende der Woche das tatsächlich Erlebte mit der evidenzbasierten Tageskarte. Nehmen Sie nur hilfreiche Beobachtungen mit und lassen Sie unpassende Deutungen los.",
    priority: "Wochenfokus",
    questions: [
      "Welche wiederkehrende Betonung wurde durch direkte Erfahrung klarer?",
      "Wo veränderte ein ruhigerer Tag Ihr Verständnis eines stärkeren Tages?",
      "Welche angemessene Handlung soll in die nächste Woche mitgenommen werden?",
    ],
  },
  "es-ES": {
    headline: "Tu semana en el cielo",
    method: "Análisis tropical de tránsitos de siete días",
    title: "Lo esencial primero",
    opening:
      "Esta semana se comprende mejor como una secuencia y no como un único veredicto. Los tránsitos calculados muestran concentraciones cambiantes de atención durante siete días; describen énfasis simbólicos, no acontecimientos seguros. Usa los periodos más fuertes para actuar con mesura y los más tranquilos para obtener contexto.",
    day: (label: string, theme: string, detail: string) =>
      `${label} centra la atención en ${theme}. ${detail} Observa dónde aparece ya este patrón, elige una respuesta acotada y deja espacio para que la experiencia contradiga la primera interpretación.`,
    closing:
      "La disciplina útil de la semana consiste en distinguir un patrón recurrente de un pico pasajero. Los temas repetidos merecen atención paciente; la intensidad aislada merece observación antes del compromiso. Mantén tu propio criterio en primer plano y verifica los hechos prácticos de forma independiente.",
    forward:
      "Al terminar la semana, compara lo ocurrido con el mapa de énfasis vinculado a evidencias. Conserva solo las observaciones útiles y descarta las interpretaciones que no encajen con tu experiencia.",
    priority: "Prioridad semanal",
    questions: [
      "¿Qué énfasis recurrente se aclaró mediante la experiencia directa?",
      "¿Dónde cambió un día tranquilo tu comprensión de uno más intenso?",
      "¿Qué acción proporcionada merece continuar la próxima semana?",
    ],
  },
  "fr-FR": {
    headline: "Votre semaine dans le ciel",
    method: "Analyse tropicale des transits sur sept jours",
    title: "L’essentiel d’abord",
    opening:
      "Cette semaine se lit mieux comme une séquence que comme un verdict unique. Les transits calculés montrent des concentrations d’attention changeantes sur sept jours ; ils décrivent des accents symboliques, pas des événements certains. Utilisez les périodes fortes pour agir avec mesure et les périodes calmes pour prendre du recul.",
    day: (label: string, theme: string, detail: string) =>
      `${label} place ${theme} au centre. ${detail} Observez où ce motif est déjà visible, choisissez une réponse limitée et laissez l’expérience contredire la première interprétation si nécessaire.`,
    closing:
      "La discipline utile de la semaine consiste à distinguer un motif récurrent d’un sommet passager. Les thèmes répétés méritent une attention patiente ; une intensité isolée mérite d’être observée avant tout engagement. Gardez votre jugement au premier plan et vérifiez séparément les faits pratiques.",
    forward:
      "À la fin de la semaine, comparez ce qui s’est réellement produit à la carte des accents liée aux preuves. Ne conservez que les observations utiles et abandonnez les interprétations qui ne correspondent pas à votre expérience.",
    priority: "Priorité de la semaine",
    questions: [
      "Quel accent récurrent est devenu plus clair par l’expérience directe ?",
      "Quand une journée calme a-t-elle changé votre lecture d’une journée forte ?",
      "Quelle action mesurée mérite d’être poursuivie la semaine prochaine ?",
    ],
  },
} as const;

function completeSentenceExcerpt(value: string, maximumWords = 38) {
  const sentences = value.match(/[^.!?]+[.!?]+/g) ?? [value];
  let result = "";
  for (const sentence of sentences) {
    const candidate = `${result} ${sentence}`.trim();
    if (candidate.split(/\s+/).length > maximumWords && result) break;
    result = candidate;
  }
  return result;
}

export function buildWeeklyReadingContent(
  analysis: WeeklyReadingAnalysis,
  readingId: string,
): WeeklyReadingContent {
  const text = copy[analysis.locale];
  const dayParagraphs = analysis.dayByDay.map((day, index) => {
    const signal = analysis.days[index].signals[0];
    return text.day(
      day.label,
      day.themeLabel,
      completeSentenceExcerpt(signal?.interpretation ?? day.narrative),
    );
  });
  const overview = [text.opening, ...dayParagraphs, text.closing].join("\n\n");
  const strongestDays = [...analysis.dayByDay]
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 4);
  const evidenceIds = [
    ...new Set(analysis.dayByDay.flatMap((day) => day.evidenceIds)),
  ];
  return weeklyReadingContentSchema.parse({
    schemaVersion: WEEKLY_READING_CONTENT_VERSION,
    readingId,
    weekStartDate: analysis.weekStartDate,
    weekEndDate: analysis.weekEndDate,
    locale: analysis.locale,
    header: {
      headline: text.headline,
      dateLabel: `${new Intl.DateTimeFormat(analysis.locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${analysis.weekStartDate}T12:00:00Z`))} – ${new Intl.DateTimeFormat(analysis.locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${analysis.weekEndDate}T12:00:00Z`))}`,
      methodologyLabel: text.method,
    },
    bottomLineUpFront: {
      title: text.title,
      overview: { narrative: overview, evidenceIds },
      practicalPriorities: strongestDays.map((day, index) => ({
        title: `${text.priority} ${index + 1}: ${day.themeLabel}`,
        dayRange: day.label,
        narrative: day.narrative,
        evidenceIds: day.evidenceIds,
      })),
      forwardLook: {
        narrative: text.forward,
        evidenceIds: strongestDays.flatMap((day) => day.evidenceIds),
      },
    },
    dayByDay: analysis.dayByDay,
    sections: strongestDays.slice(0, 3).map((day, index) => ({
      id: `weekly-theme-${index + 1}`,
      title: day.themeLabel,
      narrative: day.narrative,
      practicalApplications: analysis.days.find(
        (item) => item.readingDate === day.date,
      )?.signals[0]?.practicalApplications ?? [text.forward],
      evidenceIds: day.evidenceIds,
    })),
    reflectiveQuestions: text.questions,
    limitations: analysis.limitations,
  });
}
