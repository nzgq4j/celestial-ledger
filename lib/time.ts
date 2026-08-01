import type { BirthInput } from "./types";

export class HistoricalTimeError extends Error {
  constructor(public code: "AMBIGUOUS" | "NONEXISTENT" | "INVALID", message: string) {
    super(message);
  }
}

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

function zonedParts(epochMs: number, timeZone: string): Parts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(epochMs));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

function sameParts(a: Parts, b: Parts) {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.minute === b.minute;
}

export function resolveLocalDateTime(parts: Parts, timeZone: string): number[] {
  try { new Intl.DateTimeFormat("en", { timeZone }).format(); } catch { throw new HistoricalTimeError("INVALID", "The resolved historical time zone is invalid."); }
  const naiveUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const matches: number[] = [];
  for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 15) {
    const candidate = naiveUtc - offsetMinutes * 60_000;
    if (sameParts(zonedParts(candidate, timeZone), parts)) matches.push(candidate);
  }
  return [...new Set(matches)].sort((a, b) => a - b);
}

export function localBirthTimeToUtc(input: BirthInput): string {
  const [year, month, day] = input.date.split("-").map(Number);
  const time = input.timeUnknown ? "12:00" : input.time;
  if (![year, month, day].every(Number.isFinite) || !time) throw new HistoricalTimeError("INVALID", "Enter a valid birth date and time.");
  const [hour, minute] = time.split(":").map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new HistoricalTimeError("INVALID", "Enter a valid birth time.");
  const matches = resolveLocalDateTime({ year, month, day, hour, minute }, input.place.timeZone);
  if (matches.length === 0) throw new HistoricalTimeError("NONEXISTENT", "This local time did not exist because the clock moved forward. Check the recorded time.");
  if (matches.length > 1 && !input.disambiguation) throw new HistoricalTimeError("AMBIGUOUS", "This local time occurred twice because the clock moved backward. Select the earlier or later occurrence.");
  const chosen = matches.length === 1 ? matches[0] : matches[input.disambiguation === "later" ? matches.length - 1 : 0];
  return new Date(chosen).toISOString();
}
