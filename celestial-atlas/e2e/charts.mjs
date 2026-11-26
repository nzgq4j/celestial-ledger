// Account > Charts for a signed-in Atlas+ member, with Supabase answered by stubs (no network).
// Usage: VITE_SUPABASE_URL=https://auth.test VITE_SUPABASE_PUBLISHABLE_KEY=test npm run build
//        npx vite preview --port 4173 & node e2e/charts.mjs [outDir]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
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
const violations = [];
const checks = [];
async function axe(name) {
  await page.waitForTimeout(700);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  for (const v of r.violations) violations.push({ screen: name, id: v.id, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') });
}
const shot = name => page.screenshot({ path: `${out}/${name}.png` });
const expect = async (name, locator) => {
  try { await locator.waitFor({ timeout: 5000 }); checks.push(`ok: ${name}`); }
  catch { checks.push(`FAILED: ${name}`); }
};
async function pick(label, value) {
  await page.locator('.picker-field').filter({ hasText: label }).last().click();
  const sheet = page.locator('ion-modal.picker-sheet').last();
  const dt = sheet.locator('ion-datetime');
  await dt.waitFor();
  await page.waitForTimeout(400);
  await dt.evaluate((el, v) => { el.value = v; }, value);
  await sheet.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(400);
}

const user = { id: '9a000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'member@example.com', user_metadata: { full_name: 'Amelia Laurent' }, app_metadata: { provider: 'email' }, identities: [], created_at: '2026-01-01T00:00:00Z' };
const row = (id, name, date, created) => ({
  id, full_name: name, label: name, birth_date: date, birth_time: '06:45:00', time_unknown: false, disambiguation: null,
  city: 'Avignon', region: "Provence-Alpes-Côte d'Azur", country: 'France', latitude: 43.9493, longitude: 4.8055,
  time_zone: 'Europe/Paris', geoname_id: 3035681, created_at: created,
});
let rows = [row('own-1', 'Amelia Rose Laurent', '1991-07-28', '2026-01-01T00:00:00Z'), row('maya-1', 'Maya Example', '1985-03-14', '2026-02-01T00:00:00Z')];
let inserted = 0;

await page.route('https://auth.test/**', async route => {
  const req = route.request();
  const url = new URL(req.url());
  const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  if (url.pathname === '/auth/v1/user') return json(user);
  if (url.pathname === '/rest/v1/rpc/atlas_membership') return json({ plan: 'premium', status: 'active' });
  if (url.pathname === '/rest/v1/birth_profiles') {
    if (req.method() === 'GET') return json(rows);
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      const id = `new-${++inserted}`;
      rows = [...rows, row(id, body.full_name, body.birth_date, new Date().toISOString())];
      return json({ id }, 201);
    }
    if (req.method() === 'DELETE') {
      const id = (url.searchParams.get('id') || '').replace('eq.', '');
      rows = rows.filter(r => r.id !== id);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 204, body: '' });
  }
  if (url.pathname.startsWith('/rest/v1/')) return json([]);
  return json({});
});

// A signed-in session and the member's own chart on the device.
await page.goto(BASE);
await page.evaluate(u => {
  const b64 = o => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, exp, role: 'authenticated', aud: 'authenticated' })}.sig`;
  localStorage.setItem('CapacitorStorage.sb-auth-auth-token', JSON.stringify({ access_token: token, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp, user: u }));
  localStorage.setItem('CapacitorStorage.atlas_profile', JSON.stringify({
    name: 'Amelia Rose Laurent', date: '1991-07-28', time: '06:45', timeUnknown: false,
    place: { id: 3035681, name: 'Avignon', region: "Provence-Alpes-Côte d'Azur", country: 'France', lat: 43.9493, lon: 4.8055, timeZone: 'Europe/Paris' },
  }));
}, user);

await page.goto(`${BASE}profile/charts`);
await expect('charts section lists the saved chart', page.getByText('Maya Example'));
await expect('count shows 1 of 7', page.getByText('1 of 7'));
await expect('Add a chart button', page.getByRole('button', { name: 'Add a chart' }));
await axe('charts'); await shot('C1-charts');

// View Maya's chart: Today switches to it, with the viewing bar.
await page.locator('ion-item').filter({ hasText: 'Maya Example' }).getByRole('button', { name: 'View' }).click();
await expect('viewing bar', page.getByText('Viewing Maya Example’s chart'));
await expect('Today greets the viewed chart', page.getByText(/Good (morning|afternoon|evening), Maya\./));
await axe('viewing-today'); await shot('C2-viewing');
await page.getByRole('button', { name: 'Back to my chart' }).click();
await expect('back to own chart', page.getByText(/Good (morning|afternoon|evening), Amelia\./));
checks.push((await page.getByText('Viewing Maya Example’s chart').count()) === 0 ? 'ok: viewing bar gone' : 'FAILED: viewing bar still shown');

// Add a chart through the form.
await page.goto(`${BASE}profile/charts`);
await page.getByRole('button', { name: 'Add a chart' }).click();
const form = page.locator('ion-modal').filter({ has: page.locator('#chart-form-title') });
await expect('add chart form', form.locator('#chart-form-title').filter({ hasText: 'Add a chart' }));
await form.locator('ion-input').filter({ hasText: 'Their full birth name' }).locator('input').fill('Leo Example');
await pick('Date of birth', '2001-08-09');
await pick('Time of birth', '2000-01-01T14:30:00');
await form.locator('ion-searchbar input').fill('Avignon');
await form.locator('ion-item[button]').filter({ hasText: 'Avignon' }).first().click();
await form.getByText(/Time zone Europe\/Paris/).waitFor();
await axe('chart-form'); await shot('C3-form');
await form.getByRole('button', { name: 'Save chart' }).click();
await expect('new chart listed', page.locator('ion-item').filter({ hasText: 'Leo Example' }));
await expect('count shows 2 of 7', page.getByText('2 of 7'));
checks.push(inserted === 1 ? 'ok: one chart inserted' : `FAILED: inserts ${inserted}`);
await shot('C4-added');

// Delete Maya's chart.
await page.locator('ion-item').filter({ hasText: 'Maya Example' }).getByRole('button', { name: 'Delete' }).click();
await page.locator('ion-alert').getByRole('button', { name: 'Delete' }).click();
await page.waitForTimeout(600);
checks.push((await page.locator('ion-item').filter({ hasText: 'Maya Example' }).count()) === 0 ? 'ok: chart deleted' : 'FAILED: chart still listed');
await expect('count shows 1 of 7 after delete', page.getByText('1 of 7'));

console.log(JSON.stringify({ checks, errors, violations }, null, 2));
await browser.close();
