import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { chart, numbers, sky, type Chart, type Numbers, type Period, type Profile, type Report, type Sky } from '../engine/atlas';
import type { EvidenceMap } from '../engine/records';
import * as account from '../platform/account';
import { billing, type PlanId } from '../platform/billing';
import { onBackButton, onResume, tap } from '../platform/native';
import { localizeChart, localizeSky } from '../engine/localize';
import { contentFor, detectLocale, isLocale, stringsFor, type Locale } from '../i18n';
import type { Content } from '../engine/content';
import { DEFAULT_NOTIF, anyNotif, cancelInsights, normalizeNotif, syncInsights, type NotifSettings } from '../platform/notifications';
import { disablePush, onPushTap } from '../platform/push';
import { KEYS, load, removeAll, save } from '../platform/storage';
import { applyTheme, isThemePref, readThemePref, rememberThemePref, type ThemePref } from '../platform/theme';
import { supabase } from '../platform/supabase';
import type { JournalEntry } from './journal';
import { chooseProfile, mergeJournal } from './sync';
import { canGoBack, initHistory, parsePath, pushRoute, replaceRoute, sameRoute, type Route, type TabId } from './router';

export type { TabId } from './router';
export type StarsTab = 'horoscope' | 'chart' | 'transits' | 'compat';
export type NumTab = 'core' | 'cycles' | 'compat';
const STARS_TABS: StarsTab[] = ['horoscope', 'chart', 'transits', 'compat'];
const NUM_TABS: NumTab[] = ['core', 'cycles', 'compat'];
/** Sections of the Account page: the journal (default) and settings. */
export type AccountTab = 'journal' | 'settings';

/** Per-screen choices that survive switching tabs, as in the prototype. */
export interface UiState {
  period: Period;
  horoSign: number | null;
  numSel: 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday';
  partnerName: string;
  partnerDate: string;
  signA: number | null;
  signB: number;
  openEntry: number | null;
}

const INITIAL_UI: UiState = {
  period: 'daily', horoSign: null, numSel: 'lifePath',
  partnerName: '', partnerDate: '', signA: null, signB: 4, openEntry: null,
};

export interface Derived {
  chart: Chart;
  nums: Numbers;
  sky: Sky;
}

export interface AccountState {
  /** Accounts are configured in this build. */
  available: boolean;
  email: string | null;
  /** The signed-in account's display name (Google name, or the email's local part). */
  name: string | null;
  membership: account.Membership | null;
  syncing: boolean;
}

interface AppValue {
  loaded: boolean;
  /** Reader's language, and the reading content in it. */
  locale: Locale;
  /** Appearance preference: system, light or dark. */
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  content: Content;
  setLocale: (l: Locale) => void;
  /** True after a password-recovery link: ask for a new password. */
  passwordPrompt: boolean;
  closePasswordPrompt: () => void;
  profile: Profile | null;
  journal: JournalEntry[];
  premium: boolean;
  notif: NotifSettings;
  /** Why notifications are not working, if they are on. */
  notifIssue: 'blocked' | 'failed' | null;
  route: Route;
  tab: TabId;
  starsTab: StarsTab;
  numTab: NumTab;
  accountTab: AccountTab;
  paywall: boolean;
  signInOpen: boolean;
  toast: string | null;
  ui: UiState;
  report: Report | null;
  now: Date;
  derived: Derived | null;
  derivedError: string | null;
  account: AccountState;

