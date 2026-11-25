import type { JournalEntry } from './journal';
import type { Profile } from '../engine/atlas';

/**
 * Decide which birth profile survives sign-in.
 * The account's chart wins when it has a name; a legacy account chart without a name borrows the
 * device's name; with no account chart, the device's profile is uploaded.
 */
export function chooseProfile(
  remote: Profile | null,
  local: Profile | null,
  localBelongsToOtherAccount = false,
): { profile: Profile | null; upload: boolean } {
  // A chart synced to another account never moves to this one.
  if (localBelongsToOtherAccount) return { profile: remote, upload: false };
  if (remote && remote.name.trim()) return { profile: remote, upload: false };
  if (remote) {
    const name = local?.name.trim() ?? '';
    return { profile: name ? { ...remote, name } : remote, upload: !!name };
  }
  return { profile: local, upload: !!local };
}

/** The account's entries, plus any device entries that have not reached the account yet, newest first. */
export function mergeJournal(remote: JournalEntry[], pendingLocal: JournalEntry[]): JournalEntry[] {
  return [...remote, ...pendingLocal.filter(e => !e.remoteId)]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
