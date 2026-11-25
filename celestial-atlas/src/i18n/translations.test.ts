// Every translation must have exactly the English shape, keep every {placeholder},
// keep glyphs, and avoid banned words.
import { describe, expect, it } from 'vitest';
import { EN } from '../engine/atlas';
import { en } from './strings';

const contentPacks = import.meta.glob<Record<string, unknown>>('./content/*.ts', { eager: true });
const stringTables = import.meta.glob<Record<string, unknown>>('./strings.*.ts', { eager: true });
const BANNED = /parad(o|ó)(x|j)/i;

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function walk(a: Json, b: Json, path: string, out: string[]) {
  if (typeof a === 'string') {
    if (typeof b !== 'string') { out.push(`${path}: expected text`); return; }
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    if (ph(a) !== ph(b)) out.push(`${path}: placeholders ${ph(a)} vs ${ph(b)}`);
    if (!b.trim() && a.trim()) out.push(`${path}: empty`);
    if (BANNED.test(b)) out.push(`${path}: banned word`);
    for (const g of a.match(/[☀-⛿]/g) ?? []) if (!b.includes(g)) out.push(`${path}: glyph ${g} missing`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || b.length !== a.length) { out.push(`${path}: expected ${a.length} items`); return; }
    a.forEach((x, i) => walk(x, b[i], `${path}[${i}]`, out));
    return;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object' || Array.isArray(b)) { out.push(`${path}: expected object`); return; }
    for (const k of Object.keys(a)) if (!(k in b)) out.push(`${path}.${k}: missing`);
    for (const k of Object.keys(b)) if (!(k in a)) out.push(`${path}.${k}: extra`);
    for (const k of Object.keys(a)) if (k in b) walk(a[k], (b as Record<string, Json>)[k], `${path}.${k}`, out);
  }
}

const enJson = JSON.parse(JSON.stringify(EN)) as Json;
const enStrings = JSON.parse(JSON.stringify(en)) as Json;

describe('content packs', () => {
  for (const [file, mod] of Object.entries(contentPacks)) {
    if (file.endsWith('index.ts')) continue;
    it(`${file} matches the English shape`, () => {
      const pack = Object.values(mod)[0] as Json & { locale: string; lowercaseInline: boolean };
      const problems: string[] = [];
      const { locale: _l, lowercaseInline: _c, ...rest } = pack as Record<string, Json>;
      const { locale: _el, lowercaseInline: _ec, ...enRest } = enJson as Record<string, Json>;
      walk(enRest, rest, 'content', problems);
      expect(problems).toEqual([]);
    });
  }
});

describe('UI strings', () => {
  for (const [file, mod] of Object.entries(stringTables)) {
    it(`${file} matches the English shape`, () => {
      const table = Object.values(mod)[0] as Json;
      const problems: string[] = [];
      walk(enStrings, table, 'strings', problems);
      expect(problems).toEqual([]);
    });
  }
});

it('ships Spanish, French and German', () => {
  expect(Object.keys(contentPacks).filter(f => !f.endsWith('index.ts')).sort()).toEqual(['./content/de.ts', './content/es.ts', './content/fr.ts']);
  expect(Object.keys(stringTables).sort()).toEqual(['./strings.de.ts', './strings.es.ts', './strings.fr.ts']);
});
