// Account data: the member's birth profile, saved journal entries and Atlas+
// membership. All calls run as the signed-in member under row-level security.
import type { Profile } from '../engine/atlas';
import type { EvidenceMap } from '../engine/records';
import type { JournalEntry } from '../state/journal';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { postJson } from './api';
import { isNative } from './native';
import { supabase } from './supabase';

export interface Membership {
  plan: 'free' | 'premium';
  status?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  provider?: 'stripe' | 'google_play' | null;
}

export class AccountError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; this.name = 'AccountError'; }
}

const client = () => {
  if (!supabase) throw new AccountError('UNAVAILABLE', 'Accounts are not available in this build.');
  return supabase;
};

/* ---------- Sign-in ---------- */

export async function signInWithPassword(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw new AccountError(error.code ?? 'SIGN_IN_FAILED', error.message);
}

export async function signUp(email: string, password: string, redirectTo: string) {
  const { data, error } = await client().auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
  if (error) throw new AccountError(error.code ?? 'SIGN_UP_FAILED', error.message);
  // Supabase answers a sign-up for a registered address with a user that has no
  // identities and sends no email (so addresses cannot be probed).
  const alreadyExists = !!data.user && !data.session && (data.user.identities?.length ?? 0) === 0;
  return { needsConfirmation: !data.session, alreadyExists };
}

/**
 * Android returns from Google through this app link (an intent filter in
 * AndroidManifest.xml); it is on the Supabase redirect allow list.
 */
export const OAUTH_APP_RETURN = 'com.celestialatlas.app://auth-callback';

/**
 * Continue with Google (signs in, or creates the account the first time).
 * The web leaves the page and returns through /auth/callback with a PKCE code,
 * which the Supabase client exchanges on load. Android opens Google in a
 * Custom Tab (Google refuses sign-in inside app web views) and finishes in
 * onOAuthReturn.
 */
export async function signInWithGoogle(webReturn: string): Promise<void> {
  const native = isNative();
  const { data, error } = await client().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: native ? OAUTH_APP_RETURN : webReturn, skipBrowserRedirect: native },
  });
  if (error) throw new AccountError(error.code ?? 'OAUTH_FAILED', error.message);
  if (native && data.url) await Browser.open({ url: data.url });
}

/** Android: completes Google sign-in when the app link opens the app. */
export function onOAuthReturn(handler: (ok: boolean) => void): () => void {
  if (!isNative() || !supabase) return () => undefined;
  const sub = App.addListener('appUrlOpen', ({ url }) => {
    if (!url.startsWith(OAUTH_APP_RETURN)) return;
    void Browser.close().catch(() => undefined);
    const code = new URL(url).searchParams.get('code');
    if (!code) { handler(false); return; }
    void client().auth.exchangeCodeForSession(code).then(({ error }) => handler(!error), () => handler(false));
  });
  return () => { void sub.then(h => h.remove()); };
}

/** Emails a password reset link. */
export async function sendPasswordReset(email: string, redirectTo: string) {
  const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new AccountError(error.code ?? 'RESET_FAILED', error.message);
}

export type EmailLinkType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';
const LINK_TYPES: readonly EmailLinkType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

/** Reads an email-link token from the URL fragment (#token_hash=…&type=…), if present. */
export function emailLinkFromHash(hash: string): { tokenHash: string; type: EmailLinkType } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const tokenHash = params.get('token_hash'), type = params.get('type') as EmailLinkType | null;
  if (!tokenHash || !/^[A-Za-z0-9_-]{8,512}$/.test(tokenHash) || !type || !LINK_TYPES.includes(type)) return null;
  return { tokenHash, type };
}

/** Completes a link from a confirmation, sign-in or recovery email. */
export async function verifyEmailLink(tokenHash: string, type: EmailLinkType) {
  const { error } = await client().auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) throw new AccountError(error.code ?? 'LINK_INVALID', error.message);
}

export async function updatePassword(password: string) {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw new AccountError(error.code ?? 'PASSWORD_FAILED', error.message);
}

export async function signOut() {
  await client().auth.signOut();
}

/* ---------- Birth profile ---------- */

interface BirthProfileRow {
  id: string;
  full_name: string | null;
  label: string;
  birth_date: string;
  birth_time: string | null;
  time_unknown: boolean;
  disambiguation: 'earlier' | 'later' | null;
  city: string;
  region: string | null;
  country: string;
  latitude: number;
  longitude: number;
  time_zone: string;
  geoname_id: number | null;
  created_at: string;
}

const PROFILE_COLUMNS = 'id,full_name,label,birth_date,birth_time,time_unknown,disambiguation,city,region,country,latitude,longitude,time_zone,geoname_id,created_at';

export function rowToProfile(row: BirthProfileRow): Profile {
  return {
    name: row.full_name ?? '',
    date: row.birth_date,
    time: row.time_unknown || !row.birth_time ? '' : row.birth_time.slice(0, 5),
    timeUnknown: row.time_unknown,
    place: {
      id: row.geoname_id ?? 0,
      name: row.city,
      region: row.region ?? '',
      country: row.country,
      lat: row.latitude,
      lon: row.longitude,
      timeZone: row.time_zone,
    },
    ...(row.disambiguation ? { disambiguation: row.disambiguation } : {}),
  };
}

