// Key-value storage through @capacitor/preferences (SharedPreferences on Android,
// localStorage in a browser during development). Values are JSON.
import { Preferences } from '@capacitor/preferences';

export const KEYS = {
  profile: 'atlas_profile',
  journal: 'atlas_journal',
  premium: 'atlas_premium',
  notif: 'atlas_notif',
} as const;

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function save(key: string, value: unknown): Promise<void> {
  try { await Preferences.set({ key, value: JSON.stringify(value) }); } catch { /* storage unavailable */ }
}

export async function removeAll(): Promise<void> {
  await Promise.all(Object.values(KEYS).map(key => Preferences.remove({ key }).catch(() => undefined)));
}
