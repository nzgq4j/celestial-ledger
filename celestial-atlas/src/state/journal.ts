import type { EvidenceMap } from '../engine/records';

export interface JournalEntry {
  id: number;
  type: string;
  title: string;
  body: string;
  /** ISO timestamp */
  date: string;
  /** Calculation records the entry was produced from. */
  recordIds?: string[];
  /** The evidence the entry's claims rest on. */
  evidence?: EvidenceMap;
}

/** Above this many entries, consider moving the journal to @capacitor-community/sqlite. */
export const JOURNAL_SOFT_LIMIT = 500;
