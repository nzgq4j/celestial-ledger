// Drives the built app in Chromium: onboarding, every screen, the paywall, axe checks and screenshots.
// Usage: npm run build && npx vite preview --port 4173 & node e2e/smoke.mjs [outDir]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // the preinstalled Playwright resolves through require()
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';

const out = process.argv[2] || 'e2e/out';
fs.mkdirSync(out, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 1, timezoneId: 'Europe/Paris', locale: 'en-US' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const violations = [];
async function axe(name) {
  await page.waitForTimeout(900); // let fade-in animations finish so contrast is measured at full opacity
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  for (const v of r.violations) violations.push({ screen: name, id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, sample: v.nodes[0]?.target?.join(' '), data: v.nodes[0]?.any?.[0]?.data });
}
const shot = name => page.screenshot({ path: `${out}/${name}.png`, fullPage: true });

await page.goto(BASE);
await page.getByText('Build my atlas').waitFor({ timeout: 8000 });
await axe('welcome'); await shot('01-welcome');
await page.getByText('Build my atlas').click();
await page.getByLabel("What's your full birth name?").fill('Amelia Rose Laurent');
await axe('onboarding-name');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Date of birth').fill('1991-07-28');
await page.getByLabel('Time of birth').fill('06:45');
await axe('onboarding-date'); await shot('02-date');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('combobox').fill('Avignon');
await page.getByRole('option').first().click();
await page.getByText(/Time zone Europe\/Paris/).waitFor();
await axe('onboarding-place'); await shot('03-place');
await page.getByRole('button', { name: 'Create my atlas' }).click();
await page.getByText('Good morning, Amelia.').or(page.getByText(/Good (afternoon|evening), Amelia\./)).waitFor();
await axe('today'); await shot('04-today');

const tab = name => page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name });
await tab('Stars').click();
await axe('stars-horoscope'); await shot('05-horoscope');
await page.getByRole('tab', { name: 'Birth chart' }).click();
await page.locator('svg[role=img]').waitFor();
await axe('stars-chart'); await shot('06-chart');
await page.getByRole('tab', { name: 'Transits & moon' }).click();
await axe('stars-transits'); await shot('07-transits');
await page.getByRole('tab', { name: 'Compatibility' }).click();
await axe('stars-compat');

await tab('Numbers').click();
await axe('numbers'); await shot('08-numbers');
await page.getByRole('tab', { name: 'Cycles' }).click(); await axe('numbers-cycles');
await page.getByRole('tab', { name: 'Compatibility' }).click();
await page.getByLabel('Their birth date').fill('1988-03-14');
await axe('numbers-compat');

await tab('Tarot').click();
await axe('tarot-decks'); await shot('09-tarot-decks');
for (const deck of ['Traditional', 'The Whimsical Cats', 'Neon Circuit', 'Provençal', 'Silver Age']) {
  await tab('Tarot').click();
  if (await page.getByRole('button', { name: 'Start Over' }).isVisible()) await page.getByRole('button', { name: 'Start Over' }).click();
  await page.getByRole('button', { name: new RegExp(deck) }).first().click();
  await page.getByRole('button', { name: /Past, Present, Future/ }).click();
  await page.getByText('Your Reading').waitFor({ timeout: 5000 });
  await axe(`tarot-result-${deck}`);
  if (deck === 'Traditional') await shot('10-tarot-result');
}
await page.getByRole('button', { name: 'Save to journal' }).click();

await page.getByRole('button', { name: 'Atlas+' }).first().click();
await page.getByRole('dialog').waitFor();
await axe('paywall'); await shot('11-paywall');
await page.getByRole('button', { name: 'Start 3-day free trial' }).click();

await tab('Today').click();
await page.getByRole('button', { name: /Read my report/ }).click();
await page.getByText('Three cards for this season').waitFor();
await page.getByText('How this was calculated').click();
await axe('report'); await shot('12-report');
await page.getByRole('button', { name: 'Save report to journal' }).click();

await tab('Journal').click();
await page.getByRole('button', { name: /Atlas Report/ }).click();
await axe('journal'); await shot('13-journal');

await page.getByRole('button', { name: /Profile/ }).click();
await axe('profile'); await shot('14-profile');

// Back navigation goes to the previous tab.
await tab('Stars').click();
await page.getByRole('tab', { name: 'Birth chart' }).click();
await shot('15-chart-premium');
const evidenceMarks = await page.locator('[data-evidence]').count();

console.log(JSON.stringify({ errors, violations, evidenceMarks }, null, 2));
await browser.close();
