import type {
  TarotLocale,
  TarotReading,
  TarotReadingId,
} from "@/lib/tarot/types";

type LocalizedReading = Pick<TarotReading, "name" | "positions" | "blurb">;

const READING_TRANSLATIONS: Record<
  TarotLocale,
  Record<TarotReadingId, LocalizedReading>
> = {
  "en-GB": {
    daily: {
      name: "Daily Draw",
      positions: ["Today"],
      blurb: "One card. One clear reflection to carry into your day.",
    },
    ppf: {
      name: "Past, Present & Future",
      positions: ["Past", "Present", "Possible Future"],
      blurb:
        "A quick reflection on what shaped this moment and the direction you may consider.",
    },
    love5: {
      name: "Love Reading",
      positions: [
        "You",
        "Your View of Them",
        "The Connection as You See It",
        "Challenge",
        "Potential",
      ],
      blurb:
        "A focused look at your experience of connection, needs, and choices.",
    },
    celtic: {
      name: "Celtic Cross",
      positions: [
        "Present",
        "Challenge",
        "Foundation",
        "Recent Past",
        "Possible Direction",
        "Near-Term Focus",
        "Your Approach",
        "External Influences",
        "Hopes & Fears",
        "Longer-Term Perspective",
      ],
      blurb: "The classic ten-card spread for a full, layered reflection.",
    },
    grand: {
      name: "Life & Love Grand Spread",
      positions: [
        "Where You Are Now",
        "Core Desire",
        "Past Influence",
        "Love: Current State",
        "Love: What You Need",
        "Love: Obstacle",
        "Career & Purpose",
        "Money & Security",
        "Personal Growth",
        "Family & Home",
        "Hidden Influence",
        "Advice",
        "Near-Term Direction",
        "Long-Term Perspective",
      ],
      blurb:
        "The deepest spread—life and love together, with the full arcana in play.",
    },
  },
  "es-ES": {
    daily: {
      name: "Carta del día",
      positions: ["Hoy"],
      blurb: "Una carta. Una reflexión clara para llevar contigo hoy.",
    },
    ppf: {
      name: "Pasado, presente y futuro",
      positions: ["Pasado", "Presente", "Futuro posible"],
      blurb:
        "Una reflexión breve sobre lo que dio forma a este momento y la dirección que puedes considerar.",
    },
    love5: {
      name: "Lectura del amor",
      positions: [
        "Tú",
        "Tu visión de la otra persona",
        "La conexión según la percibes",
        "El desafío",
        "El potencial",
      ],
      blurb:
        "Una mirada enfocada a tu experiencia de la conexión, tus necesidades y tus elecciones.",
    },
    celtic: {
      name: "Cruz celta",
      positions: [
        "Presente",
        "Desafío",
        "Fundamento",
        "Pasado reciente",
        "Dirección posible",
        "Enfoque a corto plazo",
        "Tu enfoque",
        "Influencias externas",
        "Esperanzas y temores",
        "Perspectiva a más largo plazo",
      ],
      blurb:
        "La tirada clásica de diez cartas para una reflexión completa y con matices.",
    },
    grand: {
      name: "Gran tirada de vida y amor",
      positions: [
        "Dónde estás ahora",
        "Deseo central",
        "Influencia del pasado",
        "Amor: estado actual",
        "Amor: lo que necesitas",
        "Amor: obstáculo",
        "Carrera y propósito",
        "Dinero y seguridad",
        "Crecimiento personal",
        "Familia y hogar",
        "Influencia oculta",
        "Consejo",
        "Dirección a corto plazo",
        "Perspectiva a largo plazo",
      ],
      blurb:
        "La tirada más profunda: vida y amor juntos, con todos los arcanos en juego.",
    },
  },
  "fr-FR": {
    daily: {
      name: "Carte du jour",
      positions: ["Aujourd’hui"],
      blurb: "Une carte. Une réflexion claire à garder avec vous aujourd’hui.",
    },
    ppf: {
      name: "Passé, présent et avenir",
      positions: ["Passé", "Présent", "Avenir possible"],
      blurb:
        "Une réflexion rapide sur ce qui a façonné ce moment et la direction que vous pouvez envisager.",
    },
    love5: {
      name: "Lecture de l’amour",
      positions: [
        "Vous",
        "Votre perception de l’autre",
        "Le lien tel que vous le percevez",
        "Le défi",
        "Le potentiel",
      ],
      blurb:
        "Un regard ciblé sur votre expérience du lien, vos besoins et vos choix.",
    },
    celtic: {
      name: "Croix celtique",
      positions: [
        "Présent",
        "Défi",
        "Fondation",
        "Passé récent",
        "Direction possible",
        "Priorité à court terme",
        "Votre approche",
        "Influences extérieures",
        "Espoirs et craintes",
        "Perspective à plus long terme",
      ],
      blurb:
        "Le tirage classique en dix cartes pour une réflexion complète et nuancée.",
    },
    grand: {
      name: "Grand tirage de vie et d’amour",
      positions: [
        "Où vous en êtes",
        "Désir central",
        "Influence du passé",
        "Amour : état actuel",
        "Amour : ce dont vous avez besoin",
        "Amour : obstacle",
        "Carrière et vocation",
        "Argent et sécurité",
        "Développement personnel",
        "Famille et foyer",
        "Influence cachée",
        "Conseil",
        "Direction à court terme",
        "Perspective à long terme",
      ],
      blurb:
        "Le tirage le plus profond : vie et amour ensemble, avec tous les arcanes en jeu.",
    },
  },
  "de-DE": {
    daily: {
      name: "Tageskarte",
      positions: ["Heute"],
      blurb: "Eine Karte. Eine klare Reflexion für deinen heutigen Tag.",
    },
    ppf: {
      name: "Vergangenheit, Gegenwart und Zukunft",
      positions: ["Vergangenheit", "Gegenwart", "Mögliche Zukunft"],
      blurb:
        "Eine kurze Reflexion darüber, was diesen Moment geprägt hat und welche Richtung du erwägen kannst.",
    },
    love5: {
      name: "Liebeslegung",
      positions: [
        "Du",
        "Deine Sicht auf die andere Person",
        "Die Verbindung aus deiner Sicht",
        "Die Herausforderung",
        "Das Potenzial",
      ],
      blurb:
        "Ein gezielter Blick auf deine Erfahrung von Verbindung, Bedürfnissen und Entscheidungen.",
    },
    celtic: {
      name: "Keltisches Kreuz",
      positions: [
        "Gegenwart",
        "Herausforderung",
        "Grundlage",
        "Jüngste Vergangenheit",
        "Mögliche Richtung",
        "Kurzfristiger Fokus",
        "Dein Ansatz",
        "Äußere Einflüsse",
        "Hoffnungen und Ängste",
        "Längerfristige Perspektive",
      ],
      blurb:
        "Die klassische Legung mit zehn Karten für eine vollständige, vielschichtige Reflexion.",
    },
    grand: {
      name: "Große Lebens- und Liebeslegung",
      positions: [
        "Wo du jetzt stehst",
        "Zentraler Wunsch",
        "Einfluss der Vergangenheit",
        "Liebe: aktueller Stand",
        "Liebe: was du brauchst",
        "Liebe: Hindernis",
        "Beruf und Sinn",
        "Geld und Sicherheit",
        "Persönliche Entwicklung",
        "Familie und Zuhause",
        "Verborgener Einfluss",
        "Hinweis",
        "Kurzfristige Richtung",
        "Langfristige Perspektive",
      ],
      blurb:
        "Die tiefste Legung: Leben und Liebe zusammen, mit der vollständigen Arkana.",
    },
  },
};

export function localizeTarotReadings(
  readings: readonly TarotReading[],
  locale: TarotLocale,
): readonly TarotReading[] {
  return readings.map((reading) => ({
    ...reading,
    ...READING_TRANSLATIONS[locale][reading.id],
    positions: [...READING_TRANSLATIONS[locale][reading.id].positions],
  }));
}