  go: (tab: TabId, sub?: string) => void;
  setStarsTab: (t: StarsTab) => void;
  setNumTab: (t: NumTab) => void;
  setAccountTab: (t: AccountTab) => void;
  back: () => boolean;
  setUi: (patch: Partial<UiState>) => void;
  setProfile: (p: Profile) => Promise<void>;
  addJournal: (type: string, title: string, body: string, refs?: { recordIds?: string[]; evidence?: EvidenceMap }) => void;
  deleteJournal: (id: number) => void;
  showToast: (msg: string) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  openSignIn: () => void;
  closeSignIn: () => void;
  startTrial: (plan: PlanId) => Promise<void>;
  manageMembership: () => Promise<void>;
  setNotif: (next: NotifSettings) => Promise<void>;
  openReport: (r: Report) => void;
  signOut: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

/** Chart, numbers and sky for the profile. The chart is recomputed when the profile changes,
 *  numbers once a day, and the sky once an hour. */
function useDerived(profile: Profile | null, now: Date, c: Content): { derived: Derived | null; error: string | null } {
  const profileKey = profile ? JSON.stringify(profile) : '';
  const dayKey = now.toDateString();
  const hourKey = `${dayKey} ${now.getHours()}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ch = useMemo(() => { try { return profile ? chart(profile) : null; } catch (e) { return e as Error; } }, [profileKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nums = useMemo(() => (profile ? numbers(profile, now) : null), [profileKey, dayKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sk = useMemo(() => sky(now), [hourKey]);
  if (!profile || !ch || !nums) return { derived: null, error: null };
  if (ch instanceof Error) return { derived: null, error: ch.message };
  return { derived: { chart: localizeChart(ch, c), nums, sky: localizeSky(sk, c) }, error: null };
}

const currentRoute = (): Route => parsePath(window.location.pathname);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [localPremium, setLocalPremium] = useState(false);
  const [notif, setNotifState] = useState<NotifSettings>(DEFAULT_NOTIF);
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());
  const [theme, setThemeState] = useState<ThemePref>(() => readThemePref());
  useEffect(() => applyTheme(theme), [theme]);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const content = contentFor(locale);
  const contentRef = useRef(content);
  const stringsRef = useRef(stringsFor(locale));
  stringsRef.current = stringsFor(locale);
  contentRef.current = content;
  const [notifIssue, setNotifIssue] = useState<'blocked' | 'failed' | null>(null);
  const [route, setRoute] = useState<Route>(() => { initHistory(); return currentRoute(); });
  const [paywall, setPaywall] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ui, setUiState] = useState<UiState>(INITIAL_UI);
  const [report, setReport] = useState<Report | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<account.Membership | null>(null);
  const [syncing, setSyncing] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /* ---------- Local data ---------- */

  useEffect(() => {
    let alive = true;
    void Promise.all([
      load<Profile | null>(KEYS.profile, null),
      load<JournalEntry[]>(KEYS.journal, []),
      billing.isEntitled(),
      load<NotifSettings>(KEYS.notif, DEFAULT_NOTIF),
      load<string | null>(KEYS.locale, null),
      load<string | null>(KEYS.theme, null),
    ]).then(([p, j, pr, n, l, t]) => {
      if (alive && isLocale(l)) setLocaleState(l);
      if (alive && isThemePref(t)) { setThemeState(t); rememberThemePref(t); }
      if (!alive) return;
      setProfileState(p && 'place' in p ? p : null);
      setJournal(Array.isArray(j) ? j : []);
      setLocalPremium(pr);
      setNotifState(normalizeNotif(n));
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  /* ---------- Routing ---------- */

  useEffect(() => {
    const onPop = () => { setRoute(currentRoute()); setPaywall(false); setSignInOpen(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const routeRef = useRef(route);
  routeRef.current = route;
  const go = useCallback((tab: TabId, sub?: string) => {
    const next: Route = sub ? { tab, sub } : { tab };
    if (sameRoute(routeRef.current, next)) return;
    pushRoute(next);
    setRoute(next);
    try { window.scrollTo(0, 0); } catch { /* not in a browser */ }
  }, []);

  // A tapped push notification opens its page.
  useEffect(() => onPushTap(path => { const r = parsePath(path); go(r.tab, r.sub); }), [go]);

  const tab = route.tab;
  const starsTab: StarsTab = route.tab === 'stars' && STARS_TABS.includes(route.sub as StarsTab) ? route.sub as StarsTab : 'horoscope';
  const numTab: NumTab = route.tab === 'numbers' && NUM_TABS.includes(route.sub as NumTab) ? route.sub as NumTab : 'core';
  // Section changes replace the history entry so back leaves the tab, as in standard tab UIs.
  const setStarsTab = useCallback((t: StarsTab) => { const r = { tab: 'stars' as const, sub: t }; replaceRoute(r); setRoute(r); }, []);
  const setNumTab = useCallback((t: NumTab) => { const r = { tab: 'numbers' as const, sub: t }; replaceRoute(r); setRoute(r); }, []);
  // /journal and /profile both open the Account page; /profile/settings opens its settings.
  const accountTab: AccountTab = route.tab === 'profile' && route.sub === 'settings' ? 'settings' : 'journal';
  const setAccountTab = useCallback((t: AccountTab) => {
    const r: Route = t === 'settings' ? { tab: 'profile', sub: 'settings' } : { tab: 'profile' };
    replaceRoute(r); setRoute(r);
  }, []);

  const back = useCallback((): boolean => {
    if (signInOpen) { setSignInOpen(false); return true; }
    if (paywall) { setPaywall(false); return true; }
    if (canGoBack()) { window.history.back(); return true; }
    return false;
  }, [paywall, signInOpen]);

  // Android back: close sheets, then step back through visited screens, then exit.
  const backRef = useRef(back);
  backRef.current = back;
  useEffect(() => onBackButton(() => backRef.current()), []);

  /* ---------- Clock and notifications ---------- */

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    const off = onResume(() => setNow(new Date()));
    return () => { clearInterval(id); off(); };
  }, []);

  const notifRef = useRef(notif);
  notifRef.current = notif;
  useEffect(() => {
    if (!loaded || !profile) return;
    const n = notifRef.current;
    void syncInsights(profile, n, false, contentRef.current).then(r => {
      setNotifIssue(anyNotif(n) && (r === 'blocked' || r === 'failed') ? r : null);
      // The browser has not granted permission (for example after reinstalling): show the switches off.
      if (r === 'needs-permission') { const off = { ...n, enabled: false, news: false }; setNotifState(off); void save(KEYS.notif, off); }
    });
  }, [loaded, profile, locale]);

  /* ---------- Account and sync ---------- */

  useEffect(() => {
    if (!supabase) return;
    // A Google sign-in returns to /profile?code=… (see /auth/callback); the client
    // exchanges the code while it starts, then the code is removed from the address.
    const oauthReturn = new URLSearchParams(window.location.search).has('code');
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!oauthReturn) return;
      window.history.replaceState(window.history.state, '', window.location.pathname);
      showToast(data.session ? stringsRef.current.signin.welcome : stringsRef.current.signin.googleFailed);
    });
    const offOAuth = account.onOAuthReturn(ok => {
      if (ok) { setSignInOpen(false); showToast(stringsRef.current.signin.welcome); }
      else showToast(stringsRef.current.signin.googleFailed);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setPasswordPrompt(true);
    });
    // Email links arrive as #token_hash=…&type=… (see /auth/confirm on the server).
    const link = account.emailLinkFromHash(window.location.hash);
    if (link) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
      void account.verifyEmailLink(link.tokenHash, link.type)
        .then(() => { if (link.type === 'recovery') setPasswordPrompt(true); else showToast(stringsRef.current.signin.welcome); })
        .catch(() => showToast(stringsRef.current.signin.linkFailed));
    }
    return () => { data.subscription.unsubscribe(); offOAuth(); };
  }, []);

  const journalRef = useRef(journal);
  journalRef.current = journal;
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!loaded || !userId) { setMembership(null); return; }
    let alive = true;
    setSyncing(true);
    void (async () => {
      try {
        // Profile: the account's chart wins; otherwise upload the one made on this device,
        // unless that chart and journal belong to a different account.
        const owner = await load<string | null>(KEYS.owner, null);
        const foreign = !!owner && owner !== userId;
        const remote = await account.loadProfile();
        if (!alive) return;
        const choice = chooseProfile(remote, profileRef.current, foreign);
        if (choice.profile !== profileRef.current) {
          setProfileState(choice.profile);
          await save(KEYS.profile, choice.profile);
        }
        if (choice.upload && choice.profile) await account.saveProfile(choice.profile);
        // Journal: upload entries saved on this device; any that fail stay local and are retried next sign-in.
        const pending: JournalEntry[] = [];
        for (const e of foreign ? [] : journalRef.current.filter(x => !x.remoteId)) {
          try { await account.addJournalEntry(e); } catch { pending.push(e); }
        }
        await save(KEYS.owner, userId);
        const entries = mergeJournal(await account.loadJournal(), pending);
        if (!alive) return;
        setJournal(entries);
        await save(KEYS.journal, entries);
        setMembership(await account.loadMembership());
      } catch (e) {
        if (alive) showToast(stringsRef.current.toasts.syncFailed);
      } finally {
        if (alive) setSyncing(false);
      }
    })();
    return () => { alive = false; };
  }, [loaded, userId, showToast]);

  // Refresh the membership when the app returns to the foreground (for example after checkout).
  useEffect(() => onResume(() => {
    if (userId) void account.loadMembership().then(setMembership).catch(() => undefined);
  }), [userId]);

  const premium = userId ? membership?.plan === 'premium' : localPremium;

  /* ---------- Actions ---------- */

  const setUi = useCallback((patch: Partial<UiState>) => setUiState(s => ({ ...s, ...patch })), []);

  const setProfile = useCallback(async (p: Profile) => {
    setProfileState(p);
    await save(KEYS.profile, p);
    // A chart saved while signed out belongs to this device until an account adopts it.
    if (!userId) await save(KEYS.owner, null);
    if (userId) {
      try { await account.saveProfile(p); }
      catch (e) { showToast(e instanceof account.AccountError && e.code === 'CHART_LIMIT' ? stringsRef.current.toasts.chartLimit : stringsRef.current.toasts.savedOffline); }
    }
  }, [userId, showToast]);

  const addJournal = useCallback<AppValue['addJournal']>((type, title, body, refs) => {
    const entry: JournalEntry = { id: Date.now(), type, title, body, date: new Date().toISOString(), ...refs };
    setJournal(prev => { const next = [entry, ...prev]; void save(KEYS.journal, next); return next; });
    void tap();
    showToast(stringsRef.current.common.savedToJournal);
    if (userId) {
      void account.addJournalEntry(entry).then(remote => {
        setJournal(prev => { const next = prev.map(e => (e.id === entry.id ? { ...remote, id: entry.id } : e)); void save(KEYS.journal, next); return next; });
      }).catch(() => undefined);
    }
  }, [showToast, userId]);

  const deleteJournal = useCallback((id: number) => {
    const target = journalRef.current.find(e => e.id === id);
    setJournal(prev => { const next = prev.filter(e => e.id !== id); void save(KEYS.journal, next); return next; });
    if (target?.remoteId && userId) void account.deleteJournalEntry(target.remoteId).catch(() => showToast(stringsRef.current.toasts.deleteFailed));
  }, [userId, showToast]);

  const refreshMembership = useCallback(async () => {
    if (userId) setMembership(await account.loadMembership().catch(() => null));
  }, [userId]);

  const startTrial = useCallback(async (plan: PlanId) => {
    const outcome = await billing.purchase(plan);
    if (outcome === 'redirect') return; // continues in the store's checkout
    setPaywall(false);
    if (billing.needsAccount) await refreshMembership();
    else setLocalPremium(outcome === 'active');
    if (outcome === 'active') { void tap(); showToast(stringsRef.current.toasts.welcome); }
  }, [showToast, refreshMembership]);

  const manageMembership = useCallback(async () => {
    if (!premium) { setPaywall(true); return; }
    const outcome = await billing.manage();
    if (outcome === 'redirect') return;
    if (billing.needsAccount) await refreshMembership();
    else setLocalPremium(outcome === 'active');
  }, [premium, refreshMembership]);

  // Returning from Stripe Checkout: the webhook may take a moment, so check the membership a few times.
  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'complete') return;
    window.history.replaceState(window.history.state, '', window.location.pathname);
    showToast(stringsRef.current.toasts.confirming);
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      void account.loadMembership().then(m => {
        setMembership(m);
        if (m.plan === 'premium' || tries >= 6) clearInterval(id);
      }).catch(() => { if (tries >= 6) clearInterval(id); });
    }, 2500);
    return () => clearInterval(id);
  }, [userId, showToast]);

  const setNotif = useCallback(async (next: NotifSettings) => {
    const prev = notifRef.current;
    setNotifState(next);
    await save(KEYS.notif, next);
    if (profile) {
      // Ask for permission only when a switch was just turned on.
      const turnedOn = (next.enabled && !prev.enabled) || (next.news && !prev.news);
      const r = await syncInsights(profile, next, turnedOn, contentRef.current);
      const on = anyNotif(next);
      setNotifIssue(on && (r === 'blocked' || r === 'failed') ? r : r === 'needs-permission' && on ? 'blocked' : null);
    }
  }, [profile]);

  const openReport = useCallback((r: Report) => { setReport(r); go('report'); }, [go]);

  const signOut = useCallback(async () => {
    await account.signOut().catch(() => undefined);
    setMembership(null);
    showToast(stringsRef.current.toasts.signedOut);
  }, [showToast]);

  const resetAll = useCallback(async () => {
    await cancelInsights();
    await disablePush().catch(() => undefined);
    if (userId) await account.signOut().catch(() => undefined);
    await removeAll();
    setProfileState(null); setJournal([]); setLocalPremium(false); setNotifState(DEFAULT_NOTIF);
    setUiState(INITIAL_UI); setReport(null); setMembership(null);
    const home: Route = { tab: 'home' };
    replaceRoute(home); setRoute(home);
  }, [userId]);

  const setLocale = useCallback((l: Locale) => { setLocaleState(l); void save(KEYS.locale, l); }, []);
  const setTheme = useCallback((t: ThemePref) => { setThemeState(t); rememberThemePref(t); void save(KEYS.theme, t); }, []);

  const value: AppValue = {
    loaded, locale, content, setLocale, theme, setTheme, passwordPrompt, closePasswordPrompt: () => setPasswordPrompt(false), profile, journal, premium, notif, notifIssue, route, tab, starsTab, numTab, accountTab, paywall, signInOpen, toast, ui, report, now, derived: null, derivedError: null,
    account: { available: supabase !== null, email: session?.user.email ?? null, name: account.displayName(session?.user ?? null), membership, syncing },
    go, setStarsTab, setNumTab, setAccountTab, back, setUi, setProfile, addJournal, deleteJournal, showToast,
    openPaywall: () => setPaywall(true), closePaywall: () => setPaywall(false),
    openSignIn: () => setSignInOpen(true), closeSignIn: () => setSignInOpen(false),
    startTrial, manageMembership, setNotif, openReport, signOut, resetAll,
  };
  const { derived, error: derivedError } = useDerived(profile, now, content);
  value.derived = derived;
  value.derivedError = derivedError;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
