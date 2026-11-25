import { IonCheckbox, IonItem, IonList, IonRadio, IonRadioGroup, IonText } from '@ionic/react';
import { DateTime } from 'luxon';
import type { Profile } from '../engine/atlas';
import type { Place } from '../engine/places';
import { birthTimeProblem, resolveBirthTime, type Disambiguation } from '../engine/time';
import { fill, useStrings } from '../i18n';
import { MIN_DATE, todayISO, validDate } from '../state/validation';
import { PickerField } from '../ui/PickerField';

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

export function DateTimeFields({ draft, set, withUnknown = true }: { draft: Draft; set: (p: Partial<Draft>) => void; withUnknown?: boolean }) {
  const s = useStrings();
  return (
    <IonList lines="none" className="field-list">
      <IonItem>
        <PickerField kind="date" label={s.onboarding.dateLabel} value={draft.date} min={MIN_DATE} max={todayISO()}
          onChange={date => set({ date, disambiguation: undefined })} />
      </IonItem>
      <IonItem>
        <PickerField kind="time" label={s.onboarding.timeLabel} value={draft.time} disabled={draft.timeUnknown}
          onChange={time => set({ time, disambiguation: undefined })} />
      </IonItem>
      {withUnknown && (
        <IonItem>
          <IonCheckbox checked={draft.timeUnknown} labelPlacement="end" justify="start"
            onIonChange={e => set({ timeUnknown: e.detail.checked, disambiguation: undefined })}>
            {s.onboarding.timeUnknown}
          </IonCheckbox>
        </IonItem>
      )}
    </IonList>
  );
}

/** Explains how the local birth time maps to UTC, and asks about repeated times. */
export function TimeZoneCheck({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  const s = useStrings();
  if (!draft.place) return null;
  const status = timeStatus(draft);
  if (status === 'NONEXISTENT') return <IonText color="danger" role="alert"><p className="small-text">{s.time.nonexistent}</p></IonText>;
  if (status === 'INVALID') return <IonText color="danger" role="alert"><p className="small-text">{s.time.invalid}</p></IonText>;
  const ambiguous = status === 'AMBIGUOUS' || !!draft.disambiguation;
  let offset = '';
  if (status === 'ok') {
    const r = resolveBirthTime(draft, draft.place.timeZone);
    offset = DateTime.fromJSDate(r.utc, { zone: draft.place.timeZone }).toFormat("'UTC'ZZ");
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      {ambiguous && (
        <IonRadioGroup value={draft.disambiguation} onIonChange={e => set({ disambiguation: e.detail.value as Disambiguation })}>
          <p className="body" id="ambiguous-label">{s.time.ambiguous}</p>
          <IonItem lines="none"><IonRadio value="earlier" labelPlacement="end" justify="start">{s.time.earlier}</IonRadio></IonItem>
          <IonItem lines="none"><IonRadio value="later" labelPlacement="end" justify="start">{s.time.later}</IonRadio></IonItem>
        </IonRadioGroup>
      )}
      {status === 'ok' && <p className="small" style={{ margin: 0 }}>{fill(s.time.zone, { zone: draft.place.timeZone, offset })}</p>}
    </div>
  );
}
