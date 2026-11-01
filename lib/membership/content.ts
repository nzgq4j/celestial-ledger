import type { LocaleTag } from "@/lib/i18n/config";
import type { MembershipPlanId } from "@/lib/membership/plans";

/**
 * Reader-facing membership copy. Two levels only: Free and Atlas. The paid
 * level is always called "Atlas" (database key `premium`); never "Premium"
 * or "Personal". Prices and allowances must match lib/membership/plans.ts.
 */
export type MembershipTierId = MembershipPlanId;

type TierCopy = {
  name: string;
  badge: string;
  price: string;
  cadence: string;
  /** The one-line promise shown in the inset box. */
  rhythm: string;
  /** Short daily-reading summary for account and allowance views. */
  dailyReading: string;
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
    kicker: string;
    title: string;
    introduction: string;
    footnote: string;
    unavailable: string;
    tiersLabel: string;
    tiers: Record<MembershipTierId, TierCopy>;
    interval: {
      label: string;
      month: string;
      year: string;
      monthCadence: string;
      yearCadence: string;
      /** `{percent}` is replaced with the whole-percent saving. */
      yearlySaving: string;
      /** `{price}` is replaced with the monthly equivalent. */
      yearlyEquivalent: string;
    };
    startTrial: string;
    upgrade: string;
    currentPlan: string;
    manage: string;
    openAccount: string;
  };
  actions: {
    openingCheckout: string;
    checkoutFailed: string;
    openingBilling: string;
    billingFailed: string;
    purchase: string;
    useIncludedReport: string;
    createChart: string;
  };
  claim: {
    confirming: string;
    confirmed: string;
    slow: string;
    retry: string;
    failed: string;
  };
};

