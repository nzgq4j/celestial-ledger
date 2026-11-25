// Daily insight notification: Personal Day + Moon sign, each morning at the chosen time.
// Local notifications carry fixed text, so the next 14 days are scheduled ahead with
// their own text and the schedule is refreshed whenever the app opens.
import { LocalNotifications } from '@capacitor/local-notifications';
import { EN, numbersCore, sky, type Profile } from '../engine/atlas';
import { fillTemplate, type Content } from '../engine/content';
import { isNative } from './native';
import { disablePush, enablePush } from './push';

export interface NotifSettings {
  /** The daily insight notification. */
  enabled: boolean;
  /** HH:MM local time */
  time: string;
  /** Occasional news and announcements from Celestial Atlas (push only). */
  news: boolean;
}
// On by default in the app (no prompt until scheduling); off on the web, where the browser must ask first.
export const DEFAULT_NOTIF: NotifSettings = { enabled: isNative(), time: '08:00', news: isNative() };

/** Reads saved settings. Older versions had one switch that also covered news. */
export function normalizeNotif(saved: unknown): NotifSettings {
  if (typeof saved !== 'object' || saved === null || !('enabled' in saved)) return DEFAULT_NOTIF;
  const s = saved as Partial<NotifSettings>;
  const enabled = s.enabled === true;
  const time = typeof s.time === 'string' && /^\d{2}:\d{2}$/.test(s.time) ? s.time : DEFAULT_NOTIF.time;
  return { enabled, time, news: typeof s.news === 'boolean' ? s.news : enabled };
}

/** True when either notification is on. */
export const anyNotif = (s: NotifSettings): boolean => s.enabled || s.news;

const CHANNEL = 'daily-insight';
const DAYS_AHEAD = 14;
const ID_BASE = 1000;

export function insightFor(profile: Pick<Profile, 'name' | 'date'>, at: Date, c: Content = EN): { title: string; body: string } {
  const pd = numbersCore(profile, at).personalDay;
  const moon = c.signs[sky(at).moon.signIdx].name;
  return { title: fillTemplate(c.notification.title, { day: pd, moon }), body: c.personalDay[pd] };
}

/** The next `DAYS_AHEAD` delivery times at `time`, starting today if it is still ahead. */
export function deliveryTimes(time: string, now: Date = new Date()): Date[] {
  const [h, m] = time.split(':').map(Number);
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  if (first <= now) first.setDate(first.getDate() + 1);
  return Array.from({ length: DAYS_AHEAD }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, h, m));
}

export async function cancelInsights(): Promise<void> {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: Array.from({ length: DAYS_AHEAD }, (_, i) => ({ id: ID_BASE + i })) });
  } catch { /* nothing scheduled */ }
}

/** Schedules the daily insight on the device itself (Android app without push). */
async function scheduleLocal(profile: Profile, settings: NotifSettings, ask: boolean, c: Content): Promise<boolean> {
  if (!isNative()) return true;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted' && ask) perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;
  await LocalNotifications.createChannel({ id: CHANNEL, name: 'Daily insight', importance: 3, visibility: 0 }).catch(() => undefined);
  await LocalNotifications.schedule({
    notifications: deliveryTimes(settings.time).map((at, i) => ({
      id: ID_BASE + i, channelId: CHANNEL, ...insightFor(profile, at, c), schedule: { at, allowWhileIdle: false }, smallIcon: 'ic_stat_atlas',
      // A morning insight does not need exact timing. Inexact alarms avoid the restricted
      // SCHEDULE_EXACT_ALARM permission (removed in AndroidManifest.xml) and its settings prompt.
      isExactNotification: false,
    })),
  });
  return true;
}

/** 'ok': set up (or off); 'blocked': the system refused; 'needs-permission': the browser has not asked yet; 'failed': push could not be set up. */
export type InsightSync = 'ok' | 'blocked' | 'needs-permission' | 'failed';

/**
 * Sets up the daily insight: push from the server when this device supports it
 * (texts composed here for the next 14 days), otherwise the on-device schedule.
 * Asks for permission only when `ask` is true (the reader just turned it on).
 */
export async function syncInsights(profile: Profile, settings: NotifSettings, ask = false, c: Content = EN): Promise<InsightSync> {
  if (!anyNotif(settings)) {
    await cancelInsights();
    await disablePush().catch(() => undefined);
    return 'ok';
  }
  // News alone registers the device with no daily messages.
  const insights = settings.enabled ? deliveryTimes(settings.time).map(at => ({ at, ...insightFor(profile, at, c) })) : [];
  const outcome = await enablePush({ ask, locale: c.locale.slice(0, 2), insights, announcements: settings.news });
  if (outcome === 'push') { await cancelInsights(); return 'ok'; }
  if (outcome === 'denied') return 'blocked';
  if (outcome === 'needs-permission' && !isNative()) return 'needs-permission';
  // The web has no on-device fallback, and news always needs push.
  if (!isNative() || !settings.enabled) return 'failed';
  await cancelInsights();
  return (await scheduleLocal(profile, settings, ask, c)) ? 'ok' : 'blocked';
}
