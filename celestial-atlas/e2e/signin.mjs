// Sign in and Create account screens, with Supabase answered by stubs (no network).
// Usage: VITE_SUPABASE_URL=https://auth.test VITE_SUPABASE_PUBLISHABLE_KEY=test npm run build
//        npx vite preview --port 4173 & node e2e/signin.mjs [outDir]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';

const out = process.argv[2] || 'e2e/out';
fs.mkdirSync(out, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 1, locale: 'en-US' });
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
  try { await locator.waitFor({ timeout: 4000 }); checks.push(`ok: ${name}`); }
  catch { checks.push(`FAILED: ${name}`); }
};

// Supabase stub: the next sign-up answers as a new or an existing address.
let signupMode = 'new';
await page.route('https://auth.test/**', route => {
  const url = route.request().url();
  if (url.includes('/auth/v1/signup')) {
    const identities = signupMode === 'new' ? [{ id: 'i1', provider: 'email' }] : [];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', aud: 'authenticated', role: '', email: 'x@example.com', identities, created_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} }) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});

// A profile is stored on the device first, so the app opens on Today.
await page.goto(BASE);
await page.evaluate(() => localStorage.setItem('CapacitorStorage.atlas_profile', JSON.stringify({
  name: 'Amelia Rose Laurent', date: '1991-07-28', time: '06:45', timeKnown: true,
  place: { name: 'Avignon', admin: 'Provence-Alpes-Côte d’Azur', country: 'France', lat: 43.9493, lon: 4.8055, tz: 'Europe/Paris', geonameId: 3035681 },
})));
await page.goto(`${BASE}profile`);
await page.locator('ion-tab-bar').waitFor({ timeout: 10000 });
await page.getByRole('button', { name: 'Sign in' }).first().click();
const modal = page.locator('ion-modal').last();
await expect('sign-in screen opens', modal.getByText('New to Celestial Atlas?'));
await expect('Create account is available before typing anything', modal.getByRole('button', { name: 'Create account' }));
await axe('signin'); await shot('S1-signin');

await modal.getByRole('button', { name: 'Create account' }).click();
await expect('create account screen', modal.getByText('Confirm password'));
await axe('create'); await shot('S2-create');

await modal.locator('ion-input').filter({ hasText: 'Email' }).locator('input').fill('new@example.com');
await modal.locator('ion-input').filter({ hasText: /^Password/ }).locator('input').fill('stars-1234');
await modal.locator('ion-input').filter({ hasText: 'Confirm password' }).locator('input').fill('stars-9999');
await modal.getByRole('button', { name: 'Create account' }).click();
await expect('mismatched passwords are caught', modal.getByText('The passwords do not match.'));

await modal.locator('ion-input').filter({ hasText: 'Confirm password' }).locator('input').fill('stars-1234');
await modal.getByRole('button', { name: 'Create account' }).click();
await expect('new address: confirmation link message', modal.getByText(/We sent a confirmation link to new@example\.com/));
await shot('S3-created');

signupMode = 'existing';
await modal.locator('ion-input').filter({ hasText: 'Email' }).locator('input').fill('taken@example.com');
await modal.locator('ion-input').filter({ hasText: /^Password/ }).locator('input').fill('stars-1234');
await modal.locator('ion-input').filter({ hasText: 'Confirm password' }).locator('input').fill('stars-1234');
await modal.getByRole('button', { name: 'Create account' }).click();
await expect('existing address: back on Sign in with a clear message', modal.getByText(/An account already exists for taken@example\.com/));
await expect('email kept on Sign in', modal.locator('ion-input input[type="email"]'));
await axe('signin-exists'); await shot('S4-exists');

console.log(JSON.stringify({ checks, errors, violations }, null, 2));
await browser.close();
