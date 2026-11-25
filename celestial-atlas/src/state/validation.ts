// Input checks for onboarding and the profile form.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MIN_DATE = '1800-01-01';

export const todayISO = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** A real calendar date between 1800-01-01 and today. */
export function validDate(d: string | null | undefined, now: Date = new Date()): boolean {
  if (!d || !DATE_RE.test(d)) return false;
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== day) return false;
  return d >= MIN_DATE && d <= todayISO(now);
}

const letters = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

/**
 * Numerology needs at least one vowel (Soul Urge) and one consonant (Personality);
 * without them those numbers come out as 0, which has no meaning.
 * Returns a problem code for the interface to explain, or null when the name is usable.
 */
export type NameProblem = 'noVowel' | 'noConsonant';
export function nameProblem(name: string): NameProblem | null {
  const l = letters(name);
  if (name.trim().length < 2 || l.length < 2) return null; // the Continue button stays disabled
  if (!/[aeiou]/.test(l)) return 'noVowel';
  if (!/[^aeiou]/.test(l)) return 'noConsonant';
  return null;
}

export const nameUsable = (name: string): boolean => name.trim().length >= 2 && letters(name).length >= 2 && nameProblem(name) === null;
