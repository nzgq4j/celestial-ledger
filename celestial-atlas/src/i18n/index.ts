import { createContext, useContext } from 'react';
import { EN } from '../engine/atlas';
import type { Content } from '../engine/content';
import { LOCALES, en, type Locale, type Strings } from './strings';

export { fill } from './strings';
export type { Locale, Strings } from './strings';
export { LOCALES } from './strings';

// Translations are discovered by file name: strings.<locale>.ts and content/<locale>.ts.
const stringFiles = import.meta.glob<Record<string, Strings>>('./strings.*.ts', { eager: true });
const contentFiles = import.meta.glob<Record<string, Content>>('./content/*.ts', { eager: true });
const localeOf = (file: string) => file.replace(/^.*[/.]([a-z]{2})\.ts$/, '$1');

const TABLES: Partial<Record<Locale, Strings>> = { en };
for (const [file, mod] of Object.entries(stringFiles)) TABLES[localeOf(file) as Locale] = Object.values(mod)[0];
const CONTENT: Partial<Record<Locale, Content>> = { en: EN };
for (const [file, mod] of Object.entries(contentFiles)) CONTENT[localeOf(file) as Locale] = Object.values(mod)[0];

/** Languages with both UI strings and reading content. */
export const AVAILABLE_LOCALES: Locale[] = LOCALES.filter(l => TABLES[l] && CONTENT[l]);

/** Native name of each language, for the language picker. */
export const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' };

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (AVAILABLE_LOCALES as string[]).includes(v);

/** Best match for the device language; English otherwise. */
export function detectLocale(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Locale {
  for (const lang of languages) {
    const base = lang.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return 'en';
}

export const stringsFor = (locale: Locale): Strings => (isLocale(locale) ? TABLES[locale] : undefined) ?? en;
export const contentFor = (locale: Locale): Content => (isLocale(locale) ? CONTENT[locale] : undefined) ?? EN;

export const LocaleContext = createContext<Locale>('en');
export const useLocale = (): Locale => useContext(LocaleContext);
export const useStrings = (): Strings => stringsFor(useLocale());
export const useContent = (): Content => contentFor(useLocale());
