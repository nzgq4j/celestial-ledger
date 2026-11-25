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
async function pick(page, label, value) {
  await page.locator('.picker-field').filter({ hasText: label }).click();
  const sheet = page.locator('ion-modal.picker-sheet').last();
  const dt = sheet.locator('ion-datetime');
  await dt.waitFor();
  await page.waitForTimeout(400);
  await dt.evaluate((el, v) => { el.value = v; }, value);
  await sheet.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(500);
}
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
await page.locator('ion-input').filter({ hasText: 'Full birth name' }).locator('input').fill('Amelia Rose Laurent');
await axe('onboarding-name');
await page.getByRole('button', { name: 'Continue' }).click();
await pick(page, 'Date of birth', '1991-07-28');
await pick(page, 'Time of birth', '2000-01-01T06:45:00');
await axe('onboarding-date'); await shot('02-date');
await page.getByRole('button', { name: 'Continue' }).click();
await page.locator('ion-searchbar input').fill('Avignon');
await page.locator('ion-item[button]').filter({ hasText: 'Avignon' }).first().click();
await page.getByText(/Time zone Europe\/Paris/).waitFor();
await axe('onboarding-place'); await shot('03-place');
await page.getByRole('button', { name: 'Create my atlas' }).click();
await page.getByText('Good morning, Amelia.').or(page.getByText(/Good (afternoon|evening), Amelia\./)).waitFor();
await axe('today'); await shot('04-today');

const seg = name => page.locator('ion-segment-button').filter({ hasText: name }).first();
const tab = name => page.locator('ion-tab-bar').getByRole('tab', { name });
await tab('Stars').click();
await axe('stars-horoscope'); await shot('05-horoscope');
// Pick another sign from the sign selector.
await page.locator('ion-select').filter({ hasText: 'Sign' }).first().click();
await page.getByRole('button', { name: /^Gemini/ }).or(page.getByRole('radio', { name: /^Gemini/ })).first().click();
await page.locator('ion-card').filter({ hasText: 'Gemini' }).first().waitFor();
await axe('stars-sign-selected'); await shot('05b-horoscope-gemini');
await seg('Birth chart').click();
await page.locator('svg[role=img]').waitFor();
await axe('stars-chart'); await shot('06-chart');
await seg('Transits & moon').click();
await axe('stars-transits'); await shot('07-transits');
await seg('Compatibility').click();
await axe('stars-compat');

await tab('Numbers').click();
await axe('numbers'); await shot('08-numbers');
await seg('Cycles').click(); await axe('numbers-cycles');
await seg('Compatibility').click();
await pick(page, 'Their birth date', '1988-03-14');
await axe('numbers-compat');

await tab('Tarot').click();
await axe('tarot-decks'); await shot('09-tarot-decks');
for (const deck of ['Traditional', 'The Whimsical Cats', 'Neon Circuit', 'Provençal', 'Silver Age']) {
  await tab('Tarot').click();
  if (await page.getByRole('button', { name: 'Start Over' }).isVisible()) await page.getByRole('button', { name: 'Start Over' }).click();
  await page.locator('ion-card').filter({ hasText: deck }).first().click();
  await page.locator('ion-item').filter({ hasText: 'Past, Present, Future' }).first().click();
  await page.getByText('Your Reading').waitFor({ timeout: 5000 });
  await axe(`tarot-result-${deck}`);
  if (deck === 'Traditional') await shot('10-tarot-result');
}
await page.getByRole('button', { name: 'Save to journal' }).click();

await tab('Account').click();
await page.getByRole('button', { name: 'Atlas+' }).first().click();
await page.locator('ion-modal').getByText('See the whole map.').waitFor();
await axe('paywall'); await shot('11-paywall');
await page.getByRole('button', { name: 'Start 3-day free trial' }).click();

await tab('Today').click();
await page.locator('ion-card').filter({ hasText: 'Read my report' }).click();
await page.getByText('Three cards for this season').waitFor();
await page.getByText('How this was calculated').click();
await axe('report'); await shot('12-report');
await page.getByRole('button', { name: 'Save report to journal' }).click();

await tab('Account').click();
await seg('Journal').click();
await page.locator('ion-accordion').filter({ hasText: 'Atlas Report' }).first().locator('ion-item').click();
await axe('journal'); await shot('13-journal');

await seg('Settings').click();
await axe('account-settings'); await shot('14-account-settings');

// Light theme: switch in Settings, then check the main screens for contrast and layout.
await page.locator('ion-select').filter({ hasText: 'Appearance' }).click();
await page.getByRole('button', { name: 'Light' }).or(page.getByRole('radio', { name: 'Light' })).first().click();
await page.waitForFunction(() => document.documentElement.classList.contains('theme-light'));
await page.waitForTimeout(400);
await axe('light-settings'); await shot('L1-light-settings');
await seg('Journal').click();
await axe('light-journal'); await shot('L2-light-journal');
await tab('Today').click();
await axe('light-today'); await shot('L3-light-today');
await tab('Stars').click();
await seg('Horoscope').click();
await axe('light-horoscope'); await shot('L4-light-horoscope');
await seg('Birth chart').click();
await axe('light-chart'); await shot('L5-light-chart');
await tab('Numbers').click();
await axe('light-numbers'); await shot('L6-light-numbers');
await tab('Tarot').click();
await axe('light-tarot'); await shot('L7-light-tarot');
const lightKept = await page.evaluate(() => localStorage.getItem('atlas_theme'));
if (lightKept !== 'light') throw new Error(`theme not remembered: ${lightKept}`);

// Back navigation goes to the previous tab.
await tab('Stars').click();
await seg('Birth chart').click();
await shot('15-chart-premium');
const evidenceMarks = await page.locator('[data-evidence]').count();

// Switch the language to Spanish and check the reading content follows.
await tab('Account').click();
await seg('Settings').click();
await page.locator('ion-select').filter({ hasText: 'English' }).click();
await page.getByRole('radio', { name: 'Español' }).or(page.getByRole('button', { name: 'Español' })).first().click();
await page.locator('ion-tab-bar').getByRole('tab', { name: 'Hoy' }).click();
await page.getByText(/Buen(os días|as tardes|as noches), Amelia\./).waitFor();
await axe('today-es'); await shot('16-today-es');
await page.locator('ion-tab-bar').getByRole('tab', { name: 'Astros' }).or(page.locator('ion-tab-bar').getByRole('tab').nth(1)).first().click();
await axe('stars-es'); await shot('17-stars-es');

console.log(JSON.stringify({ errors, violations, evidenceMarks }, null, 2));
await browser.close();
