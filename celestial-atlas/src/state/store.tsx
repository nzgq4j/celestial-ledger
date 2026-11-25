import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { chart, numbers, sky, type Chart, type Numbers, type Period, type Profile, type Report, type Sky } from '../engine/atlas';
import type { EvidenceMap } from '../engine/records';
import * as account from '../platform/account';
import { billing, type PlanId } from '../platform/billing';
import { onBackButton, onResume, tap } from '../platform/native';
import { DEFAULT_NOTIF, cancelInsights, scheduleInsights, type NotifSettings } from '../platform/notifications';
import { KEYS, load, removeAll, save } from '../platform/storage';
import { supabase } from '../platform/supabase';
import type { JournalEntry } from './journal';
import { chooseProfile, mergeJournal } from './sync';
import { canGoBack, initHistory, parsePath, pushRoute, replaceRoute, sameRoute, type Route, type TabId } from './router';

export type { TabId } from './router';
export type StarsTab = 'horoscope' | 'chart' | 'transits' | 'compat';
export type NumTab = 'core' | 'cycles' | 'compat';
const STARS_TABS: StarsTab[] = ['horoscope', 'chart', 'transits', 'compat'];
const NUM_TABS: NumTab[] = ['core', 'cycles', 'compat'];

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
  insightDismissed: boolean;
}

const INITIAL_UI: UiState = {
  period: 'daily', horoSign: null, numSel: 'lifePath',
  partnerName: '', partnerDate: '', signA: null, signB: 4, openEntry: null, insightDismissed: false,
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
  membership: account.Membership | null;
  syncing: boolean;
}

