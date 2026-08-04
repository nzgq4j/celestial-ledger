import type { LocaleTag } from "@/lib/i18n/config";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import type { Aspect } from "@/lib/types";

type Context = {
  moonTopic: string;
  sunTopic: string;
  rulerTopic: string;
  ruler: string;
  rulerSign: string;
  retrograde: boolean;
  aspect?: Aspect;
};

const shared = {
  "en-GB": {
    topics: [
      "identity and fresh starts",
      "resources and self-worth",
      "conversation and daily movement",
      "home and belonging",
      "creativity and pleasure",
      "routines and useful work",
      "partnership and reciprocity",
      "trust and shared resources",
      "learning and wider horizons",
      "career and public direction",
      "friends and future plans",
      "rest and inner renewal",
    ],
    elements: [
      "Give inspiration a practical next step before its heat disperses.",
      "Let steady progress count; refinement is more useful than urgency.",
      "Name the idea clearly, then notice which conversation gives it life.",
      "Treat sensitivity as information and choose where it deserves your attention.",
    ],
    overview: (c: Context, e: string) =>
      `The Moon moves through your field of ${c.moonTopic}, making this a day to notice what asks for an immediate emotional response. Meanwhile, the Sun keeps the longer arc centred on ${c.sunTopic}. ${e}`,
    relationships: (c: Context) =>
      `In connection, listen for the need beneath the first reaction. ${c.ruler} in ${c.rulerSign} favours ${c.retrograde ? "reviewing an old pattern before making a promise" : "clear signals and choices that match your present values"}.`,
    work: (c: Context, a: string) =>
      `Direct practical effort toward ${c.rulerTopic}. ${c.aspect ? `${a}, so use that contrast to improve the plan rather than forcing a quick conclusion.` : "A simple sequence and one completed task will create useful momentum."}`,
    wellbeing: (c: Context) =>
      `Protect enough quiet to distinguish your own rhythm from the atmosphere around you. Small rituals connected with ${c.moonTopic} can restore steadiness today.`,
    opportunity: (c: Context) =>
      `Make one visible choice that supports ${c.sunTopic}; consistency will carry more weight than spectacle.`,
    caution: (c: Context) =>
      `Do not treat a passing mood as a final verdict, especially around ${c.moonTopic}.`,
    question: (c: Context) =>
      `What would a more intentional relationship with ${c.moonTopic} look like today?`,
  },
  "es-ES": {
    topics: [
      "la identidad y los nuevos comienzos",
      "los recursos y la autoestima",
      "la conversación y el movimiento cotidiano",
      "el hogar y el sentido de pertenencia",
      "la creatividad y el placer",
      "las rutinas y el trabajo útil",
      "la pareja y la reciprocidad",
      "la confianza y los recursos compartidos",
      "el aprendizaje y los horizontes más amplios",
      "la vocación y la dirección pública",
      "las amistades y los planes de futuro",
      "el descanso y la renovación interior",
    ],
    elements: [
      "Da a la inspiración un próximo paso concreto antes de que se disperse su fuego.",
      "Valora el progreso constante; perfeccionar resulta más útil que apresurarse.",
      "Nombra la idea con claridad y observa qué conversación le da vida.",
      "Trata la sensibilidad como información y elige dónde merece tu atención.",
    ],
    overview: (c: Context, e: string) =>
      `La Luna recorre tu ámbito de ${c.moonTopic}, invitándote a observar qué pide una respuesta emocional inmediata. Mientras tanto, el Sol mantiene el arco más amplio centrado en ${c.sunTopic}. ${e}`,
    relationships: (c: Context) =>
      `En tus vínculos, escucha la necesidad que existe bajo la primera reacción. ${c.ruler} en ${c.rulerSign} favorece ${c.retrograde ? "revisar un patrón antiguo antes de hacer una promesa" : "las señales claras y las decisiones acordes con tus valores actuales"}.`,
    work: (c: Context, a: string) =>
      `Dirige el esfuerzo práctico hacia ${c.rulerTopic}. ${c.aspect ? `${a}; utiliza ese contraste para mejorar el plan en vez de forzar una conclusión rápida.` : "Una secuencia sencilla y una tarea terminada crearán un impulso útil."}`,
    wellbeing: (c: Context) =>
      `Protege suficiente silencio para distinguir tu propio ritmo del ambiente. Los pequeños rituales relacionados con ${c.moonTopic} pueden devolverte estabilidad hoy.`,
    opportunity: (c: Context) =>
      `Haz una elección visible que apoye ${c.sunTopic}; la constancia tendrá más peso que el espectáculo.`,
    caution: (c: Context) =>
      `No conviertas un estado de ánimo pasajero en un veredicto definitivo, especialmente en torno a ${c.moonTopic}.`,
    question: (c: Context) =>
      `¿Cómo sería hoy una relación más consciente con ${c.moonTopic}?`,
  },
  "fr-FR": {
    topics: [
      "l’identité et les nouveaux départs",
      "les ressources et l’estime de soi",
      "les échanges et les déplacements quotidiens",
      "le foyer et l’appartenance",
      "la créativité et le plaisir",
      "les habitudes et le travail utile",
      "le partenariat et la réciprocité",
      "la confiance et les ressources partagées",
      "l’apprentissage et les horizons élargis",
      "la carrière et la direction publique",
      "les amitiés et les projets d’avenir",
      "le repos et le renouveau intérieur",
    ],
    elements: [
      "Donnez à l’inspiration une prochaine étape concrète avant que son feu ne se disperse.",
      "Accordez de la valeur aux progrès réguliers ; affiner est plus utile que se hâter.",
      "Nommez clairement l’idée, puis observez quelle conversation lui donne vie.",
      "Considérez la sensibilité comme une information et choisissez où elle mérite votre attention.",
    ],
    overview: (c: Context, e: string) =>
      `La Lune traverse votre domaine de ${c.moonTopic}, vous invitant à remarquer ce qui demande une réponse émotionnelle immédiate. Pendant ce temps, le Soleil maintient le mouvement de fond centré sur ${c.sunTopic}. ${e}`,
    relationships: (c: Context) =>
      `Dans vos liens, écoutez le besoin sous la première réaction. ${c.ruler} en ${c.rulerSign} favorise ${c.retrograde ? "la révision d’un ancien schéma avant de faire une promesse" : "des signaux clairs et des choix accordés à vos valeurs présentes"}.`,
    work: (c: Context, a: string) =>
      `Dirigez vos efforts concrets vers ${c.rulerTopic}. ${c.aspect ? `${a} ; utilisez ce contraste pour améliorer le projet plutôt que forcer une conclusion rapide.` : "Une séquence simple et une tâche achevée créeront un élan utile."}`,
    wellbeing: (c: Context) =>
      `Préservez assez de calme pour distinguer votre propre rythme de l’atmosphère ambiante. De petits rituels liés à ${c.moonTopic} peuvent rétablir votre stabilité aujourd’hui.`,
    opportunity: (c: Context) =>
      `Faites un choix visible qui soutient ${c.sunTopic} ; la constance pèsera davantage que le spectacle.`,
    caution: (c: Context) =>
      `Ne transformez pas une humeur passagère en verdict définitif, surtout autour de ${c.moonTopic}.`,
    question: (c: Context) =>
      `À quoi ressemblerait aujourd’hui une relation plus consciente avec ${c.moonTopic} ?`,
  },
  "de-DE": {
    topics: [
      "Identität und Neuanfänge",
      "Ressourcen und Selbstwert",
      "Gespräche und alltägliche Bewegung",
      "Zuhause und Zugehörigkeit",
      "Kreativität und Freude",
      "Routinen und sinnvolle Arbeit",
      "Partnerschaft und Gegenseitigkeit",
      "Vertrauen und gemeinsame Ressourcen",
      "Lernen und weitere Horizonte",
      "Beruf und öffentliche Ausrichtung",
      "Freundschaften und Zukunftspläne",
      "Ruhe und innere Erneuerung",
    ],
    elements: [
      "Gib der Inspiration einen praktischen nächsten Schritt, bevor sich ihre Glut zerstreut.",
      "Lass stetigen Fortschritt zählen; Verfeinerung ist hilfreicher als Eile.",
      "Benenne die Idee klar und achte darauf, welches Gespräch sie lebendig macht.",
      "Behandle Sensibilität als Information und entscheide, wo sie deine Aufmerksamkeit verdient.",
    ],
    overview: (c: Context, e: string) =>
      `Der Mond bewegt sich durch dein Feld für ${c.moonTopic} und macht sichtbar, was nach einer unmittelbaren emotionalen Antwort verlangt. Die Sonne hält den größeren Bogen währenddessen auf ${c.sunTopic} ausgerichtet. ${e}`,
    relationships: (c: Context) =>
      `Höre in Beziehungen auf das Bedürfnis unter der ersten Reaktion. ${c.ruler} in ${c.rulerSign} begünstigt ${c.retrograde ? "die Überprüfung eines alten Musters, bevor du ein Versprechen gibst" : "klare Signale und Entscheidungen, die deinen heutigen Werten entsprechen"}.`,
    work: (c: Context, a: string) =>
      `Richte praktische Anstrengung auf ${c.rulerTopic}. ${c.aspect ? `${a}; nutze diesen Kontrast, um den Plan zu verbessern, statt einen schnellen Abschluss zu erzwingen.` : "Eine einfache Abfolge und eine abgeschlossene Aufgabe schaffen hilfreichen Schwung."}`,
    wellbeing: (c: Context) =>
      `Bewahre genug Ruhe, um deinen eigenen Rhythmus von der Stimmung um dich herum zu unterscheiden. Kleine Rituale rund um ${c.moonTopic} können heute Stabilität zurückbringen.`,
    opportunity: (c: Context) =>
      `Triff eine sichtbare Entscheidung, die ${c.sunTopic} unterstützt; Beständigkeit wiegt mehr als Spektakel.`,
    caution: (c: Context) =>
      `Behandle eine vorübergehende Stimmung nicht als endgültiges Urteil, besonders bei ${c.moonTopic}.`,
    question: (c: Context) =>
      `Wie würde heute ein bewussterer Umgang mit ${c.moonTopic} aussehen?`,
  },
} as const;

export function dailyCopy(locale: LocaleTag) {
  return shared[locale];
}

export function localizedAspectPhrase(aspect: Aspect, locale: LocaleTag) {
  const b1 = localizeAstroTerm(aspect.body1, locale);
  const b2 = localizeAstroTerm(aspect.body2, locale);
  const a = localizeAstroTerm(aspect.type, locale).toLowerCase();
  if (locale === "es-ES")
    return `${b1} en ${a} con ${b2} crea un intercambio entre ambos impulsos`;
  if (locale === "fr-FR")
    return `${b1} en ${a} avec ${b2} met leurs deux élans en dialogue`;
  if (locale === "de-DE")
    return `${b1} im ${a} zu ${b2} bringt beide Kräfte ins Gespräch`;
  return `${b1} ${a} ${b2} brings their two drives into dialogue`;
}