export const membershipCopy: Record<LocaleTag, MembershipCopy> = {
  "en-GB": {
    landing: {
      kicker: "Three ways into the atlas",
      title: "Follow today’s sky. Then ask the deeper question.",
      introduction:
        "Begin with the shared celestial weather, widen the view across the week, or bring the moving sky into direct conversation with your natal chart.",
      membershipAction: "Compare Free and Atlas",
      membershipNote:
        "Your chart is free. Atlas adds a personal reading every morning, a weekly reading every Monday and the full tarot table.",
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
      kicker: "Membership",
      title: "Your chart is free. Your daily sky is Atlas.",
      introduction:
        "Free gives you your chart: who you are. Atlas gives you a reading every morning about what’s happening to you now.",
      footnote:
        "All prices in USD. Cancel anytime; your chart and saved readings stay with your free account.",
      unavailable:
        "Atlas membership is not yet available. You can still create a free account and keep your chart.",
      tiersLabel: "Membership levels",
      tiers: {
        free: {
          name: "Free",
          badge: "Your chart",
          price: "$0",
          cadence: "forever",
          rhythm:
            "Who you are: your full natal chart, plus one personal reading a week",
          dailyReading: "1 personal daily reading each week",
          features: [
            "1 saved natal chart with full interpretation",
            "All 12 daily sun-sign horoscopes",
            "One-card daily tarot draw",
            "1 personal daily reading each week",
            "Detailed reports at standard price",
          ],
          action: "Create free account",
        },
        atlas: {
          name: "Atlas",
          badge: "Your sky, daily",
          price: "$12.99",
          cadence: "per month · or $99/yr",
          rhythm:
            "What’s happening to you now: a personal reading every morning",
          dailyReading: "Daily personal reading for your primary chart",
          features: [
            "Daily personal reading for your chart",
            "Weekly reading every Monday",
            "5 saved charts + 10 companion readings a month",
            "All five tarot spreads, journal included",
            "One detailed report included each year, 20% off the rest",
          ],
          action: "Start 7-day free trial",
        },
      },
      interval: {
        label: "Billing period",
        month: "Monthly",
        year: "Yearly",
        monthCadence: "per month",
        yearCadence: "per year",
        yearlySaving: "Save {percent}%",
        yearlyEquivalent: "{price} a month, billed yearly",
      },
      startTrial: "Start 7-day free trial",
      upgrade: "Upgrade to Atlas",
      currentPlan: "Your current plan",
      manage: "Manage membership",
      openAccount: "Open my atlas",
    },
    actions: {
      openingCheckout: "Opening secure checkout…",
      checkoutFailed: "Checkout could not be opened.",
      openingBilling: "Opening billing…",
      billingFailed: "Billing could not be opened.",
      purchase: "Purchase",
      useIncludedReport: "Use your included report",
      createChart: "Create my natal chart",
    },
    claim: {
      confirming: "Confirming your membership…",
      confirmed: "Your membership is confirmed. Preparing your private atlas…",
      slow: "This is taking longer than expected. Your payment is safe; try confirmation again.",
      retry: "Try confirmation again",
      failed: "Your membership could not be confirmed.",
    },
  },
  "es-ES": {
    landing: {
      kicker: "Tres caminos hacia el atlas",
      title: "Sigue el cielo de hoy. Después plantea la pregunta profunda.",
      introduction:
        "Comienza con el clima celeste compartido, amplía la mirada a la semana o pon el cielo en movimiento en conversación directa con tu carta natal.",
      membershipAction: "Comparar Free y Atlas",
      membershipNote:
        "Tu carta es gratuita. Atlas añade una lectura personal cada mañana, una lectura semanal cada lunes y todas las tiradas de tarot.",
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
      kicker: "Membresía",
      title: "Tu carta es gratuita. Tu cielo diario es Atlas.",
      introduction:
        "Free te da tu carta: quién eres. Atlas te da cada mañana una lectura sobre lo que te está pasando ahora.",
      footnote:
        "Todos los precios en USD. Cancela cuando quieras; tu carta y tus lecturas guardadas permanecen en tu cuenta gratuita.",
      unavailable:
        "La membresía Atlas aún no está disponible. Puedes crear una cuenta gratuita y conservar tu carta.",
      tiersLabel: "Niveles de membresía",
      tiers: {
        free: {
          name: "Free",
          badge: "Tu carta",
          price: "$0",
          cadence: "para siempre",
          rhythm:
            "Quién eres: tu carta natal completa y una lectura personal a la semana",
          dailyReading: "1 lectura diaria personal cada semana",
          features: [
            "1 carta natal guardada con interpretación completa",
            "Los 12 horóscopos solares diarios",
            "Tirada diaria de tarot de una carta",
            "1 lectura diaria personal cada semana",
            "Informes detallados a precio estándar",
          ],
          action: "Crear cuenta gratuita",
        },
        atlas: {
          name: "Atlas",
          badge: "Tu cielo, cada día",
          price: "$12.99",
          cadence: "al mes · o $99 al año",
          rhythm:
            "Lo que te está pasando ahora: una lectura personal cada mañana",
          dailyReading: "Lectura personal diaria para tu carta principal",
          features: [
            "Lectura personal diaria para tu carta",
            "Lectura semanal cada lunes",
            "5 cartas guardadas + 10 lecturas de acompañantes al mes",
            "Las cinco tiradas de tarot, con diario incluido",
            "Un informe detallado incluido cada año y un 20 % de descuento en los demás",
          ],
          action: "Empezar la prueba gratuita de 7 días",
        },
      },
      interval: {
        label: "Periodo de facturación",
        month: "Mensual",
        year: "Anual",
        monthCadence: "al mes",
        yearCadence: "al año",
        yearlySaving: "Ahorra un {percent} %",
        yearlyEquivalent: "{price} al mes, facturado anualmente",
      },
      startTrial: "Empezar la prueba gratuita de 7 días",
      upgrade: "Pasar a Atlas",
      currentPlan: "Tu plan actual",
      manage: "Gestionar membresía",
      openAccount: "Abrir mi atlas",
    },
    actions: {
      openingCheckout: "Abriendo el pago seguro…",
      checkoutFailed: "No se pudo abrir el pago.",
      openingBilling: "Abriendo la facturación…",
      billingFailed: "No se pudo abrir la facturación.",
      purchase: "Comprar",
      useIncludedReport: "Usar tu informe incluido",
      createChart: "Crear mi carta natal",
    },
    claim: {
      confirming: "Confirmando tu membresía…",
      confirmed: "Tu membresía está confirmada. Preparando tu atlas privado…",
      slow: "Está tardando más de lo previsto. Tu pago está a salvo; vuelve a intentar la confirmación.",
      retry: "Volver a intentar la confirmación",
      failed: "No se pudo confirmar tu membresía.",
    },
  },
  "fr-FR": {
    landing: {
      kicker: "Trois chemins dans l’atlas",
      title: "Suivez le ciel du jour. Posez ensuite la question profonde.",
      introduction:
        "Commencez par le climat céleste commun, élargissez le regard à la semaine ou mettez le ciel en mouvement en dialogue direct avec votre thème natal.",
      membershipAction: "Comparer Free et Atlas",
      membershipNote:
        "Votre thème est gratuit. Atlas ajoute une lecture personnelle chaque matin, une lecture hebdomadaire chaque lundi et tous les tirages de tarot.",
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
      kicker: "Adhésion",
      title: "Votre thème est gratuit. Votre ciel quotidien, c’est Atlas.",
      introduction:
        "Free vous donne votre thème : qui vous êtes. Atlas vous donne chaque matin une lecture de ce qui vous arrive maintenant.",
      footnote:
        "Tous les prix sont en USD. Résiliable à tout moment ; votre thème et vos lectures enregistrées restent dans votre compte gratuit.",
      unavailable:
        "L’adhésion Atlas n’est pas encore disponible. Vous pouvez créer un compte gratuit et conserver votre thème.",
      tiersLabel: "Niveaux d’adhésion",
      tiers: {
        free: {
          name: "Free",
          badge: "Votre thème",
          price: "$0",
          cadence: "pour toujours",
          rhythm:
            "Qui vous êtes : votre thème natal complet et une lecture personnelle par semaine",
          dailyReading: "1 lecture quotidienne personnelle par semaine",
          features: [
            "1 thème natal enregistré avec interprétation complète",
            "Les 12 horoscopes solaires quotidiens",
            "Tirage de tarot quotidien à une carte",
            "1 lecture quotidienne personnelle par semaine",
            "Rapports détaillés au prix standard",
          ],
          action: "Créer un compte gratuit",
        },
        atlas: {
          name: "Atlas",
          badge: "Votre ciel, chaque jour",
          price: "$12.99",
          cadence: "par mois · ou $99 par an",
          rhythm:
            "Ce qui vous arrive maintenant : une lecture personnelle chaque matin",
          dailyReading:
            "Lecture personnelle quotidienne pour votre thème principal",
          features: [
            "Lecture personnelle quotidienne pour votre thème",
            "Lecture hebdomadaire chaque lundi",
            "5 thèmes enregistrés + 10 lectures de proches par mois",
            "Les cinq tirages de tarot, journal inclus",
            "Un rapport détaillé inclus chaque année, 20 % de remise sur les suivants",
          ],
          action: "Commencer l’essai gratuit de 7 jours",
        },
      },
      interval: {
        label: "Période de facturation",
        month: "Mensuel",
        year: "Annuel",
        monthCadence: "par mois",
        yearCadence: "par an",
        yearlySaving: "Économisez {percent} %",
        yearlyEquivalent: "{price} par mois, facturé annuellement",
      },
      startTrial: "Commencer l’essai gratuit de 7 jours",
      upgrade: "Passer à Atlas",
      currentPlan: "Votre formule actuelle",
      manage: "Gérer l’adhésion",
      openAccount: "Ouvrir mon atlas",
    },
    actions: {
      openingCheckout: "Ouverture du paiement sécurisé…",
      checkoutFailed: "Le paiement n’a pas pu s’ouvrir.",
      openingBilling: "Ouverture de la facturation…",
      billingFailed: "La facturation n’a pas pu s’ouvrir.",
      purchase: "Acheter",
      useIncludedReport: "Utiliser votre rapport inclus",
      createChart: "Créer mon thème natal",
    },
    claim: {
      confirming: "Confirmation de votre adhésion…",
      confirmed:
        "Votre adhésion est confirmée. Préparation de votre atlas privé…",
      slow: "Cela prend plus de temps que prévu. Votre paiement est en sécurité ; relancez la confirmation.",
      retry: "Relancer la confirmation",
      failed: "Votre adhésion n’a pas pu être confirmée.",
    },
  },
  "de-DE": {
    landing: {
      kicker: "Drei Wege in den Atlas",
      title: "Folge dem heutigen Himmel. Stelle dann die tiefere Frage.",
      introduction:
        "Beginne mit dem gemeinsamen Himmelswetter, weite den Blick über die Woche oder bringe den bewegten Himmel in direkten Dialog mit deinem Geburtshoroskop.",
      membershipAction: "Free und Atlas vergleichen",
      membershipNote:
        "Dein Horoskop ist kostenlos. Atlas ergänzt jeden Morgen eine persönliche Lesung, jeden Montag eine Wochenlesung und alle Tarot-Legungen.",
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
      kicker: "Mitgliedschaft",
      title: "Dein Horoskop ist kostenlos. Dein täglicher Himmel ist Atlas.",
      introduction:
        "Free gibt dir dein Horoskop: wer du bist. Atlas gibt dir jeden Morgen eine Lesung darüber, was gerade mit dir geschieht.",
      footnote:
        "Alle Preise in USD. Jederzeit kündbar; dein Horoskop und deine gespeicherten Lesungen bleiben in deinem kostenlosen Konto.",
      unavailable:
        "Die Atlas-Mitgliedschaft ist noch nicht verfügbar. Du kannst ein kostenloses Konto erstellen und dein Horoskop behalten.",
      tiersLabel: "Mitgliedschaftsstufen",
      tiers: {
        free: {
          name: "Free",
          badge: "Dein Horoskop",
          price: "$0",
          cadence: "für immer",
          rhythm:
            "Wer du bist: dein vollständiges Geburtshoroskop und eine persönliche Lesung pro Woche",
          dailyReading: "1 persönliche Tageslesung pro Woche",
          features: [
            "1 gespeichertes Geburtshoroskop mit vollständiger Deutung",
            "Alle 12 täglichen Sonnenzeichen-Horoskope",
            "Tägliche Tarotkarte",
            "1 persönliche Tageslesung pro Woche",
            "Detaillierte Berichte zum Standardpreis",
          ],
          action: "Kostenloses Konto erstellen",
        },
        atlas: {
          name: "Atlas",
          badge: "Dein Himmel, täglich",
          price: "$12.99",
          cadence: "pro Monat · oder $99 pro Jahr",
          rhythm:
            "Was gerade mit dir geschieht: jeden Morgen eine persönliche Lesung",
          dailyReading: "Tägliche persönliche Lesung für dein Haupthoroskop",
          features: [
            "Tägliche persönliche Lesung für dein Horoskop",
            "Wochenlesung jeden Montag",
            "5 gespeicherte Horoskope + 10 Begleitlesungen pro Monat",
            "Alle fünf Tarot-Legungen, Journal inklusive",
            "Ein detaillierter Bericht pro Jahr inklusive, 20 % Rabatt auf alle weiteren",
          ],
          action: "7 Tage kostenlos testen",
        },
      },
      interval: {
        label: "Abrechnungszeitraum",
        month: "Monatlich",
        year: "Jährlich",
        monthCadence: "pro Monat",
        yearCadence: "pro Jahr",
        yearlySaving: "{percent} % sparen",
        yearlyEquivalent: "{price} pro Monat, jährlich abgerechnet",
      },
      startTrial: "7 Tage kostenlos testen",
      upgrade: "Zu Atlas wechseln",
      currentPlan: "Dein aktueller Plan",
      manage: "Mitgliedschaft verwalten",
      openAccount: "Meinen Atlas öffnen",
    },
    actions: {
      openingCheckout: "Sichere Zahlung wird geöffnet…",
      checkoutFailed: "Die Zahlung konnte nicht geöffnet werden.",
      openingBilling: "Abrechnung wird geöffnet…",
      billingFailed: "Die Abrechnung konnte nicht geöffnet werden.",
      purchase: "Kaufen",
      useIncludedReport: "Inklusivbericht verwenden",
      createChart: "Mein Geburtshoroskop erstellen",
    },
    claim: {
      confirming: "Deine Mitgliedschaft wird bestätigt…",
      confirmed:
        "Deine Mitgliedschaft ist bestätigt. Dein privater Atlas wird vorbereitet…",
      slow: "Das dauert länger als erwartet. Deine Zahlung ist sicher; versuche die Bestätigung erneut.",
      retry: "Bestätigung erneut versuchen",
      failed: "Deine Mitgliedschaft konnte nicht bestätigt werden.",
    },
  },
};

/** Fills `{name}` placeholders in membership copy. */
export function fillMembershipCopy(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
