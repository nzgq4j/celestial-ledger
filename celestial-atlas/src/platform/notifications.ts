// Daily insight notification: Personal Day + Moon sign, each morning at the chosen time.
// Local notifications carry fixed text, so the next 14 days are scheduled ahead with
// their own text and the schedule is refreshed whenever the app opens.
import { LocalNotifications } from '@capacitor/local-notifications';
import { PERSONAL_DAY, numbersCore, sky, type Profile } from '../engine/atlas';
import { isNative } from './native';

export interface NotifSettings {
  enabled: boolean;
  /** HH:MM local time */
  time: string;
}
export const DEFAULT_NOTIF: NotifSettings = { enabled: true, time: '08:00' };

const CHANNEL = 'daily-insight';
const DAYS_AHEAD = 14;
const ID_BASE = 1000;

export function insightFor(profile: Pick<Profile, 'name' | 'date'>, at: Date): { title: string; body: string } {
  const pd = numbersCore(profile, at).personalDay;
  const moon = sky(at).moon.sign.name;
  return { title: `Personal Day ${pd} · Moon in ${moon}`, body: PERSONAL_DAY[pd] };
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

/**
 * Reschedule the daily insight. Returns false when notifications are not permitted.
 * Asks for permission only when `ask` is true (the user just turned the setting on).
 */
export async function scheduleInsights(profile: Profile, settings: NotifSettings, ask = false): Promise<boolean> {
  if (!isNative()) return true;
  await cancelInsights();
  if (!settings.enabled) return true;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted' && ask) perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;
  await LocalNotifications.createChannel({ id: CHANNEL, name: 'Daily insight', importance: 3, visibility: 0 }).catch(() => undefined);
  await LocalNotifications.schedule({
    notifications: deliveryTimes(settings.time).map((at, i) => ({
      id: ID_BASE + i, channelId: CHANNEL, ...insightFor(profile, at), schedule: { at, allowWhileIdle: false }, smallIcon: 'ic_stat_atlas',
    })),
  });
  return true;
}
