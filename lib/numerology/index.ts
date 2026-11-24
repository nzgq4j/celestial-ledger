/**
 * Pythagorean numerology, ported from the Celestial Atlas app engine
 * (celestial-atlas/src/engine/atlas.ts) so the website and the app agree.
 * Master numbers 11, 22 and 33 are kept for core numbers; personal cycles
 * always reduce to 1–9.
 */
export const MASTER_NUMBERS = [11, 22, 33] as const;

const digitSum = (n: number) =>
  String(n)
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);

export function reduceNumber(n: number, keepMaster = true): number {
  let value = n;
  while (
    value > 9 &&
    !(keepMaster && (value === 11 || value === 22 || value === 33))
  )
    value = digitSum(value);
  return value;
}

function parseIsoDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError("Expected a YYYY-MM-DD date.");
  return { year: +match[1], month: +match[2], day: +match[3] };
}

/** Life Path from a YYYY-MM-DD birth date. */
export function lifePath(birthDate: string): number {
  const { year, month, day } = parseIsoDate(birthDate);
  return reduceNumber(
    reduceNumber(month) + reduceNumber(day) + reduceNumber(year),
  );
}

/** Birthday number: the day of birth, master numbers kept. */
export function birthdayNumber(birthDate: string): number {
  return reduceNumber(parseIsoDate(birthDate).day);
}

export interface PersonalCycles {
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}

/**
 * Personal year, month and day for a local calendar date (YYYY-MM-DD), usually
 * today's date in the member's chart time zone.
 */
export function personalCycles(
  birthDate: string,
  localDate: string,
): PersonalCycles {
  const birth = parseIsoDate(birthDate);
  const today = parseIsoDate(localDate);
  const personalYear = reduceNumber(
    reduceNumber(birth.month, false) +
      reduceNumber(birth.day, false) +
      reduceNumber(today.year, false),
    false,
  );
  const personalMonth = reduceNumber(personalYear + today.month, false);
  const personalDay = reduceNumber(personalMonth + today.day, false);
  return { personalYear, personalMonth, personalDay };
}
