import { z } from "zod";
import type { LocaleTag } from "@/lib/i18n/config";

export const dailyAllowanceSchema = z.object({
  status: z.enum([
    "available",
    "allowance_exhausted",
    "profile_unavailable",
    "not_included",
  ]),
  allowance: z.number().int().nonnegative().nullable().optional(),
  remaining: z.number().int().nonnegative().nullable().optional(),
  resetsAt: z.string().datetime({ offset: true }).optional(),
});
export type DailyAllowance = z.infer<typeof dailyAllowanceSchema>;

const labels = {
  "en-GB": {
    unavailable: "Allowance unavailable",
    unlimited: "Unlimited access",
    remaining: "remaining",
    resets: "Resets",
  },
  "es-ES": {
    unavailable: "Cupo no disponible",
    unlimited: "Acceso ilimitado",
    remaining: "disponibles",
    resets: "Se renueva",
  },
  "fr-FR": {
    unavailable: "Quota indisponible",
    unlimited: "Accès illimité",
    remaining: "restantes",
    resets: "Renouvellement",
  },
  "de-DE": {
    unavailable: "Kontingent nicht verfügbar",
    unlimited: "Unbegrenzter Zugang",
    remaining: "verbleibend",
    resets: "Erneuerung",
  },
};

export function dailyAllowanceLabel(
  access: DailyAllowance | undefined,
  locale: LocaleTag,
): string {
  const copy = labels[locale];
  if (!access || access.remaining === undefined) return copy.unavailable;
  if (access.remaining === null) return copy.unlimited;
  const reset = access.resetsAt
    ? ` · ${copy.resets}: ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(access.resetsAt))} UTC`
    : "";
  return `${access.remaining} / ${access.allowance} ${copy.remaining}${reset}`;
}
