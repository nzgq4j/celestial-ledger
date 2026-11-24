import type { LocaleTag } from "@/lib/i18n/config";

/**
 * Copy for the redesigned Today screen (Celestial Atlas app layout). English
 * follows the app prototype; the other locales translate it. Placeholders use
 * `{name}` syntax and are filled with `fillCopy`.
 */
export interface TodayCopy {
  insightTitle: string;
  insightMeta: string;
  now: string;
  dismiss: string;
  addBirthTime: string;
  dayKicker: string;
  love: string;
  fullHoroscope: string;
  moonKicker: string;
  moonLit: string;
  numbersKicker: string;
  year: string;
  month: string;
  day: string;
  cardKicker: string;
  cardDrawTitle: string;
  cardDrawCopy: string;
  drawCard: string;
  fullTarot: string;
  upright: string;
  reversed: string;
  allNumbers: string;
}

const enGB: TodayCopy = {
  insightTitle: "Personal Day {day} · Moon in {sign}",
  insightMeta: "Celestial Atlas",
  now: "now",
  dismiss: "Dismiss",
  addBirthTime: "Add birth time",
  dayKicker: "Your day · {sign}",
  love: "Love",
  fullHoroscope: "Full horoscope",
  moonKicker: "Moon tonight",
  moonLit: "{percent}% lit · in {sign}",
  numbersKicker: "Your numbers today",
  year: "Year",
  month: "Month",
  day: "Day",
  cardKicker: "Card of the day",
  cardDrawTitle: "Draw today’s card",
  cardDrawCopy: "One card as a prompt for reflection.",
  drawCard: "Draw a card",
  fullTarot: "Full tarot reading",
  upright: "Upright",
  reversed: "Reversed",
  allNumbers: "All your numbers",
};

const esES: TodayCopy = {
  insightTitle: "Día personal {day} · Luna en {sign}",
  insightMeta: "Celestial Atlas",
  now: "ahora",
  dismiss: "Descartar",
  addBirthTime: "Añade tu hora de nacimiento",
  dayKicker: "Tu día · {sign}",
  love: "Amor",
  fullHoroscope: "Horóscopo completo",
  moonKicker: "La Luna esta noche",
  moonLit: "{percent} % iluminada · en {sign}",
  numbersKicker: "Tus números de hoy",
  year: "Año",
  month: "Mes",
  day: "Día",
  cardKicker: "Carta del día",
  cardDrawTitle: "Saca la carta de hoy",
  cardDrawCopy: "Una carta como punto de partida para reflexionar.",
  drawCard: "Sacar una carta",
  fullTarot: "Tirada de tarot completa",
  upright: "Al derecho",
  reversed: "Invertida",
  allNumbers: "Todos tus números",
};

const frFR: TodayCopy = {
  insightTitle: "Jour personnel {day} · Lune en {sign}",
  insightMeta: "Celestial Atlas",
  now: "maintenant",
  dismiss: "Fermer",
  addBirthTime: "Ajoutez votre heure de naissance",
  dayKicker: "Votre journée · {sign}",
  love: "Amour",
  fullHoroscope: "Horoscope complet",
  moonKicker: "La Lune ce soir",
  moonLit: "Éclairée à {percent} % · en {sign}",
  numbersKicker: "Vos nombres du jour",
  year: "Année",
  month: "Mois",
  day: "Jour",
  cardKicker: "Carte du jour",
  cardDrawTitle: "Tirez la carte du jour",
  cardDrawCopy: "Une carte comme point de départ pour réfléchir.",
  drawCard: "Tirer une carte",
  fullTarot: "Tirage de tarot complet",
  upright: "À l’endroit",
  reversed: "Inversée",
  allNumbers: "Tous vos nombres",
};

const deDE: TodayCopy = {
  insightTitle: "Persönlicher Tag {day} · Mond in {sign}",
  insightMeta: "Celestial Atlas",
  now: "jetzt",
  dismiss: "Schließen",
  addBirthTime: "Geburtszeit ergänzen",
  dayKicker: "Dein Tag · {sign}",
  love: "Liebe",
  fullHoroscope: "Ganzes Horoskop",
  moonKicker: "Der Mond heute Nacht",
  moonLit: "{percent} % beleuchtet · in {sign}",
  numbersKicker: "Deine Zahlen heute",
  year: "Jahr",
  month: "Monat",
  day: "Tag",
  cardKicker: "Karte des Tages",
  cardDrawTitle: "Zieh die Karte des Tages",
  cardDrawCopy: "Eine Karte als Anstoß zum Nachdenken.",
  drawCard: "Karte ziehen",
  fullTarot: "Ganze Tarot-Legung",
  upright: "Aufrecht",
  reversed: "Umgekehrt",
  allNumbers: "Alle deine Zahlen",
};

export const todayCopy: Record<LocaleTag, TodayCopy> = {
  "en-GB": enGB,
  "es-ES": esES,
  "fr-FR": frFR,
  "de-DE": deDE,
};
