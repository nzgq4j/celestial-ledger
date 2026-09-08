import type { LocaleTag } from "@/lib/i18n/config";

export type MembershipTierId = "free" | "personal" | "premium";

type TierCopy = {
  name: string;
  descriptor: string;
  price: string;
  cadence: string;
  purpose: string;
  features: string[];
  action: string;
};

type MembershipCopy = {
  landing: {
    kicker: string;
    title: string;
    introduction: string;
    membershipAction: string;
    membershipNote: string;
    routes: {
      label: string;
      title: string;
      description: string;
      action: string;
    }[];
  };
  page: {
    eyebrow: string;
    title: string;
    introduction: string;
    preview: string;
    unavailable: string;
    orbitLabel: string;
    included: string;
    recommended: string;
    tiers: Record<MembershipTierId, TierCopy>;
    comparisonKicker: string;
    comparisonTitle: string;
    comparisonIntroduction: string;
    usageTitle: string;
    usageNotes: string;
    feature: string;
    comparison: {
      feature: string;
      free: string;
      personal: string;
      premium: string;
    }[];
    pathKicker: string;
    pathTitle: string;
    path: { title: string; description: string }[];
    pathAction: string;
    signedInAction: string;
    reportsAction: string;
  };
};

export const membershipCopy: Record<LocaleTag, MembershipCopy> = {
  "en-GB": {
    landing: {
      kicker: "Three ways into the atlas",
      title: "Follow today’s sky. Then ask the deeper question.",
      introduction:
        "Begin with the shared celestial weather, widen the view across the week, or bring the moving sky into direct conversation with your natal chart.",
      membershipAction: "Compare memberships",
      membershipNote:
        "Membership brings your saved charts, recurring readings and private reports into one personal atlas.",
      routes: [
        {
          label: "Today · all twelve signs",
          title: "Daily sun-sign horoscopes",
          description:
            "Read the morning, noon and evening current for your sign, with focused guidance for relationships, business and money.",
          action: "Read today’s horoscopes",
        },
        {
          label: "Seven days · one larger current",
          title: "Weekly reading",
          description:
            "See where the week gathers momentum, where patience has power and which choice deserves a clearer line.",
          action: "Explore the weekly reading",
        },
        {
          label: "Your natal chart · one deep question",
          title: "Detailed personal reports",
          description:
            "Enter the private reading room for full evidence-linked reports on vocation, renewal and the cycles ahead.",
          action: "Explore detailed reports",
        },
      ],
    },
    page: {
      eyebrow: "Membership · your atlas over time",
      title: "Your sky, your rhythm.",
      introduction:
        "Every level begins with a calculated natal chart. Membership widens the number of charts you can hold, the rhythm of personal readings and the depth of reports available inside your private atlas.",
      preview:
        "Paid memberships are open. Choose the level that matches how often you want to return to your atlas.",
      unavailable:
        "Paid membership enrolment is temporarily unavailable. You can still create a free account and explore your atlas.",
      orbitLabel: "Membership orbits",
      included: "What the orbit holds",
      recommended: "Recommended",
      tiers: {
        free: {
          name: "Free",
          descriptor: "Begin your atlas",
          price: "$0",
          cadence: "No monthly fee",
          purpose:
            "For discovering your natal chart and returning to personal guidance at a measured pace.",
          features: [
            "1 saved natal chart",
            "1 personal daily reading each week",
            "All twelve public daily sun-sign horoscopes",
            "One-card daily tarot draw",
          ],
          action: "Create a free account",
        },
        personal: {
          name: "Personal",
          descriptor: "Keep a living atlas",
          price: "$9.99",
          cadence: "USD per month",
          purpose:
            "For following your own sky regularly while keeping one additional chart for someone important to you.",
          features: [
            "2 saved natal charts",
            "10 daily readings per billing month, shared across your charts",
            "A weekly reading for your primary chart",
            "Detailed reports available à la carte",
            "10% off detailed reports",
            "Daily, Past–Present–Future and five-card Love tarot spreads",
          ],
          action: "Create account to begin",
        },
        premium: {
          name: "Premium",
          descriptor: "Carry the wider constellation",
          price: "$19.99",
          cadence: "USD per month",
          purpose:
            "For a household or close circle of charts, with daily readings in your atlas and deeper reports included.",
          features: [
            "5 saved natal charts",
            "Daily reading for your primary chart",
            "10 companion-chart daily readings each month",
            "Weekly reading for your primary chart",
            "Career and Recovery detailed reports included",
            "All five tarot spreads, including Celtic Cross and Life & Love Grand Spread",
          ],
          action: "Create account to begin",
        },
      },
      comparisonKicker: "The entitlement ledger",
      comparisonTitle: "See exactly what changes at each level.",
      comparisonIntroduction:
        "Compare chart spaces, reading allowances and included reports. All prices are in USD.",
      usageTitle: "How reading allowances work",
      usageNotes:
        "Generate readings in My atlas and return to them in My library. Your oldest active saved chart is your primary chart. Daily allowances reset at midnight UTC; weekly daily-reading allowances reset on Monday UTC. Monthly allowances follow your billing period (calendar months for access without a current billing period). Saved readings remain available for one year; opening them again uses no allowance. Tarot decks available depend on your plan.",
      feature: "Feature",
      comparison: [
        {
          feature: "Saved natal charts",
          free: "1",
          personal: "2",
          premium: "5",
        },
        {
          feature: "Personal daily readings",
          free: "1 weekly",
          personal: "10 monthly",
          premium: "Primary chart daily",
        },
        {
          feature: "Companion-chart daily readings",
          free: "—",
          personal: "Shared within the 10-reading allowance",
          premium: "10 monthly",
        },
        {
          feature: "Weekly primary-chart reading",
          free: "-",
          personal: "Included",
          premium: "Included",
        },
        {
          feature: "Tarot spreads",
          free: "Daily draw (1 card)",
          personal: "Daily, Past–Present–Future (3), Love (5)",
          premium:
            "All Personal spreads + Celtic Cross (10), Life & Love Grand (14)",
        },
        {
          feature: "Career and Purpose / Recovery Reflection reports",
          free: "Standard price",
          personal: "10% off",
          premium: "Included",
        },
      ],
      pathKicker: "Your path into membership",
      pathTitle: "Begin with a chart. Widen the atlas when you are ready.",
      path: [
        {
          title: "Create your account",
          description:
            "Keep your chart private and carry your chosen language throughout the atlas.",
        },
        {
          title: "Anchor your first natal chart",
          description:
            "Your calculated birth sky becomes the foundation for every personal reading.",
        },
        {
          title: "Choose your reading rhythm",
          description:
            "Stay with Free or choose Personal or Premium whenever you want a wider reading rhythm.",
        },
      ],
      pathAction: "Create my free account",
      signedInAction: "Open My Celestial Atlas",
      reportsAction: "Read the sample reports",
    },
  },
  "es-ES": {
    landing: {
      kicker: "Tres caminos hacia el atlas",
      title: "Sigue el cielo de hoy. Después plantea la pregunta profunda.",
      introduction:
        "Comienza con el clima celeste compartido, amplía la mirada a la semana o pon el cielo en movimiento en conversación directa con tu carta natal.",
      membershipAction: "Comparar membresías",
      membershipNote:
        "La membresía reúne tus cartas guardadas, lecturas periódicas e informes privados en un atlas personal.",
      routes: [
        {
          label: "Hoy · los doce signos",
          title: "Horóscopos solares diarios",
          description:
            "Lee la corriente de la mañana, el mediodía y la noche para tu signo, con orientación para relaciones, negocios y dinero.",
          action: "Leer los horóscopos de hoy",
        },
        {
          label: "Siete días · una corriente mayor",
          title: "Lectura semanal",
          description:
            "Descubre dónde cobra impulso la semana, dónde la paciencia tiene poder y qué elección necesita una línea más clara.",
          action: "Explorar la lectura semanal",
        },
        {
          label: "Tu carta natal · una pregunta profunda",
          title: "Informes personales detallados",
          description:
            "Entra en la sala privada para leer informes completos y vinculados a evidencias sobre vocación, renovación y los ciclos venideros.",
          action: "Explorar informes detallados",
        },
      ],
    },
    page: {
      eyebrow: "Membresía · tu atlas a través del tiempo",
      title: "Tu cielo, tu ritmo.",
      introduction:
        "Cada nivel comienza con una carta natal calculada. La membresía amplía las cartas que puedes guardar, el ritmo de las lecturas personales y la profundidad de los informes de tu atlas privado.",
      preview:
        "Las membresías de pago ya están disponibles. Elige el nivel que acompañe la frecuencia con la que quieres volver a tu atlas.",
      unavailable:
        "La inscripción a membresías de pago no está disponible temporalmente. Aún puedes crear una cuenta gratuita y explorar tu atlas.",
      orbitLabel: "Órbitas de membresía",
      included: "Lo que contiene la órbita",
      recommended: "Recomendado",
      tiers: {
        free: {
          name: "Gratis",
          descriptor: "Comienza tu atlas",
          price: "$0",
          cadence: "Sin cuota mensual",
          purpose:
            "Para descubrir tu carta natal y volver a la guía personal con un ritmo medido.",
          features: [
            "1 carta natal guardada",
            "1 lectura diaria personal por semana",
            "Los doce horóscopos solares diarios públicos",
            "Tirada diaria de tarot de una carta",
          ],
          action: "Crear una cuenta gratis",
        },
        personal: {
          name: "Personal",
          descriptor: "Mantén un atlas vivo",
          price: "$9.99",
          cadence: "USD al mes",
          purpose:
            "Para seguir tu propio cielo con regularidad y guardar una carta adicional de alguien importante para ti.",
          features: [
            "2 cartas natales guardadas",
            "10 lecturas diarias por mes de facturación, compartidas entre tus cartas",
            "Una lectura semanal para tu carta principal",
            "Informes detallados a la carta",
            "10% de descuento para miembros en informes",
            "Tarot diario, Pasado–Presente–Futuro y Amor de cinco cartas",
          ],
          action: "Crear cuenta para comenzar",
        },
        premium: {
          name: "Premium",
          descriptor: "Lleva la constelación más amplia",
          price: "$19.99",
          cadence: "USD al mes",
          purpose:
            "Para un hogar o círculo cercano de cartas, con lecturas diarias en tu atlas e informes detallados incluidos.",
          features: [
            "5 cartas natales guardadas",
            "Lectura diaria para tu carta principal",
            "10 lecturas mensuales para cartas acompañantes",
            "Lectura semanal para tu carta principal",
            "Informes detallados de Carrera y Recuperación incluidos",
            "Las cinco tiradas de tarot, incluidas Cruz Celta y Gran Tirada de Vida y Amor",
          ],
          action: "Crear cuenta para comenzar",
        },
      },
      comparisonKicker: "El registro de acceso",
      comparisonTitle: "Mira exactamente qué cambia en cada nivel.",
      comparisonIntroduction:
        "Compara cartas guardadas, cupos de lectura e informes incluidos. Los precios están en USD.",
      usageTitle: "Cómo funcionan los cupos de lectura",
      usageNotes:
        "Genera lecturas en Mi atlas y ábrelas en Mi biblioteca. Tu carta activa más antigua es la principal. El cupo diario se renueva a medianoche UTC; el cupo semanal de lecturas diarias, los lunes UTC. Los cupos mensuales siguen tu periodo de facturación (meses naturales si no hay periodo vigente). Las lecturas se guardan un año y volver a abrirlas no consume cupo. Los mazos de tarot disponibles dependen del plan.",
      feature: "Función",
      comparison: [
        {
          feature: "Cartas natales guardadas",
          free: "1",
          personal: "2",
          premium: "5",
        },
        {
          feature: "Lecturas diarias personales",
          free: "1 semanal",
          personal: "10 mensuales",
          premium: "Carta principal diaria",
        },
        {
          feature: "Lecturas de cartas acompañantes",
          free: "—",
          personal: "Dentro del cupo compartido de 10 lecturas",
          premium: "10 mensuales",
        },
        {
          feature: "Lectura semanal principal",
          free: "-",
          personal: "Incluida",
          premium: "Incluida",
        },
        {
          feature: "Tiradas de tarot",
          free: "Diaria (1 carta)",
          personal: "Diaria, Pasado–Presente–Futuro (3), Amor (5)",
          premium: "Todas las de Personal + Cruz Celta (10), Vida y Amor (14)",
        },
        {
          feature:
            "Informes de Carrera y Propósito / Reflexión de Recuperación",
          free: "Precio estándar",
          personal: "10% de descuento",
          premium: "Incluidos",
        },
      ],
      pathKicker: "Tu camino hacia la membresía",
      pathTitle: "Comienza con una carta. Amplía el atlas cuando estés listo.",
      path: [
        {
          title: "Crea tu cuenta",
          description:
            "Mantén tu carta privada y lleva el idioma elegido por todo el atlas.",
        },
        {
          title: "Ancla tu primera carta natal",
          description:
            "Tu cielo natal calculado se convierte en la base de cada lectura personal.",
        },
        {
          title: "Elige tu ritmo",
          description:
            "Continúa con Gratis o elige Personal o Premium cuando quieras ampliar tu ritmo de lecturas.",
        },
      ],
      pathAction: "Crear mi cuenta gratis",
      signedInAction: "Abrir Mi Atlas Celeste",
      reportsAction: "Leer los informes de muestra",
    },
  },
  "fr-FR": {
    landing: {
      kicker: "Trois chemins dans l’atlas",
      title: "Suivez le ciel du jour. Posez ensuite la question profonde.",
      introduction:
        "Commencez par le climat céleste commun, élargissez le regard à la semaine ou mettez le ciel en mouvement en dialogue direct avec votre thème natal.",
      membershipAction: "Comparer les adhésions",
      membershipNote:
        "L’adhésion réunit vos thèmes enregistrés, vos lectures récurrentes et vos rapports privés dans un atlas personnel.",
      routes: [
        {
          label: "Aujourd’hui · les douze signes",
          title: "Horoscopes solaires quotidiens",
          description:
            "Lisez le courant du matin, de midi et du soir pour votre signe, avec des repères pour les relations, les affaires et l’argent.",
          action: "Lire les horoscopes du jour",
        },
        {
          label: "Sept jours · un courant plus vaste",
          title: "Lecture hebdomadaire",
          description:
            "Voyez où la semaine prend de l’élan, où la patience devient force et quel choix demande une ligne plus nette.",
          action: "Explorer la lecture hebdomadaire",
        },
        {
          label: "Votre thème natal · une question profonde",
          title: "Rapports personnels détaillés",
          description:
            "Entrez dans le salon privé pour des rapports complets, reliés aux preuves, sur la vocation, le renouveau et les cycles à venir.",
          action: "Explorer les rapports détaillés",
        },
      ],
    },
    page: {
      eyebrow: "Adhésion · votre atlas dans le temps",
      title: "Votre ciel, votre rythme.",
      introduction:
        "Chaque niveau commence par un thème natal calculé. L’adhésion élargit le nombre de thèmes conservés, le rythme des lectures personnelles et la profondeur des rapports dans votre atlas privé.",
      preview:
        "Les adhésions payantes sont ouvertes. Choisissez le niveau qui correspond au rythme auquel vous souhaitez retrouver votre atlas.",
      unavailable:
        "L’adhésion payante est temporairement indisponible. Vous pouvez toujours créer un compte gratuit et explorer votre atlas.",
      orbitLabel: "Orbites d’adhésion",
      included: "Ce que contient l’orbite",
      recommended: "Recommandé",
      tiers: {
        free: {
          name: "Gratuit",
          descriptor: "Commencez votre atlas",
          price: "$0",
          cadence: "Sans frais mensuels",
          purpose:
            "Pour découvrir votre thème natal et revenir à une guidance personnelle à un rythme mesuré.",
          features: [
            "1 thème natal enregistré",
            "1 lecture quotidienne personnelle par semaine",
            "Les douze horoscopes solaires publics",
            "Tirage quotidien de tarot à une carte",
          ],
          action: "Créer un compte gratuit",
        },
        personal: {
          name: "Personnel",
          descriptor: "Gardez un atlas vivant",
          price: "$9.99",
          cadence: "USD par mois",
          purpose:
            "Pour suivre régulièrement votre ciel et conserver un thème supplémentaire pour une personne importante.",
          features: [
            "2 thèmes natals enregistrés",
            "10 lectures quotidiennes par mois de facturation, partagées entre vos thèmes",
            "Une lecture hebdomadaire pour le thème principal",
            "Rapports détaillés à la carte",
            "10 % de réduction sur les rapports",
            "Tarot quotidien, Passé–Présent–Futur et Amour à cinq cartes",
          ],
          action: "Créer un compte pour commencer",
        },
        premium: {
          name: "Premium",
          descriptor: "Portez la constellation élargie",
          price: "$19.99",
          cadence: "USD par mois",
          purpose:
            "Pour un foyer ou un cercle proche de thèmes, avec des lectures quotidiennes dans votre atlas et des rapports détaillés inclus.",
          features: [
            "5 thèmes natals enregistrés",
            "Lecture quotidienne du thème principal",
            "10 lectures mensuelles pour les thèmes compagnons",
            "Lecture hebdomadaire du thème principal",
            "Rapports détaillés Carrière et Rétablissement inclus",
            "Les cinq tirages, dont la Croix Celtique et le Grand Tirage Vie et Amour",
          ],
          action: "Créer un compte pour commencer",
        },
      },
      comparisonKicker: "Le registre des droits",
      comparisonTitle: "Voyez précisément ce qui change à chaque niveau.",
      comparisonIntroduction:
        "Comparez les thèmes enregistrés, les quotas de lecture et les rapports inclus. Les prix sont en USD.",
      usageTitle: "Comment fonctionnent les quotas de lecture",
      usageNotes:
        "Créez vos lectures dans Mon atlas et retrouvez-les dans Ma bibliothèque. Votre plus ancien thème actif est le thème principal. Le quota quotidien se renouvelle à minuit UTC ; le quota hebdomadaire de lectures quotidiennes, le lundi UTC. Les quotas mensuels suivent la facturation (mois civils sans période de facturation en cours). Les lectures restent disponibles un an ; les rouvrir ne consomme aucun quota. Les jeux de tarot disponibles dépendent du niveau.",
      feature: "Fonctionnalité",
      comparison: [
        {
          feature: "Thèmes natals enregistrés",
          free: "1",
          personal: "2",
          premium: "5",
        },
        {
          feature: "Lectures quotidiennes personnelles",
          free: "1 par semaine",
          personal: "10 par mois",
          premium: "Thème principal quotidien",
        },
        {
          feature: "Lectures des thèmes compagnons",
          free: "—",
          personal: "Dans le quota partagé de 10 lectures",
          premium: "10 par mois",
        },
        {
          feature: "Lecture hebdomadaire principale",
          free: "-",
          personal: "Incluse",
          premium: "Incluse",
        },
        {
          feature: "Tirages de tarot",
          free: "Quotidien (1 carte)",
          personal: "Quotidien, Passé–Présent–Futur (3), Amour (5)",
          premium:
            "Tous ceux de Personnel + Croix Celtique (10), Vie et Amour (14)",
        },
        {
          feature:
            "Rapports Carrière et Vocation / Réflexion sur le Rétablissement",
          free: "Tarif standard",
          personal: "10 % de réduction",
          premium: "Inclus",
        },
      ],
      pathKicker: "Votre chemin vers l’adhésion",
      pathTitle:
        "Commencez par un thème. Élargissez l’atlas quand vous le souhaitez.",
      path: [
        {
          title: "Créez votre compte",
          description:
            "Gardez votre thème privé et votre langue choisie dans tout l’atlas.",
        },
        {
          title: "Ancrez votre premier thème natal",
          description:
            "Votre ciel natal calculé devient la base de chaque lecture personnelle.",
        },
        {
          title: "Choisissez votre rythme",
          description:
            "Restez en Gratuit ou choisissez Personnel ou Premium lorsque vous souhaitez élargir votre rythme de lecture.",
        },
      ],
      pathAction: "Créer mon compte gratuit",
      signedInAction: "Ouvrir Mon Atlas Céleste",
      reportsAction: "Lire les rapports exemples",
    },
  },
  "de-DE": {
    landing: {
      kicker: "Drei Wege in den Atlas",
      title: "Folge dem heutigen Himmel. Stelle dann die tiefere Frage.",
      introduction:
        "Beginne mit dem gemeinsamen Himmelswetter, weite den Blick über die Woche oder bringe den bewegten Himmel in direkten Dialog mit deinem Geburtshoroskop.",
      membershipAction: "Mitgliedschaften vergleichen",
      membershipNote:
        "Die Mitgliedschaft vereint gespeicherte Horoskope, wiederkehrende Lesungen und private Berichte in deinem persönlichen Atlas.",
      routes: [
        {
          label: "Heute · alle zwölf Zeichen",
          title: "Tägliche Sonnenzeichen-Horoskope",
          description:
            "Lies den Morgen-, Mittags- und Abendstrom für dein Zeichen mit Hinweisen zu Beziehungen, Geschäft und Geld.",
          action: "Heutige Horoskope lesen",
        },
        {
          label: "Sieben Tage · ein größerer Strom",
          title: "Wöchentliche Lesung",
          description:
            "Erkenne, wo die Woche Schwung gewinnt, wo Geduld Kraft hat und welche Wahl eine klarere Linie verlangt.",
          action: "Wöchentliche Lesung entdecken",
        },
        {
          label: "Dein Geburtshoroskop · eine tiefe Frage",
          title: "Detaillierte persönliche Berichte",
          description:
            "Betritt den privaten Leseraum für vollständige, evidenzverknüpfte Berichte über Berufung, Erneuerung und kommende Zyklen.",
          action: "Detaillierte Berichte entdecken",
        },
      ],
    },
    page: {
      eyebrow: "Mitgliedschaft · dein Atlas im Lauf der Zeit",
      title: "Dein Himmel, dein Rhythmus.",
      introduction:
        "Jede Stufe beginnt mit einem berechneten Geburtshoroskop. Die Mitgliedschaft erweitert die Zahl deiner Horoskope, den Rhythmus persönlicher Lesungen und die Tiefe der Berichte in deinem privaten Atlas.",
      preview:
        "Bezahlte Mitgliedschaften sind jetzt verfügbar. Wähle die Stufe, die dazu passt, wie oft du zu deinem Atlas zurückkehren möchtest.",
      unavailable:
        "Die Anmeldung für bezahlte Mitgliedschaften ist vorübergehend nicht verfügbar. Du kannst weiterhin ein kostenloses Konto erstellen und deinen Atlas entdecken.",
      orbitLabel: "Mitgliedschaftsorbits",
      included: "Was der Orbit enthält",
      recommended: "Empfohlen",
      tiers: {
        free: {
          name: "Kostenlos",
          descriptor: "Beginne deinen Atlas",
          price: "$0",
          cadence: "Keine Monatsgebühr",
          purpose:
            "Um dein Geburtshoroskop zu entdecken und in einem ruhigen Rhythmus zu persönlicher Führung zurückzukehren.",
          features: [
            "1 gespeichertes Geburtshoroskop",
            "1 persönliche Tageslesung pro Woche",
            "Alle zwölf öffentlichen Tageshoroskope",
            "Tägliche Tarotziehung mit einer Karte",
          ],
          action: "Kostenloses Konto erstellen",
        },
        personal: {
          name: "Personal",
          descriptor: "Führe einen lebendigen Atlas",
          price: "$9.99",
          cadence: "USD pro Monat",
          purpose:
            "Um deinem eigenen Himmel regelmäßig zu folgen und ein weiteres Horoskop für einen wichtigen Menschen zu bewahren.",
          features: [
            "2 gespeicherte Geburtshoroskope",
            "10 Tageslesungen pro Abrechnungsmonat, gemeinsam für deine Horoskope",
            "Eine Wochenlesung für das Haupthoroskop",
            "Detaillierte Berichte einzeln erhältlich",
            "10 % Rabatt auf Berichte",
            "Tageskarte, Vergangenheit–Gegenwart–Zukunft und Liebeslegung mit fünf Karten",
          ],
          action: "Konto erstellen und beginnen",
        },
        premium: {
          name: "Premium",
          descriptor: "Trage die größere Konstellation",
          price: "$19.99",
          cadence: "USD pro Monat",
          purpose:
            "Für einen Haushalt oder engen Kreis von Horoskopen, mit Tageslesungen im Atlas und enthaltenen ausführlichen Berichten.",
          features: [
            "5 gespeicherte Geburtshoroskope",
            "Tägliche Lesung für das Haupthoroskop",
            "10 Tageslesungen für Begleithoroskope pro Monat",
            "Wochenlesung für das Haupthoroskop",
            "Detaillierte Karriere- und Erholungsberichte inklusive",
            "Alle fünf Tarotlegungen, einschließlich Keltischem Kreuz und großer Legung für Leben und Liebe",
          ],
          action: "Konto erstellen und beginnen",
        },
      },
      comparisonKicker: "Das Berechtigungsregister",
      comparisonTitle: "Sieh genau, was sich auf jeder Stufe verändert.",
      comparisonIntroduction:
        "Vergleiche Speicherplätze, Lesekontingente und enthaltene Berichte. Alle Preise sind in USD.",
      usageTitle: "So funktionieren die Lesekontingente",
      usageNotes:
        "Erstelle Lesungen in Mein Atlas und öffne sie in Meine Bibliothek. Dein ältestes aktives Horoskop ist das Haupthoroskop. Das Tageskontingent wird um Mitternacht UTC erneuert; das Wochenkontingent für Tageslesungen montags UTC. Monatskontingente folgen der Abrechnung (Kalendermonate ohne laufenden Abrechnungszeitraum). Lesungen bleiben ein Jahr verfügbar; erneutes Öffnen verbraucht kein Kontingent. Verfügbare Tarotdecks hängen vom Tarif ab.",
      feature: "Funktion",
      comparison: [
        {
          feature: "Gespeicherte Geburtshoroskope",
          free: "1",
          personal: "2",
          premium: "5",
        },
        {
          feature: "Persönliche Tageslesungen",
          free: "1 wöchentlich",
          personal: "10 monatlich",
          premium: "Haupthoroskop täglich",
        },
        {
          feature: "Lesungen für Begleithoroskope",
          free: "—",
          personal: "Im gemeinsamen Kontingent von 10 Lesungen",
          premium: "10 monatlich",
        },
        {
          feature: "Wöchentliche Hauptlesung",
          free: "-",
          personal: "Enthalten",
          premium: "Enthalten",
        },
        {
          feature: "Tarotlegungen",
          free: "Tageskarte (1)",
          personal:
            "Tageskarte, Vergangenheit–Gegenwart–Zukunft (3), Liebe (5)",
          premium:
            "Alle Personal-Legungen + Keltisches Kreuz (10), Leben und Liebe (14)",
        },
        {
          feature: "Berichte zu Karriere und Berufung / Erholungsreflexion",
          free: "Standardpreis",
          personal: "10 % Rabatt",
          premium: "Inklusive",
        },
      ],
      pathKicker: "Dein Weg zur Mitgliedschaft",
      pathTitle:
        "Beginne mit einem Horoskop. Erweitere den Atlas, wenn du bereit bist.",
      path: [
        {
          title: "Erstelle dein Konto",
          description:
            "Bewahre dein Horoskop privat und führe deine gewählte Sprache durch den ganzen Atlas.",
        },
        {
          title: "Verankere dein erstes Geburtshoroskop",
          description:
            "Dein berechneter Geburtshimmel wird zur Grundlage jeder persönlichen Lesung.",
        },
        {
          title: "Wähle deinen Leserhythmus",
          description:
            "Bleibe bei Kostenlos oder wähle Personal oder Premium, sobald du deinen Leserhythmus erweitern möchtest.",
        },
      ],
      pathAction: "Kostenloses Konto erstellen",
      signedInAction: "Meinen Himmelsatlas öffnen",
      reportsAction: "Beispielberichte lesen",
    },
  },
};