export function profileToRow(p: Profile) {
  const display = [p.place.name, p.place.region, p.place.country].filter(Boolean).join(', ').slice(0, 500);
  return {
    full_name: p.name.trim() || null,
    birth_date: p.date,
    birth_time: p.timeUnknown ? null : p.time,
    time_unknown: p.timeUnknown,
    disambiguation: p.disambiguation ?? null,
    city: p.place.name.slice(0, 160),
    region: p.place.region ? p.place.region.slice(0, 160) : null,
    country: p.place.country.slice(0, 160),
    display_name: display || p.place.name,
    latitude: p.place.lat,
    longitude: p.place.lon,
    time_zone: p.place.timeZone,
    geoname_id: p.place.id > 0 ? p.place.id : null,
  };
}

/** The member's primary chart: their oldest active birth profile. */
async function primaryRow(): Promise<BirthProfileRow | null> {
  const { data, error } = await client().from('birth_profiles').select(PROFILE_COLUMNS)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1);
  if (error) throw new AccountError('PROFILE_LOAD_FAILED', error.message);
  return (data?.[0] as BirthProfileRow | undefined) ?? null;
}

export async function loadProfile(): Promise<Profile | null> {
  const row = await primaryRow();
  return row ? rowToProfile(row) : null;
}

/** Save the profile to the primary chart (created if missing), renewing its one-year expiry. */
export async function saveProfile(p: Profile): Promise<void> {
  const c = client();
  const { data: auth } = await c.auth.getUser();
  if (!auth.user) throw new AccountError('SIGNED_OUT', 'Sign in to save your profile.');
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const row = profileToRow(p);
  const existing = await primaryRow();
  const { error } = existing
    ? await c.from('birth_profiles').update({ ...row, expires_at: expires }).eq('id', existing.id)
    : await c.from('birth_profiles').insert({ ...row, user_id: auth.user.id, label: 'Me', expires_at: expires });
  if (error) throw new AccountError(error.message.includes('ALLOWANCE') ? 'CHART_LIMIT' : 'PROFILE_SAVE_FAILED', error.message);
}

/* ---------- Journal ---------- */

const ENTRY_TYPES: Record<string, string> = {
  'Card of the day': 'card_of_day', Horoscope: 'horoscope', Numerology: 'numerology',
  Compatibility: 'compatibility', Tarot: 'tarot', 'Atlas Report': 'atlas_report',
};
const TYPE_LABELS = Object.fromEntries(Object.entries(ENTRY_TYPES).map(([k, v]) => [v, k]));

interface JournalRow {
  id: string; entry_type: string; title: string; body: string;
  record_ids: string[]; evidence: EvidenceMap; created_at: string;
}

export function rowToEntry(row: JournalRow): JournalEntry {
  return {
    id: Date.parse(row.created_at), remoteId: row.id, type: TYPE_LABELS[row.entry_type] ?? row.entry_type,
    title: row.title, body: row.body, date: row.created_at,
    recordIds: row.record_ids, evidence: row.evidence,
  };
}

export async function loadJournal(): Promise<JournalEntry[]> {
  const { data, error } = await client().from('atlas_journal_entries')
    .select('id,entry_type,title,body,record_ids,evidence,created_at')
    .order('created_at', { ascending: false }).limit(2000);
  if (error) throw new AccountError('JOURNAL_LOAD_FAILED', error.message);
  return (data as JournalRow[]).map(rowToEntry);
}

export async function addJournalEntry(e: JournalEntry): Promise<JournalEntry> {
  const c = client();
  const { data: auth } = await c.auth.getUser();
  if (!auth.user) throw new AccountError('SIGNED_OUT', 'Sign in to sync your journal.');
  const { data, error } = await c.from('atlas_journal_entries').insert({
    user_id: auth.user.id,
    entry_type: ENTRY_TYPES[e.type] ?? 'horoscope',
    title: e.title.slice(0, 200),
    body: e.body.slice(0, 20000),
    record_ids: (e.recordIds ?? []).slice(0, 10),
    evidence: e.evidence ?? {},
  }).select('id,entry_type,title,body,record_ids,evidence,created_at').single();
  if (error) throw new AccountError('JOURNAL_SAVE_FAILED', error.message);
  return rowToEntry(data as JournalRow);
}

export async function deleteJournalEntry(remoteId: string): Promise<void> {
  const { error } = await client().from('atlas_journal_entries').delete().eq('id', remoteId);
  if (error) throw new AccountError('JOURNAL_DELETE_FAILED', error.message);
}

/* ---------- Membership ---------- */

export async function loadMembership(): Promise<Membership> {
  const { data, error } = await client().rpc('atlas_membership');
  if (error) throw new AccountError('MEMBERSHIP_FAILED', error.message);
  const m = (data ?? {}) as Membership;
  return { ...m, plan: m.plan === 'premium' ? 'premium' : 'free' };
}

/* ---------- Deletion ---------- */

/** Permanently deletes the account and everything stored with it. */
export async function deleteAccount(): Promise<void> {
  await postJson<{ ok: true }>('/api/account/delete', { confirmation: 'DELETE' });
  await client().auth.signOut().catch(() => undefined);
}
