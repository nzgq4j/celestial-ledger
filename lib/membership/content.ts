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
            "Sample weekly and detailed reports",
            "Additional reading-credit packs from $5",
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
            "Up to 10 personal daily readings each month",
            "A weekly reading for your primary chart",
            "Detailed reports available à la carte",
            "10% member price on detailed reports",
          ],
          action: "Create account to begin",
        },
        premium: {
          name: "Premium",
          descriptor: "Carry the wider constellation",
          price: "$19.99",
          cadence: "USD per month",
          purpose:
            "For a household or close circle of charts, with daily delivery and deeper reports woven into the year.",
          features: [
            "5 saved natal charts",
            "Daily reading for your primary chart",
            "Primary daily reading delivered by email",
            "10 companion-chart daily readings each month",
            "Weekly reading for your primary chart",
            "Career and Recovery detailed reports included",
          ],
          action: "Create account to begin",
        },
      },
      comparisonKicker: "The entitlement ledger",
      comparisonTitle: "See exactly what changes at each level.",
      comparisonIntroduction:
        "Limits are monthly unless a different cadence is shown. Access is attached to the account, while every chart and report remains private to its owner.",
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
          free: "Credit pack",
          personal: "Credit pack",
          premium: "10 monthly",
        },
        {
          feature: "Weekly primary-chart reading",
          free: "Sample",
          personal: "Included",
          premium: "Included",
        },
        {
          feature: "Email delivery",
          free: "—",
          personal: "—",
          premium: "Daily primary reading",
        },
        {
          feature: "Detailed reports",
          free: "Standard price",
          personal: "10% member price",
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
            "Stay with Free or join the launch list for Personal or Premium access.",
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
            "Muestras de lecturas semanales e informes",
            "Paquetes de créditos de lectura desde $5",
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
            "Hasta 10 lecturas diarias personales al mes",
            "Una lectura semanal para tu carta principal",
            "Informes detallados a la carta",
            "10% de descuento para miembros en informes",
          ],
          action: "Crear cuenta para comenzar",
        },
        premium: {
          name: "Premium",
          descriptor: "Lleva la constelación más amplia",
          price: "$19.99",
          cadence: "USD al mes",
          purpose:
            "Para un hogar o círculo cercano de cartas, con entrega diaria e informes profundos integrados en el año.",
          features: [
            "5 cartas natales guardadas",
            "Lectura diaria para tu carta principal",
            "Lectura principal diaria por correo",
            "10 lecturas mensuales para cartas acompañantes",
            "Lectura semanal para tu carta principal",
            "Informes detallados de Carrera y Recuperación incluidos",
          ],
          action: "Crear cuenta para comenzar",
        },
      },
      comparisonKicker: "El registro de acceso",
      comparisonTitle: "Mira exactamente qué cambia en cada nivel.",
      comparisonIntroduction:
        "Los límites son mensuales salvo que se indique otro ritmo. El acceso pertenece a la cuenta y cada carta e informe sigue siendo privado.",
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
          free: "Paquete de créditos",
          personal: "Paquete de créditos",
          premium: "10 mensuales",
        },
        {
          feature: "Lectura semanal principal",
          free: "Muestra",
          personal: "Incluida",
          premium: "Incluida",
        },
        {
          feature: "Entrega por correo",
          free: "—",
          personal: "—",
          premium: "Lectura principal diaria",
        },
        {
          feature: "Informes detallados",
          free: "Precio estándar",
          personal: "10% para miembros",
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
            "Continúa con Gratis o únete a la lista de Personal o Premium.",
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
            "Exemples de lectures hebdomadaires et de rapports",
            "Packs de crédits de lecture dès 5 $",
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
            "Jusqu’à 10 lectures quotidiennes personnelles par mois",
            "Une lecture hebdomadaire pour le thème principal",
            "Rapports détaillés à la carte",
            "10 % de tarif membre sur les rapports",
          ],
          action: "Créer un compte pour commencer",
        },
        premium: {
          name: "Premium",
          descriptor: "Portez la constellation élargie",
          price: "$19.99",
          cadence: "USD par mois",
          purpose:
            "Pour un foyer ou un cercle proche de thèmes, avec livraison quotidienne et rapports profonds au fil de l’année.",
          features: [
            "5 thèmes natals enregistrés",
            "Lecture quotidienne du thème principal",
            "Lecture principale envoyée par e-mail",
            "10 lectures mensuelles pour les thèmes compagnons",
            "Lecture hebdomadaire du thème principal",
            "Rapports détaillés Carrière et Rétablissement inclus",
          ],
          action: "Créer un compte pour commencer",
        },
      },
      comparisonKicker: "Le registre des droits",
      comparisonTitle: "Voyez précisément ce qui change à chaque niveau.",
      comparisonIntroduction:
        "Les limites sont mensuelles sauf indication contraire. L’accès est lié au compte et chaque thème et rapport reste privé.",
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
          free: "Pack de crédits",
          personal: "Pack de crédits",
          premium: "10 par mois",
        },
        {
          feature: "Lecture hebdomadaire principale",
          free: "Exemple",
          personal: "Incluse",
          premium: "Incluse",
        },
        {
          feature: "Envoi par e-mail",
          free: "—",
          personal: "—",
          premium: "Lecture principale quotidienne",
        },
        {
          feature: "Rapports détaillés",
          free: "Tarif standard",
          personal: "10 % membre",
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
            "Restez en Gratuit ou rejoignez la liste Personnel ou Premium.",
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
            "Beispiele für Wochenlesungen und Berichte",
            "Leseguthaben-Pakete ab 5 $",
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
            "Bis zu 10 persönliche Tageslesungen pro Monat",
            "Eine Wochenlesung für das Haupthoroskop",
            "Detaillierte Berichte einzeln erhältlich",
            "10 % Mitgliedspreis auf Berichte",
          ],
          action: "Konto erstellen und beginnen",
        },
        premium: {
          name: "Premium",
          descriptor: "Trage die größere Konstellation",
          price: "$19.99",
          cadence: "USD pro Monat",
          purpose:
            "Für einen Haushalt oder engen Kreis von Horoskopen, mit täglicher Zustellung und tieferen Berichten durch das Jahr.",
          features: [
            "5 gespeicherte Geburtshoroskope",
            "Tägliche Lesung für das Haupthoroskop",
            "Tägliche Hauptlesung per E-Mail",
            "10 Tageslesungen für Begleithoroskope pro Monat",
            "Wochenlesung für das Haupthoroskop",
            "Detaillierte Karriere- und Erholungsberichte inklusive",
          ],
          action: "Konto erstellen und beginnen",
        },
      },
      comparisonKicker: "Das Berechtigungsregister",
      comparisonTitle: "Sieh genau, was sich auf jeder Stufe verändert.",
      comparisonIntroduction:
        "Grenzen gelten monatlich, sofern kein anderer Rhythmus genannt ist. Der Zugang gehört zum Konto; jedes Horoskop und jeder Bericht bleibt privat.",
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
          free: "Guthabenpaket",
          personal: "Guthabenpaket",
          premium: "10 monatlich",
        },
        {
          feature: "Wöchentliche Hauptlesung",
          free: "Beispiel",
          personal: "Enthalten",
          premium: "Enthalten",
        },
        {
          feature: "E-Mail-Zustellung",
          free: "—",
          personal: "—",
          premium: "Tägliche Hauptlesung",
        },
        {
          feature: "Detaillierte Berichte",
          free: "Standardpreis",
          personal: "10 % Mitgliedspreis",
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
            "Bleibe bei Kostenlos oder tritt der Personal- oder Premium-Liste bei.",
        },
      ],
      pathAction: "Kostenloses Konto erstellen",
      signedInAction: "Meinen Himmelsatlas öffnen",
      reportsAction: "Beispielberichte lesen",
    },
  },
};
