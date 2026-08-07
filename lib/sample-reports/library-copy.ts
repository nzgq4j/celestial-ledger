import type { LocaleTag } from "@/lib/i18n/config";

type SampleEdition = {
  label: string;
  title: string;
  description: string;
  contentsHeading: string;
  contents: string[];
  action: string;
  href: string;
};

type SampleLibraryCopy = {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  introduction: string;
  editions: SampleEdition[];
};

export const sampleLibraryCopy: Record<LocaleTag, SampleLibraryCopy> = {
  "en-GB": {
    metadataTitle: "Sample Astrology Reports",
    metadataDescription:
      "Explore complete sample editions of Celestial Atlas natal reports and weekly readings.",
    eyebrow: "Open the sample folio",
    title: "See what your private atlas will reveal.",
    introduction:
      "Each edition reflects the depth, structure and practical guidance of a typical Celestial Atlas reading. Your own report will be shaped by the distinct patterns held in your natal chart.",
    editions: [
      {
        label: "One-time report",
        title: "Career and Purpose",
        description:
          "A focused exploration of how motivation, natural strengths and working style combine into a more personally meaningful sense of direction. The report distinguishes enduring vocational patterns from passing pressure and translates them into practical choices.",
        contentsHeading: "Inside this report",
        contents: [
          "Purpose, contribution and the work worth pursuing",
          "Strengths, leadership style and professional visibility",
          "Supportive environments, growth edges and sustainable reward",
          "Section summaries, actions and guided journaling prompts",
        ],
        action: "Read the Career and Purpose sample",
        href: "/samples/career-purpose",
      },
      {
        label: "One-time report",
        title: "Recovery Reflection",
        description:
          "A private, compassionate reflection on the patterns that can support steadiness, honest self-observation and renewed choice. It uses the natal chart as a symbolic framework for reflection, never as a diagnosis or prediction.",
        contentsHeading: "Inside this report",
        contents: [
          "Grounding practices and sustainable daily rhythms",
          "Relationships, accountability and protective boundaries",
          "Self-trust, renewal and responding to difficult patterns",
          "Practical invitations and specific writing prompts",
        ],
        action: "Read the Recovery Reflection sample",
        href: "/samples/recovery-reflection",
      },
      {
        label: "Subscriber edition",
        title: "Weekly Reading",
        description:
          "A seven-day view of current planetary movement in relation to a natal chart. It separates the week into distinct phases so the reader can see when a theme gathers, peaks and begins to release.",
        contentsHeading: "Inside this reading",
        contents: [
          "The week's central theme and underlying natal context",
          "Daily shifts, turning points and changes in emphasis",
          "Practical ways to work with the week's symbolic weather",
          "Transparent chart evidence behind each interpretation",
        ],
        action: "Read the Weekly Reading sample",
        href: "/samples/weekly-reading",
      },
      {
        label: "Registered-user sample",
        title: "Daily Astrological Reading",
        description:
          "A concise reading of the day's most relevant transits, ranked by their relationship to the natal chart. Each section answers a different question so the guidance stays specific rather than repeating one general theme.",
        contentsHeading: "Inside this reading",
        contents: [
          "A clear overview of the day's strongest personal theme",
          "Separate sections for action, relationships and reflection",
          "Lunar phase context and grounded practical guidance",
          "Evidence references for every interpreted chart factor",
        ],
        action: "Read the Daily Reading sample",
        href: "/samples/daily-reading",
      },
    ],
  },
  "es-ES": {
    metadataTitle: "Informes astrológicos de ejemplo",
    metadataDescription:
      "Explora ediciones completas de informes natales y lecturas semanales de Celestial Atlas.",
    eyebrow: "Abre el folio de ejemplos",
    title: "Descubre lo que revelará tu atlas privado.",
    introduction:
      "Cada edición refleja la profundidad, la estructura y la orientación práctica de una lectura habitual de Celestial Atlas. Tu propio informe estará determinado por los patrones particulares de tu carta natal.",
    editions: [
      {
        label: "Informe único",
        title: "Carrera y propósito",
        description:
          "Una exploración centrada en cómo la motivación, las fortalezas naturales y el estilo de trabajo se combinan para dar una dirección más significativa. El informe distingue los patrones vocacionales duraderos de las presiones pasajeras y los convierte en decisiones prácticas.",
        contentsHeading: "Qué contiene el informe",
        contents: [
          "Propósito, contribución y el trabajo que merece la pena",
          "Fortalezas, estilo de liderazgo y visibilidad profesional",
          "Entornos favorables, crecimiento y recompensa sostenible",
          "Resúmenes, acciones y preguntas guiadas para el diario",
        ],
        action: "Leer el ejemplo de Carrera y propósito",
        href: "/samples/career-purpose",
      },
      {
        label: "Informe único",
        title: "Reflexión sobre la recuperación",
        description:
          "Una reflexión privada y compasiva sobre los patrones que pueden favorecer la estabilidad, la observación honesta y una elección renovada. Usa la carta natal como marco simbólico de reflexión, nunca como diagnóstico o predicción.",
        contentsHeading: "Qué contiene el informe",
        contents: [
          "Prácticas de arraigo y ritmos diarios sostenibles",
          "Relaciones, responsabilidad y límites protectores",
          "Confianza personal, renovación y respuesta a patrones difíciles",
          "Invitaciones prácticas y propuestas concretas de escritura",
        ],
        action: "Leer el ejemplo de Reflexión sobre la recuperación",
        href: "/samples/recovery-reflection",
      },
      {
        label: "Edición para suscriptores",
        title: "Lectura semanal",
        description:
          "Una visión de siete días del movimiento planetario actual en relación con la carta natal. Divide la semana en fases para mostrar cuándo un tema aparece, alcanza su punto máximo y comienza a liberarse.",
        contentsHeading: "Qué contiene la lectura",
        contents: [
          "Tema central de la semana y contexto natal subyacente",
          "Cambios diarios, puntos de giro y variaciones de énfasis",
          "Formas prácticas de trabajar con el clima simbólico semanal",
          "Evidencia transparente de la carta para cada interpretación",
        ],
        action: "Leer el ejemplo de Lectura semanal",
        href: "/samples/weekly-reading",
      },
      {
        label: "Ejemplo para usuarios registrados",
        title: "Lectura astrológica diaria",
        description:
          "Una lectura concisa de los tránsitos más relevantes del día, ordenados por su relación con la carta natal. Cada sección responde a una pregunta distinta para mantener la orientación específica y evitar repeticiones.",
        contentsHeading: "Qué contiene la lectura",
        contents: [
          "Resumen claro del tema personal más fuerte del día",
          "Secciones separadas para acción, relaciones y reflexión",
          "Contexto de la fase lunar y orientación práctica",
          "Referencias de evidencia para cada factor interpretado",
        ],
        action: "Leer el ejemplo de Lectura diaria",
        href: "/samples/daily-reading",
      },
    ],
  },
  "fr-FR": {
    metadataTitle: "Exemples de rapports astrologiques",
    metadataDescription:
      "Découvrez des exemples complets de rapports natals et de lectures hebdomadaires Celestial Atlas.",
    eyebrow: "Ouvrez le folio d'exemples",
    title: "Découvrez ce que révélera votre atlas privé.",
    introduction:
      "Chaque édition reflète la profondeur, la structure et les conseils pratiques d'une lecture Celestial Atlas typique. Votre propre rapport sera façonné par les motifs distinctifs de votre thème natal.",
    editions: [
      {
        label: "Rapport ponctuel",
        title: "Carrière et vocation",
        description:
          "Une exploration ciblée de la manière dont motivation, forces naturelles et style de travail composent une direction plus personnelle. Le rapport distingue les tendances vocationnelles durables des pressions passagères et les traduit en choix concrets.",
        contentsHeading: "Dans ce rapport",
        contents: [
          "Vocation, contribution et travail qui mérite d'être poursuivi",
          "Forces, style de leadership et visibilité professionnelle",
          "Environnements favorables, croissance et récompense durable",
          "Synthèses, actions et questions guidées pour le journal",
        ],
        action: "Lire l'exemple Carrière et vocation",
        href: "/samples/career-purpose",
      },
      {
        label: "Rapport ponctuel",
        title: "Réflexion sur le rétablissement",
        description:
          "Une réflexion privée et bienveillante sur les motifs qui peuvent soutenir la stabilité, l'observation honnête de soi et un choix renouvelé. Le thème natal sert de cadre symbolique de réflexion, jamais de diagnostic ou de prédiction.",
        contentsHeading: "Dans ce rapport",
        contents: [
          "Pratiques d'ancrage et rythmes quotidiens durables",
          "Relations, responsabilité et limites protectrices",
          "Confiance en soi, renouveau et réponse aux schémas difficiles",
          "Invitations pratiques et propositions d'écriture précises",
        ],
        action: "Lire l'exemple Réflexion sur le rétablissement",
        href: "/samples/recovery-reflection",
      },
      {
        label: "Édition abonné",
        title: "Lecture hebdomadaire",
        description:
          "Une vue sur sept jours des mouvements planétaires actuels en relation avec le thème natal. La semaine est divisée en phases pour montrer quand un thème se forme, atteint son sommet puis commence à se relâcher.",
        contentsHeading: "Dans cette lecture",
        contents: [
          "Thème central de la semaine et contexte natal sous-jacent",
          "Évolutions quotidiennes, tournants et changements d'accent",
          "Façons concrètes d'aborder le climat symbolique de la semaine",
          "Éléments du thème clairement associés à chaque interprétation",
        ],
        action: "Lire l'exemple de Lecture hebdomadaire",
        href: "/samples/weekly-reading",
      },
      {
        label: "Exemple pour membre inscrit",
        title: "Lecture astrologique quotidienne",
        description:
          "Une lecture concise des transits les plus pertinents du jour, classés selon leur relation au thème natal. Chaque section répond à une question différente afin de rester précise sans répéter un thème général.",
        contentsHeading: "Dans cette lecture",
        contents: [
          "Vue claire du thème personnel dominant de la journée",
          "Sections distinctes pour l'action, les relations et la réflexion",
          "Contexte de la phase lunaire et conseils pratiques",
          "Références aux éléments du thème pour chaque interprétation",
        ],
        action: "Lire l'exemple de Lecture quotidienne",
        href: "/samples/daily-reading",
      },
    ],
  },
  "de-DE": {
    metadataTitle: "Beispiele astrologischer Berichte",
    metadataDescription:
      "Entdecken Sie vollständige Beispiele für Geburtshoroskop-Berichte und Wochenreadings von Celestial Atlas.",
    eyebrow: "Öffnen Sie das Beispiel-Folio",
    title: "Entdecken Sie, was Ihr privater Atlas offenbart.",
    introduction:
      "Jede Ausgabe zeigt die Tiefe, Struktur und praktische Orientierung eines typischen Celestial-Atlas-Readings. Ihr eigener Bericht wird von den besonderen Mustern Ihres Geburtshoroskops geprägt.",
    editions: [
      {
        label: "Einmaliger Bericht",
        title: "Beruf und Bestimmung",
        description:
          "Eine gezielte Betrachtung, wie Motivation, natürliche Stärken und Arbeitsstil zu einer persönlich sinnvollen Richtung zusammenfinden. Der Bericht trennt beständige berufliche Muster von vorübergehendem Druck und übersetzt sie in praktische Entscheidungen.",
        contentsHeading: "In diesem Bericht",
        contents: [
          "Bestimmung, Beitrag und lohnenswerte Arbeit",
          "Stärken, Führungsstil und berufliche Sichtbarkeit",
          "Förderliche Umfelder, Entwicklung und nachhaltige Anerkennung",
          "Zusammenfassungen, Handlungen und geführte Schreibimpulse",
        ],
        action: "Beispiel Beruf und Bestimmung lesen",
        href: "/samples/career-purpose",
      },
      {
        label: "Einmaliger Bericht",
        title: "Reflexion zur Erholung",
        description:
          "Eine private, mitfühlende Reflexion über Muster, die Stabilität, ehrliche Selbstbeobachtung und neue Wahlmöglichkeiten unterstützen können. Das Geburtshoroskop dient als symbolischer Reflexionsrahmen, niemals als Diagnose oder Vorhersage.",
        contentsHeading: "In diesem Bericht",
        contents: [
          "Erdende Praktiken und tragfähige Tagesrhythmen",
          "Beziehungen, Verantwortung und schützende Grenzen",
          "Selbstvertrauen, Erneuerung und Umgang mit schwierigen Mustern",
          "Praktische Einladungen und konkrete Schreibimpulse",
        ],
        action: "Beispiel Reflexion zur Erholung lesen",
        href: "/samples/recovery-reflection",
      },
      {
        label: "Ausgabe für Abonnenten",
        title: "Wochenreading",
        description:
          "Ein siebentägiger Blick auf aktuelle planetare Bewegungen im Verhältnis zum Geburtshoroskop. Die Woche wird in Phasen gegliedert, damit erkennbar wird, wann ein Thema entsteht, seinen Höhepunkt erreicht und nachlässt.",
        contentsHeading: "In diesem Reading",
        contents: [
          "Zentrales Wochenthema und zugrunde liegender Geburtskontext",
          "Tägliche Veränderungen, Wendepunkte und neue Schwerpunkte",
          "Praktische Wege im Umgang mit dem symbolischen Wochenklima",
          "Transparente Horoskop-Belege für jede Interpretation",
        ],
        action: "Beispiel des Wochenreadings lesen",
        href: "/samples/weekly-reading",
      },
      {
        label: "Beispiel für registrierte Nutzer",
        title: "Tägliches astrologisches Reading",
        description:
          "Eine prägnante Deutung der wichtigsten Transite des Tages, geordnet nach ihrer Beziehung zum Geburtshoroskop. Jeder Abschnitt beantwortet eine andere Frage, damit die Hinweise konkret bleiben und sich nicht wiederholen.",
        contentsHeading: "In diesem Reading",
        contents: [
          "Klarer Überblick über das stärkste persönliche Tagesthema",
          "Getrennte Abschnitte für Handeln, Beziehungen und Reflexion",
          "Mondphasenkontext und geerdete praktische Orientierung",
          "Belegverweise für jeden interpretierten Horoskopfaktor",
        ],
        action: "Beispiel des täglichen Readings lesen",
        href: "/samples/daily-reading",
      },
    ],
  },
};
