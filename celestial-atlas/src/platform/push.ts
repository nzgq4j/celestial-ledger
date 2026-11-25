// Push notifications: Firebase Cloud Messaging in the Android app, Web Push on
// the website and in the iPhone home-screen app. The app composes its own
// daily-insight texts and uploads them with their send times; the server only
// delivers them, so no birth data leaves the device.
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { API_BASE } from './api';
import { load, save } from './storage';
import { supabase } from './supabase';

const DEVICE_KEY = 'atlas_push_device';
const VAPID_KEY: string | undefined =
  import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? import.meta.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
/** Android builds set this only when google-services.json is present; without Firebase, registering would crash. */
const ANDROID_PUSH = import.meta.env.VITE_ANDROID_PUSH === 'true';

export type PushSupport = 'native' | 'web' | 'needs-home-screen' | 'unsupported';
export type PushOutcome = 'push' | 'denied' | 'needs-permission' | 'unavailable';
export interface Insight { at: Date; title: string; body: string }

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function pushSupport(): PushSupport {
  if (Capacitor.isNativePlatform()) return ANDROID_PUSH ? 'native' : 'unsupported';
  if (typeof window === 'undefined') return 'unsupported';
  const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!VAPID_KEY;
  if (capable) return 'web';
  // iPhone Safari offers Web Push only to sites added to the Home Screen (iOS 16.4+).
  return isIos() && !standalone() ? 'needs-home-screen' : 'unsupported';
}

async function deviceKey(): Promise<string> {
  const saved = await load<string | null>(DEVICE_KEY, null);
  if (saved && /^[A-Za-z0-9_-]{43}$/.test(saved)) return saved;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const key = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await save(DEVICE_KEY, key);
  return key;
}

async function send(method: 'POST' | 'DELETE', body: unknown): Promise<boolean> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  try {
    const res = await fetch(`${API_BASE}/api/push/device`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * On the web, asks for notification permission straight away. Call it directly
 * from the tap on the switch: Safari only shows the prompt during a user gesture.
 */
export function primePermission(): void {
  if (pushSupport() === 'web' && Notification.permission === 'default') void Notification.requestPermission();
}

const b64uToBytes = (s: string) => {
  const raw = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

async function webSubscription(ask: boolean): Promise<PushSubscriptionJSON | 'denied' | 'needs-permission' | null> {
  let permission = Notification.permission;
  if (permission === 'default' && ask) permission = await Notification.requestPermission();
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'needs-permission';
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(VAPID_KEY!) }));
  return sub.toJSON();
}

async function nativeToken(ask: boolean): Promise<string | 'denied' | 'needs-permission' | null> {
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted' && ask) perm = await PushNotifications.requestPermissions();
  if (perm.receive === 'denied') return 'denied';
  if (perm.receive !== 'granted') return 'needs-permission';
  await PushNotifications.createChannel({ id: 'daily-insight', name: 'Daily insight', importance: 3, visibility: 0 }).catch(() => undefined);
  await PushNotifications.createChannel({ id: 'announcements', name: 'Announcements', importance: 3, visibility: 0 }).catch(() => undefined);
  return new Promise(resolve => {
    const handles: Promise<{ remove: () => Promise<void> }>[] = [];
    const done = (value: string | null) => {
      clearTimeout(timer);
      handles.forEach(h => void h.then(x => x.remove()));
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 15_000);
    handles.push(PushNotifications.addListener('registration', t => done(t.value)));
    handles.push(PushNotifications.addListener('registrationError', () => done(null)));
    PushNotifications.register().catch(() => done(null));
  });
}

/** Registers this device for push and uploads its upcoming insights. */
export async function enablePush(opts: { ask: boolean; locale: string; insights: Insight[] }): Promise<PushOutcome> {
  const support = pushSupport();
  if (support !== 'native' && support !== 'web') return 'unavailable';
  try {
    const address = support === 'native' ? await nativeToken(opts.ask) : await webSubscription(opts.ask);
    if (address === 'denied' || address === 'needs-permission') return address;
    if (!address) return 'unavailable';
    const body = {
      deviceKey: await deviceKey(),
      platform: support === 'native' ? 'android' : 'web',
      ...(typeof address === 'string'
        ? { fcmToken: address }
        : { subscription: { endpoint: address.endpoint, keys: { p256dh: address.keys?.p256dh, auth: address.keys?.auth } } }),
      locale: ['en', 'es', 'fr', 'de'].includes(opts.locale) ? opts.locale : 'en',
      announcements: true,
      insights: opts.insights.map(i => ({ at: i.at.toISOString(), title: i.title, body: i.body })),
    };
    return (await send('POST', body)) ? 'push' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Turns push off for this device: the server forgets its address and messages. */
export async function disablePush(): Promise<void> {
  const key = await load<string | null>(DEVICE_KEY, null);
  if (key) await send('DELETE', { deviceKey: key });
  if (pushSupport() === 'web') {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js').catch(() => undefined);
    await (await reg?.pushManager.getSubscription())?.unsubscribe().catch(() => undefined);
  }
}

/** Opens the in-app page a tapped notification points to. */
export function onPushTap(open: (path: string) => void): () => void {
  if (!Capacitor.isNativePlatform() || !ANDROID_PUSH) return () => undefined;
  const handle = PushNotifications.addListener('pushNotificationActionPerformed', a => {
    const url = (a.notification.data as { url?: unknown } | undefined)?.url;
    open(typeof url === 'string' && url.startsWith('/') ? url : '/today');
  });
  return () => void handle.then(h => h.remove());
}
