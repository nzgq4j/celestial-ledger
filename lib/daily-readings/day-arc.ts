import type { LocaleTag } from "@/lib/i18n/config";
import type { DailyReadingAnalysis } from "@/lib/daily-readings/domain";
import type { ReadingDayPhase } from "@/components/reports/ReadingDayArc";

const labels: Record<
  LocaleTag,
  { morning: string; noon: string; evening: string }
> = {
  "en-GB": { morning: "Morning", noon: "Noon", evening: "Evening" },
  "es-ES": { morning: "Mañana", noon: "Mediodía", evening: "Noche" },
  "fr-FR": { morning: "Matin", noon: "Midi", evening: "Soir" },
  "de-DE": { morning: "Morgen", noon: "Mittag", evening: "Abend" },
};

const copy: Record<
  LocaleTag,
  {
    begin: (theme: string, phase: string) => string;
    act: (transit: string) => string;
    integrate: (theme: string) => string;
  }
> = {
  "en-GB": {
    begin: (theme, phase) =>
      `Begin with ${theme.toLowerCase()}. The ${phase} sets the underlying rhythm: notice the first clear signal before the day's noise gathers around it.`,
    act: (transit) =>
      `Give the centre of the day to one deliberate move. ${transit} is the strongest active signature, so use its pressure to choose, speak or complete rather than scatter effort.`,
    integrate: (theme) =>
      `Let ${theme.toLowerCase()} become an evening practice. Record what changed, close the loop that can be closed, and leave the remaining question in a form you can meet tomorrow.`,
  },
  "es-ES": {
    begin: (theme, phase) =>
      `Comienza con ${theme.toLowerCase()}. La fase ${phase} marca el ritmo de fondo: reconoce la primera señal clara antes de que el ruido del día la cubra.`,
    act: (transit) =>
      `Dedica el centro del día a un movimiento deliberado. ${transit} es la firma activa más fuerte; usa su impulso para elegir, hablar o completar en vez de dispersar el esfuerzo.`,
    integrate: (theme) =>
      `Convierte ${theme.toLowerCase()} en una práctica vespertina. Anota lo que cambió, cierra lo que pueda cerrarse y deja la pregunta restante preparada para mañana.`,
  },
  "fr-FR": {
    begin: (theme, phase) =>
      `Commencez par ${theme.toLowerCase()}. La phase ${phase} donne le rythme de fond : accueillez le premier signal clair avant que le bruit du jour ne l'entoure.`,
    act: (transit) =>
      `Consacrez le milieu de la journée à un geste délibéré. ${transit} est la signature active la plus forte ; utilisez sa pression pour choisir, dire ou achever plutôt que disperser l'effort.`,
    integrate: (theme) =>
      `Faites de ${theme.toLowerCase()} une pratique du soir. Notez ce qui a changé, fermez la boucle qui peut l'être et donnez à la question restante une forme pour demain.`,
  },
  "de-DE": {
    begin: (theme, phase) =>
      `Beginne mit ${theme.toLowerCase()}. Die Phase ${phase} gibt den Grundrhythmus vor: Nimm das erste klare Signal wahr, bevor der Lärm des Tages es überlagert.`,
    act: (transit) =>
      `Gib der Mitte des Tages einen bewussten Schritt. ${transit} ist die stärkste aktive Signatur; nutze ihre Spannung, um zu wählen, auszusprechen oder abzuschließen, statt Kraft zu zerstreuen.`,
    integrate: (theme) =>
      `Lass ${theme.toLowerCase()} zu einer Abendpraxis werden. Halte fest, was sich verändert hat, schließe den möglichen Kreis und gib der offenen Frage eine Form für morgen.`,
  },
};

function level(value: number): 1 | 2 | 3 {
  if (value >= 0.78) return 3;
  if (value >= 0.56) return 2;
  return 1;
}

export function buildDailyReadingDayArc(
  analysis: DailyReadingAnalysis,
): ReadingDayPhase[] {
  const locale = analysis.locale;
  const leading = analysis.themes[0];
  const integrating = analysis.themes[1] ?? leading;
  const transit = [...analysis.transits].sort(
    (a, b) => b.strength - a.strength,
  )[0];
  const lunarEvidence = [analysis.lunarPhase.evidenceId];
  const transitLabel = transit
    ? `Transiting ${transit.transitingBody} ${transit.aspect.toLowerCase()} natal ${transit.natalTarget}`
    : leading.label;

  return [
    {
      period: "morning",
      label: labels[locale].morning,
      title: leading.label,
      guidance: copy[locale].begin(leading.label, analysis.lunarPhase.name),
      level: level((leading.relevance + analysis.lunarPhase.illumination) / 2),
      evidenceIds: [...new Set([...leading.evidenceIds, ...lunarEvidence])],
    },
    {
      period: "noon",
      label: labels[locale].noon,
      title: transitLabel,
      guidance: copy[locale].act(transitLabel),
      level: level(transit?.strength ?? leading.intensity),
      evidenceIds: transit ? [transit.evidenceId] : leading.evidenceIds,
    },
    {
      period: "evening",
      label: labels[locale].evening,
      title: integrating.label,
      guidance: copy[locale].integrate(integrating.label),
      level: level((integrating.relevance + integrating.intensity) / 2),
      evidenceIds: integrating.evidenceIds,
    },
  ];
}
