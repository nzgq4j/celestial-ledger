import { createContext, useContext } from 'react';
import { en, type Locale, type Strings } from './strings';

export { fill } from './strings';
export type { Locale, Strings } from './strings';

const TABLES: Partial<Record<Locale, Strings>> = { en };

/** Best match for the device language; English otherwise. */
export function detectLocale(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Locale {
  for (const lang of languages) {
    const base = lang.toLowerCase().split('-')[0];
    if (base in TABLES) return base as Locale;
  }
  return 'en';
}

export const stringsFor = (locale: Locale): Strings => TABLES[locale] ?? en;

export const LocaleContext = createContext<Locale>('en');
export const useLocale = (): Locale => useContext(LocaleContext);
export const useStrings = (): Strings => stringsFor(useLocale());
