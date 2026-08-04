import type { TranslationPack } from "@/lib/i18n/config";

const pack = {
  tag: "es-ES",
  name: "Spanish",
  nativeName: "Español",
  direction: "ltr",
  messages: {
    navigation: {
      homeLabel: "Inicio de Celestial Atlas",
      tagline: "Cielo ancestral · atlas personal",
      primaryLabel: "Navegación principal",
      birthChart: "Carta natal",
      horoscopes: "Horóscopos",
      weekly: "Semanal",
      reports: "Informes",
      samples: "Ejemplos",
      library: "Mi Celestial Atlas",
      menu: "Menú",
      dailyHoroscopes: "Horóscopos diarios",
      weeklyReadings: "Lecturas semanales",
      privateReports: "Informes privados",
      sampleReports: "Informes de ejemplo",
    },
    preferences: { language: "Idioma" },
    home: {
      eyebrow: "El cielo en el momento de tu llegada",
      titleFirst: "Navega",
      titleSecond: "por tu cosmos.",
      introduction:
        "Tu Sol, tu Luna, tu ascendente, las posiciones en las casas y los aspectos planetarios forman un patrón exclusivamente tuyo. Comienza con tu carta natal y sigue sus firmas más profundas a través de la vocación, los vínculos, los desafíos y el cambio.",
      exploreChart: "Explora tu carta",
      readSample: "Leer un ejemplo",
      privacy:
        "Privado por diseño · Los datos natales nunca aparecen en las URL",
      principlesLabel: "Principios de Celestial Atlas",
      personalisedTitle: "Cartas personalizadas",
      personalisedCopy: "Calculadas para tu hora y lugar.",
      depthTitle: "Astrología en profundidad",
      depthCopy: "Posiciones, aspectos y casas explicados.",
      methodTitle: "Método transparente",
      methodCopy:
        "Cada interpretación se vincula con la evidencia de la carta.",
      calculatorKicker: "Calculadora gratuita de carta natal",
      calculatorTitle: "Un mapa del cielo en tu primer momento",
      calculatorCopy:
        "Tu carta natal conserva la firma celeste del momento en que naciste. Durante siglos, los astrólogos han leído estos patrones planetarios como una guía del carácter, los vínculos, los desafíos, el propósito y las posibilidades.",
      planets: "Planetas",
      planetsCopy: "Los impulsos y funciones que interpretan los astrólogos.",
      signs: "Signos",
      signsCopy: "El estilo con el que se expresa cada posición.",
      houses: "Casas",
      housesCopy:
        "Ámbitos de la vida, disponibles cuando se conoce la hora de nacimiento.",
    },
    chartForm: {
      kicker: "Carta astrológica gratuita",
      title: "Introduce tus datos",
      name: "Nombre",
      namePlaceholder: "Tu nombre",
      email: "Correo electrónico",
      birthDate: "Fecha de nacimiento",
      birthTime: "Hora exacta de nacimiento",
      unknownTime: "No conozco la hora de nacimiento",
      birthplace: "Buscar lugar de nacimiento",
      birthplacePlaceholder: "Ciudad, región, país",
      search: "Buscar",
      searching: "Buscando…",
      selectBirthplace: "Selecciona el lugar de nacimiento verificado",
      calculate: "Obtener mi carta natal gratuita",
      calculating: "Calculando…",
      clear: "Borrar mis datos",
    },
    footer: {
      description:
        "Sabiduría celeste ancestral, trazada para el momento de tu llegada.",
      collection: "Colección de informes",
      signIn: "Iniciar sesión",
      privacy: "Privacidad",
      method: "Nuestro método",
      terms: "Términos",
      privateByDesign: "Privado por diseño",
    },
  },
} satisfies TranslationPack;

export default pack;
