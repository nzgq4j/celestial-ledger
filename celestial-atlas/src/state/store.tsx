import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { chart, numbers, sky, type Chart, type Numbers, type Period, type Profile, type Report, type Sky } from '../engine/atlas';
import type { EvidenceMap } from '../engine/records';
import { billing } from '../platform/billing';
import { onBackButton, onResume, tap } from '../platform/native';
import { DEFAULT_NOTIF, cancelInsights, scheduleInsights, type NotifSettings } from '../platform/notifications';
import { KEYS, load, removeAll, save } from '../platform/storage';
import type { JournalEntry } from './journal';

export type TabId = 'home' | 'stars' | 'numbers' | 'tarot' | 'journal' | 'report' | 'profile';
export type StarsTab = 'horoscope' | 'chart' | 'transits' | 'compat';
export type NumTab = 'core' | 'cycles' | 'compat';

/** Per-screen choices that survive switching tabs, as in the prototype. */
export interface UiState {
  starsTab: StarsTab;
  period: Period;
  horoSign: number | null;
  numTab: NumTab;
  numSel: 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday';
  partnerName: string;
  partnerDate: string;
  signA: number | null;
  signB: number;
  openEntry: number | null;
  insightDismissed: boolean;
}

const INITIAL_UI: UiState = {
  starsTab: 'horoscope', period: 'daily', horoSign: null, numTab: 'core', numSel: 'lifePath',
  partnerName: '', partnerDate: '', signA: null, signB: 4, openEntry: null, insightDismissed: false,
};

export interface Derived {
  chart: Chart;
  nums: Numbers;
  sky: Sky;
}

interface AppValue {
  loaded: boolean;
  profile: Profile | null;
  journal: JournalEntry[];
  premium: boolean;
  notif: NotifSettings;
  notifBlocked: boolean;
  tab: TabId;
  paywall: boolean;
  toast: string | null;
  ui: UiState;
  report: Report | null;
  now: Date;
  derived: Derived | null;
  derivedError: string | null;

  go: (tab: TabId) => void;
  back: () => boolean;
  setUi: (patch: Partial<UiState>) => void;
  setProfile: (p: Profile) => Promise<void>;
  addJournal: (type: string, title: string, body: string, refs?: { recordIds?: string[]; evidence?: EvidenceMap }) => void;
  deleteJournal: (id: number) => void;
  showToast: (msg: string) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  startTrial: (plan: 'year' | 'month') => Promise<void>;
  manageMembership: () => Promise<void>;
  setNotif: (next: NotifSettings) => Promise<void>;
  openReport: (r: Report) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [premium, setPremium] = useState(false);
  const [notif, setNotifState] = useState<NotifSettings>(DEFAULT_NOTIF);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [history, setHistory] = useState<TabId[]>(['home']);
  const [paywall, setPaywall] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ui, setUiState] = useState<UiState>(INITIAL_UI);
  const [report, setReport] = useState<Report | null>(null);
  const [now, setNow] = useState(() => new Date());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tab = history[history.length - 1];

  useEffect(() => {
    let alive = true;
    void Promise.all([
      load<Profile | null>(KEYS.profile, null),
      load<JournalEntry[]>(KEYS.journal, []),
      billing.isEntitled(),
      load<NotifSettings>(KEYS.notif, DEFAULT_NOTIF),
    ]).then(([p, j, pr, n]) => {
      if (!alive) return;
      // Profiles from the prototype (cityIdx instead of place) are not usable; start onboarding again.
      setProfileState(p && 'place' in p ? p : null);
      setJournal(Array.isArray(j) ? j : []);
      setPremium(pr);
      setNotifState(typeof n === 'object' && n !== null && 'enabled' in n ? n : DEFAULT_NOTIF);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // Keep "now" current: every minute and whenever the app comes back to the foreground.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    const off = onResume(() => setNow(new Date()));
    return () => { clearInterval(id); off(); };
  }, []);

  // Refresh the scheduled notifications when the app opens or the profile changes.
  // (Changes to the setting itself are scheduled by setNotif.)
  const notifRef = useRef(notif);
  notifRef.current = notif;
  useEffect(() => {
    if (!loaded || !profile) return;
    const n = notifRef.current;
    void scheduleInsights(profile, n).then(ok => setNotifBlocked(!ok && n.enabled));
  }, [loaded, profile]);

  const { derived, error: derivedError } = useDerived(profile, now);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const go = useCallback((next: TabId) => {
    setHistory(h => (h[h.length - 1] === next ? h : [...h.filter(t => t !== next), next].slice(-12)));
    try { window.scrollTo(0, 0); } catch { /* jsdom */ }
  }, []);

  const back = useCallback((): boolean => {
    if (paywall) { setPaywall(false); return true; }
    if (history.length > 1) { setHistory(h => h.slice(0, -1)); try { window.scrollTo(0, 0); } catch { /* jsdom */ } return true; }
    return false;
  }, [paywall, history.length]);

  // Android back: close the paywall, then step back through visited tabs, then exit.
  const backRef = useRef(back);
  backRef.current = back;
  useEffect(() => onBackButton(() => backRef.current()), []);

  const setUi = useCallback((patch: Partial<UiState>) => setUiState(s => ({ ...s, ...patch })), []);

  const setProfile = useCallback(async (p: Profile) => {
    setProfileState(p);
    await save(KEYS.profile, p);
  }, []);

  const addJournal = useCallback<AppValue['addJournal']>((type, title, body, refs) => {
    setJournal(prev => {
      const next = [{ id: Date.now(), type, title, body, date: new Date().toISOString(), ...refs }, ...prev];
      void save(KEYS.journal, next);
      return next;
    });
    void tap();
    showToast('Saved to your journal');
  }, [showToast]);

  const deleteJournal = useCallback((id: number) => {
    setJournal(prev => { const next = prev.filter(e => e.id !== id); void save(KEYS.journal, next); return next; });
  }, []);

  const startTrial = useCallback(async (plan: 'year' | 'month') => {
    const ok = await billing.purchase(plan);
    setPremium(ok);
    setPaywall(false);
    if (ok) { void tap(); showToast('Welcome to Atlas+'); }
  }, [showToast]);

  const manageMembership = useCallback(async () => {
    if (premium) setPremium(await billing.manage());
    else setPaywall(true);
  }, [premium]);

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

  const resetAll = useCallback(async () => {
    await cancelInsights();
    await removeAll();
    setProfileState(null); setJournal([]); setPremium(false); setNotifState(DEFAULT_NOTIF);
    setUiState(INITIAL_UI); setReport(null); setHistory(['home']);
  }, []);

  const value: AppValue = {
    loaded, profile, journal, premium, notif, notifBlocked, tab, paywall, toast, ui, report, now, derived, derivedError,
    go, back, setUi, setProfile, addJournal, deleteJournal, showToast,
    openPaywall: () => setPaywall(true), closePaywall: () => setPaywall(false),
    startTrial, manageMembership, setNotif, openReport, resetAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
