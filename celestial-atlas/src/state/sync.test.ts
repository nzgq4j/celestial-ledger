import { describe, expect, it } from 'vitest';
import type { Profile } from '../engine/atlas';
import { profileToRow, rowToEntry, rowToProfile } from '../platform/account';
import type { JournalEntry } from './journal';
import { chooseProfile, mergeJournal } from './sync';

const place = { id: 3035681, name: 'Avignon', region: "Provence-Alpes-Côte d'Azur", country: 'France', lat: 43.9493, lon: 4.8055, timeZone: 'Europe/Paris' };
const profile = (name: string, date = '1991-07-28'): Profile => ({ name, date, time: '06:45', timeUnknown: false, place });
const entry = (title: string, date: string, remoteId?: string): JournalEntry =>
  ({ id: Date.parse(date), type: 'Tarot', title, body: 'b', date, ...(remoteId ? { remoteId } : {}) });

describe('chooseProfile', () => {
  it('never moves a chart that belongs to another account', () => {
    expect(chooseProfile(null, profile('David Example'), true)).toEqual({ profile: null, upload: false });
    const remote = profile('Diane Example', '1990-02-02');
    expect(chooseProfile(remote, profile('David Example'), true)).toEqual({ profile: remote, upload: false });
  });
  it('adopts a chart made while signed out when the account has none', () => {
    const local = profile('Diane Example');
    expect(chooseProfile(null, local, false)).toEqual({ profile: local, upload: true });
  });

  it('keeps the account chart when it has a name', () => {
    const remote = profile('Amelia Rose Laurent');
    expect(chooseProfile(remote, profile('Someone Else', '2000-01-01'))).toEqual({ profile: remote, upload: false });
  });
  it('gives a legacy account chart the device name and uploads it', () => {
    const r = chooseProfile(profile(''), profile('Amelia Rose Laurent', '2000-01-01'));
    expect(r.upload).toBe(true);
    expect(r.profile?.name).toBe('Amelia Rose Laurent');
    expect(r.profile?.date).toBe('1991-07-28');
  });
  it('keeps a nameless account chart when the device has no name', () => {
    expect(chooseProfile(profile(''), null)).toEqual({ profile: profile(''), upload: false });
  });
  it('uploads the device profile when the account has none', () => {
    const local = profile('Amelia Rose Laurent');
    expect(chooseProfile(null, local)).toEqual({ profile: local, upload: true });
    expect(chooseProfile(null, null)).toEqual({ profile: null, upload: false });
  });
});

describe('mergeJournal', () => {
  it('keeps entries that failed to upload and orders newest first', () => {
    const remote = [entry('synced', '2026-11-20T10:00:00Z', 'r1')];
    const pending = [entry('offline', '2026-11-24T10:00:00Z'), entry('already', '2026-11-01T10:00:00Z', 'r0')];
    expect(mergeJournal(remote, pending).map(e => e.title)).toEqual(['offline', 'synced']);
  });
});

describe('account row mapping', () => {
  it('round-trips a profile through a database row', () => {
    const p = { ...profile('Amelia Rose Laurent'), disambiguation: 'later' as const };
    const row = profileToRow(p);
    expect(row).toMatchObject({ full_name: 'Amelia Rose Laurent', birth_time: '06:45', geoname_id: 3035681, time_zone: 'Europe/Paris' });
    expect(rowToProfile({ ...row, id: 'x', label: 'Me', birth_time: '06:45:00', created_at: '2026-11-25T00:00:00Z' })).toEqual(p);
  });
  it('stores no time when the birth time is unknown, and no name when blank', () => {
    const row = profileToRow({ ...profile('  '), timeUnknown: true, time: '' });
    expect(row.birth_time).toBeNull();
    expect(row.full_name).toBeNull();
    expect(row.time_unknown).toBe(true);
  });
  it('maps journal entry types back to their labels', () => {
    const e = rowToEntry({ id: 'u1', entry_type: 'card_of_day', title: 't', body: 'b', record_ids: [], evidence: {}, created_at: '2026-11-25T08:00:00Z' });
    expect(e).toMatchObject({ remoteId: 'u1', type: 'Card of the day', date: '2026-11-25T08:00:00Z' });
  });
});
