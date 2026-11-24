import type { LocaleTag } from "@/lib/i18n/config";

/** Copy for the /numbers page. English follows the Celestial Atlas app. */
export interface NumbersPageCopy {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lifePath: string;
  lifePathFrame: string;
  birthday: string;
  birthdayFrame: string;
  cyclesKicker: string;
  personalYear: string;
  personalMonth: string;
  personalDay: string;
  today: string;
  monthTheme: string;
  formLabel: string;
  formSubmit: string;
  formNote: string;
  fromChart: string;
}

const enGB: NumbersPageCopy = {
  metaTitle: "Your Numbers: Life Path and personal cycles",
  metaDescription:
    "Find your Life Path and Birthday numbers and your personal year, month and day, calculated from your birth date.",
  eyebrow: "Numerology",
  title: "Your Numbers",
  lifePath: "Life Path",
  lifePathFrame:
    "Your core direction — the lessons and strengths you keep returning to. Calculated from your full birth date.",
  birthday: "Birthday",
  birthdayFrame:
    "A specific gift that comes easily to you. Calculated from the day you were born.",
  cyclesKicker: "Cycles",
  personalYear: "Personal Year",
  personalMonth: "Personal Month",
  personalDay: "Personal Day",
  today: "Today",
  monthTheme: "This month's theme: {text}",
  formLabel: "Your birth date",
  formSubmit: "Show my numbers",
  formNote: "Calculated in your browser. Nothing is sent or saved.",
  fromChart: "From your chart · {name}",
};

const esES: NumbersPageCopy = {
  metaTitle: "Tus números: camino de vida y ciclos personales",
  metaDescription:
    "Descubre tu número del camino de vida y de cumpleaños, y tu año, mes y día personales, calculados a partir de tu fecha de nacimiento.",
  eyebrow: "Numerología",
  title: "Tus números",
  lifePath: "Camino de vida",
  lifePathFrame:
    "Tu dirección esencial: las lecciones y fortalezas a las que vuelves una y otra vez. Se calcula a partir de tu fecha de nacimiento completa.",
  birthday: "Cumpleaños",
  birthdayFrame:
    "Un don concreto que te resulta natural. Se calcula a partir del día en que naciste.",
  cyclesKicker: "Ciclos",
  personalYear: "Año personal",
  personalMonth: "Mes personal",
  personalDay: "Día personal",
  today: "Hoy",
  monthTheme: "El tema de este mes: {text}",
  formLabel: "Tu fecha de nacimiento",
  formSubmit: "Ver mis números",
  formNote: "Se calcula en tu navegador. No se envía ni se guarda nada.",
  fromChart: "Según tu carta · {name}",
};

const frFR: NumbersPageCopy = {
  metaTitle: "Vos nombres : chemin de vie et cycles personnels",
  metaDescription:
    "Découvrez vos nombres du chemin de vie et d’anniversaire, ainsi que votre année, votre mois et votre jour personnels, calculés à partir de votre date de naissance.",
  eyebrow: "Numérologie",
  title: "Vos nombres",
  lifePath: "Chemin de vie",
  lifePathFrame:
    "Votre direction essentielle : les leçons et les forces vers lesquelles vous revenez sans cesse. Calculé à partir de votre date de naissance complète.",
  birthday: "Anniversaire",
  birthdayFrame:
    "Un talent précis qui vous vient naturellement. Calculé à partir du jour de votre naissance.",
  cyclesKicker: "Cycles",
  personalYear: "Année personnelle",
  personalMonth: "Mois personnel",
  personalDay: "Jour personnel",
  today: "Aujourd’hui",
  monthTheme: "Le thème du mois : {text}",
  formLabel: "Votre date de naissance",
  formSubmit: "Voir mes nombres",
  formNote: "Calculé dans votre navigateur. Rien n’est envoyé ni enregistré.",
  fromChart: "D’après votre thème · {name}",
};

const deDE: NumbersPageCopy = {
  metaTitle: "Deine Zahlen: Lebenszahl und persönliche Zyklen",
  metaDescription:
    "Finde deine Lebenszahl und Geburtstagszahl sowie dein persönliches Jahr, deinen Monat und deinen Tag, berechnet aus deinem Geburtsdatum.",
  eyebrow: "Numerologie",
  title: "Deine Zahlen",
  lifePath: "Lebenszahl",
  lifePathFrame:
    "Deine Grundrichtung – die Lektionen und Stärken, zu denen du immer wieder zurückkehrst. Berechnet aus deinem vollständigen Geburtsdatum.",
  birthday: "Geburtstagszahl",
  birthdayFrame:
    "Eine besondere Gabe, die dir leichtfällt. Berechnet aus deinem Geburtstag.",
  cyclesKicker: "Zyklen",
  personalYear: "Persönliches Jahr",
  personalMonth: "Persönlicher Monat",
  personalDay: "Persönlicher Tag",
  today: "Heute",
  monthTheme: "Das Thema dieses Monats: {text}",
  formLabel: "Dein Geburtsdatum",
  formSubmit: "Meine Zahlen zeigen",
  formNote:
    "Wird in deinem Browser berechnet. Nichts wird gesendet oder gespeichert.",
  fromChart: "Aus deinem Horoskop · {name}",
};

export const numbersPageCopy: Record<LocaleTag, NumbersPageCopy> = {
  "en-GB": enGB,
  "es-ES": esES,
  "fr-FR": frFR,
  "de-DE": deDE,
};