interface AppValue {
  loaded: boolean;
  profile: Profile | null;
  journal: JournalEntry[];
  premium: boolean;
  notif: NotifSettings;
  notifBlocked: boolean;
  route: Route;
  tab: TabId;
  starsTab: StarsTab;
  numTab: NumTab;
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
function useDerived(profile: Profile | null, now: Date): { derived: Derived | null; error: string | null } {
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
  return { derived: { chart: ch, nums, sky: sk }, error: null };
}

const currentRoute = (): Route => parsePath(window.location.pathname);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [localPremium, setLocalPremium] = useState(false);
  const [notif, setNotifState] = useState<NotifSettings>(DEFAULT_NOTIF);
  const [notifBlocked, setNotifBlocked] = useState(false);
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
    ]).then(([p, j, pr, n]) => {
      if (!alive) return;
      setProfileState(p && 'place' in p ? p : null);
      setJournal(Array.isArray(j) ? j : []);
      setLocalPremium(pr);
      setNotifState(typeof n === 'object' && n !== null && 'enabled' in n ? n : DEFAULT_NOTIF);
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

  const tab = route.tab;
  const starsTab: StarsTab = route.tab === 'stars' && STARS_TABS.includes(route.sub as StarsTab) ? route.sub as StarsTab : 'horoscope';
  const numTab: NumTab = route.tab === 'numbers' && NUM_TABS.includes(route.sub as NumTab) ? route.sub as NumTab : 'core';
  // Section changes replace the history entry so back leaves the tab, as in standard tab UIs.
  const setStarsTab = useCallback((t: StarsTab) => { const r = { tab: 'stars' as const, sub: t }; replaceRoute(r); setRoute(r); }, []);
  const setNumTab = useCallback((t: NumTab) => { const r = { tab: 'numbers' as const, sub: t }; replaceRoute(r); setRoute(r); }, []);

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
    void scheduleInsights(profile, n).then(ok => setNotifBlocked(!ok && n.enabled));
  }, [loaded, profile]);

  /* ---------- Account and sync ---------- */

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
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
        // Profile: the account's chart wins; otherwise upload the one made on this device.
        const remote = await account.loadProfile();
        if (!alive) return;
        const choice = chooseProfile(remote, profileRef.current);
        if (choice.profile && choice.profile !== profileRef.current) {
          setProfileState(choice.profile);
          await save(KEYS.profile, choice.profile);
        }
        if (choice.upload && choice.profile) await account.saveProfile(choice.profile);
        // Journal: upload entries saved on this device; any that fail stay local and are retried next sign-in.
        const pending: JournalEntry[] = [];
        for (const e of journalRef.current.filter(x => !x.remoteId)) {
          try { await account.addJournalEntry(e); } catch { pending.push(e); }
        }
        const entries = mergeJournal(await account.loadJournal(), pending);
        if (!alive) return;
        setJournal(entries);
        await save(KEYS.journal, entries);
        setMembership(await account.loadMembership());
      } catch (e) {
        if (alive) showToast(e instanceof Error ? e.message : 'Sync failed');
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
    if (userId) {
      try { await account.saveProfile(p); }
      catch (e) { showToast(e instanceof account.AccountError && e.code === 'CHART_LIMIT' ? 'Your plan allows one saved chart.' : 'Saved on this device; your account will update when you are back online.'); }
    }
  }, [userId, showToast]);

  const addJournal = useCallback<AppValue['addJournal']>((type, title, body, refs) => {
    const entry: JournalEntry = { id: Date.now(), type, title, body, date: new Date().toISOString(), ...refs };
    setJournal(prev => { const next = [entry, ...prev]; void save(KEYS.journal, next); return next; });
    void tap();
    showToast('Saved to your journal');
    if (userId) {
      void account.addJournalEntry(entry).then(remote => {
        setJournal(prev => { const next = prev.map(e => (e.id === entry.id ? { ...remote, id: entry.id } : e)); void save(KEYS.journal, next); return next; });
      }).catch(() => undefined);
    }
  }, [showToast, userId]);

  const deleteJournal = useCallback((id: number) => {
    const target = journalRef.current.find(e => e.id === id);
    setJournal(prev => { const next = prev.filter(e => e.id !== id); void save(KEYS.journal, next); return next; });
    if (target?.remoteId && userId) void account.deleteJournalEntry(target.remoteId).catch(() => showToast('Could not delete from your account. Try again later.'));
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
    if (outcome === 'active') { void tap(); showToast('Welcome to Atlas+'); }
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
    showToast('Welcome to Atlas+. Confirming your membership…');
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
    setNotifState(next);
    setUiState(s => ({ ...s, insightDismissed: false }));
    await save(KEYS.notif, next);
    if (profile) {
      const ok = await scheduleInsights(profile, next, next.enabled);
      setNotifBlocked(!ok && next.enabled);
    }
  }, [profile]);

  const openReport = useCallback((r: Report) => { setReport(r); go('report'); }, [go]);

  const signOut = useCallback(async () => {
    await account.signOut().catch(() => undefined);
    setMembership(null);
    showToast('Signed out');
  }, [showToast]);

  const resetAll = useCallback(async () => {
    await cancelInsights();
    if (userId) await account.signOut().catch(() => undefined);
    await removeAll();
    setProfileState(null); setJournal([]); setLocalPremium(false); setNotifState(DEFAULT_NOTIF);
    setUiState(INITIAL_UI); setReport(null); setMembership(null);
    const home: Route = { tab: 'home' };
    replaceRoute(home); setRoute(home);
  }, [userId]);

  const value: AppValue = {
    loaded, profile, journal, premium, notif, notifBlocked, route, tab, starsTab, numTab, paywall, signInOpen, toast, ui, report, now, derived: null, derivedError: null,
    account: { available: supabase !== null, email: session?.user.email ?? null, membership, syncing },
    go, setStarsTab, setNumTab, back, setUi, setProfile, addJournal, deleteJournal, showToast,
    openPaywall: () => setPaywall(true), closePaywall: () => setPaywall(false),
    openSignIn: () => setSignInOpen(true), closeSignIn: () => setSignInOpen(false),
    startTrial, manageMembership, setNotif, openReport, signOut, resetAll,
  };
  const { derived, error: derivedError } = useDerived(profile, now);
  value.derived = derived;
  value.derivedError = derivedError;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
