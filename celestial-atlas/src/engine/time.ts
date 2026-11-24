// Converts a historical local birth time to UTC with the IANA time-zone database
// (luxon + Intl), so daylight saving time is applied automatically.
import { DateTime } from 'luxon';

export type Disambiguation = 'earlier' | 'later';

export type TimeResolution =
  /** The local time existed exactly once. */
  | 'exact'
  /** The local time occurred twice (clocks went back); the earlier or later instant was chosen. */
  | 'ambiguous-earlier'
  | 'ambiguous-later'
  /** Birth time unknown: local noon is used only as a date anchor. */
  | 'noon-anchor';

export type BirthTimeProblem = 'NONEXISTENT' | 'AMBIGUOUS' | 'INVALID';

export class BirthTimeError extends Error {
  readonly code: BirthTimeProblem;
  constructor(code: BirthTimeProblem, message: string) {
    super(message);
    this.code = code;
    this.name = 'BirthTimeError';
  }
}

export interface ResolvedTime {
  utc: Date;
  resolution: TimeResolution;
  /** UTC offset in minutes at the chosen instant. */
  offsetMinutes: number;
  /** Every UTC instant that matches the local wall time (2 when ambiguous). */
  candidates: Date[];
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

function parse(date: string, time: string) {
  const d = DATE_RE.exec(date), t = TIME_RE.exec(time);
  if (!d || !t) throw new BirthTimeError('INVALID', 'Enter a valid birth date and time.');
  const [year, month, day, hour, minute] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  if (hour > 23 || minute > 59) throw new BirthTimeError('INVALID', 'Enter a valid birth time.');
  return { year, month, day, hour, minute };
}

/** All UTC instants whose wall-clock time in `zone` equals the given local time. */
export function localTimeCandidates(date: string, time: string, zone: string): Date[] {
  const parts = parse(date, time);
  if (!DateTime.local(2000, 1, 1, { zone }).isValid) throw new BirthTimeError('INVALID', 'The birthplace time zone is not recognised.');
  const naive = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  if (DateTime.fromMillis(naive, { zone: 'utc' }).toISODate() !== date) throw new BirthTimeError('INVALID', 'Enter a valid birth date.');
  // Collect every offset the zone used within two days of the date, then keep the
  // instants whose local wall time matches exactly.
  const offsets = new Set<number>();
  for (let h = -48; h <= 48; h += 3) offsets.add(DateTime.fromMillis(naive + h * 3_600_000, { zone }).offset);
  const matches = new Set<number>();
  for (const off of offsets) {
    const candidate = naive - off * 60_000;
    const local = DateTime.fromMillis(candidate, { zone });
    if (local.year === parts.year && local.month === parts.month && local.day === parts.day
      && local.hour === parts.hour && local.minute === parts.minute) matches.add(candidate);
  }
  return [...matches].sort((a, b) => a - b).map(ms => new Date(ms));
}

export function resolveBirthTime(
  input: { date: string; time: string; timeUnknown: boolean; disambiguation?: Disambiguation },
  zone: string,
): ResolvedTime {
  const unknown = input.timeUnknown || !input.time;
  const candidates = localTimeCandidates(input.date, unknown ? '12:00' : input.time, zone);
  if (candidates.length === 0) {
    throw new BirthTimeError('NONEXISTENT', 'This local time did not exist because the clock moved forward. Check the recorded time.');
  }
  let resolution: TimeResolution = unknown ? 'noon-anchor' : 'exact';
  let utc = candidates[0];
  if (candidates.length > 1) {
    if (unknown) {
      utc = candidates[0];
    } else if (!input.disambiguation) {
      throw new BirthTimeError('AMBIGUOUS', 'This local time occurred twice because the clock moved backward. Select the earlier or later occurrence.');
    } else {
      utc = input.disambiguation === 'later' ? candidates[candidates.length - 1] : candidates[0];
      resolution = input.disambiguation === 'later' ? 'ambiguous-later' : 'ambiguous-earlier';
    }
  }
  return { utc, resolution, offsetMinutes: DateTime.fromJSDate(utc, { zone }).offset, candidates };
}

/** Check a birth time without throwing: returns the problem code, or null when it resolves. */
export function birthTimeProblem(
  input: { date: string; time: string; timeUnknown: boolean; disambiguation?: Disambiguation },
  zone: string,
): BirthTimeProblem | null {
  try { resolveBirthTime(input, zone); return null; }
  catch (e) { if (e instanceof BirthTimeError) return e.code; throw e; }
}
