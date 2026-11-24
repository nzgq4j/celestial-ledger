import { DateTime } from 'luxon';
import type { Profile } from '../engine/atlas';
import type { Place } from '../engine/places';
import { birthTimeProblem, resolveBirthTime, type Disambiguation } from '../engine/time';
import { MIN_DATE, todayISO, validDate } from '../state/validation';

export interface Draft {
  name: string;
  date: string;
  time: string;
  timeUnknown: boolean;
  place: Place | null;
  disambiguation?: Disambiguation;
}

export const blankDraft: Draft = { name: '', date: '', time: '', timeUnknown: false, place: null };

export const draftFromProfile = (p: Profile): Draft => ({ ...p });

/** The draft's time check against the chosen birthplace's time zone. */
export function timeStatus(d: Draft): 'ok' | 'incomplete' | 'NONEXISTENT' | 'AMBIGUOUS' | 'INVALID' {
  if (!d.place || !validDate(d.date) || (!d.timeUnknown && !d.time)) return 'incomplete';
  return birthTimeProblem(d, d.place.timeZone) ?? 'ok';
}

export function draftToProfile(d: Draft): Profile | null {
  if (timeStatus(d) !== 'ok' || !d.place) return null;
  return {
    name: d.name.trim(), date: d.date, time: d.timeUnknown ? '' : d.time, timeUnknown: d.timeUnknown, place: d.place,
    ...(d.disambiguation ? { disambiguation: d.disambiguation } : {}),
  };
}

export function DateTimeFields({ draft, set, compact = false }: { draft: Draft; set: (p: Partial<Draft>) => void; compact?: boolean }) {
  return (
    <div style={{ display: compact ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', flexDirection: 'column', gap: 16 }}>
      <label className="field">{compact ? 'Date' : 'Date of birth'}
        <input className="input" type="date" value={draft.date} min={MIN_DATE} max={todayISO()}
          onChange={e => set({ date: e.target.value, disambiguation: undefined })} />
      </label>
      <label className="field">{compact ? 'Time' : 'Time of birth'}
        <input className="input" type="time" value={draft.time} disabled={draft.timeUnknown}
          onChange={e => set({ time: e.target.value, disambiguation: undefined })} />
      </label>
    </div>
  );
}

/** Explains how the local birth time maps to UTC, and asks about repeated times. */
export function TimeZoneCheck({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  if (!draft.place) return null;
  const status = timeStatus({ ...draft, disambiguation: draft.disambiguation });
  if (status === 'NONEXISTENT') {
    return <p className="error" role="alert">This local time did not exist because the clock moved forward. Check the recorded time.</p>;
  }
  if (status === 'INVALID') return <p className="error" role="alert">Enter a valid birth date and time.</p>;
  const ambiguous = status === 'AMBIGUOUS' || !!draft.disambiguation;
  let offset = '';
  if (status === 'ok') {
    const r = resolveBirthTime(draft, draft.place.timeZone);
    offset = DateTime.fromJSDate(r.utc, { zone: draft.place.timeZone }).toFormat("'UTC'ZZ");
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      {ambiguous && (
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="body" style={{ marginBottom: 6 }}>This local time occurred twice because the clock moved backward. Select the earlier or later occurrence.</legend>
          {(['earlier', 'later'] as const).map(k => (
            <label key={k} className="check">
              <input type="radio" name="disambiguation" checked={draft.disambiguation === k} onChange={() => set({ disambiguation: k })} />
              {k === 'earlier' ? 'Earlier occurrence' : 'Later occurrence'}
            </label>
          ))}
        </fieldset>
      )}
      {status === 'ok' && (
        <p className="small" style={{ margin: 0 }}>
          Time zone {draft.place.timeZone} · {offset} on that date.
        </p>
      )}
    </div>
  );
}
