// Date and time fields that look the same on every phone. Native date and time
// inputs are drawn by the browser (iOS Safari ignores the field layout), so these
// fields open Ionic's own wheel picker in a bottom sheet instead.
import { IonButton, IonButtons, IonDatetime, IonHeader, IonIcon, IonModal, IonToolbar } from '@ionic/react';
import { calendarOutline, timeOutline } from 'ionicons/icons';
import { useId, useRef, useState } from 'react';
import { useContent, useStrings } from '../i18n';

interface Props {
  label: string;
  /** YYYY-MM-DD for dates, HH:MM for times; empty when not chosen. */
  value: string;
  onChange: (value: string) => void;
  kind: 'date' | 'time';
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Shown in the wheel when nothing is chosen yet. */
  initial?: string;
}

const pickTime = (v: string): string => v.match(/(\d{2}:\d{2})/)?.[1] ?? '';

export function PickerField({ label, value, onChange, kind, min, max, disabled, initial }: Props) {
  const s = useStrings();
  const c = useContent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLIonDatetimeElement>(null);
  const labelId = useId();

  const display = !value ? '' : kind === 'date'
    ? new Date(`${value}T12:00:00`).toLocaleDateString(c.locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(`2000-01-01T${value}:00`).toLocaleTimeString(c.locale, { hour: 'numeric', minute: '2-digit' });

  const start = value || initial || (kind === 'date' ? '1990-01-01' : '12:00');
  const done = () => {
    const raw = ref.current?.value;
    const v = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
    if (v) onChange(kind === 'date' ? v.slice(0, 10) : pickTime(v));
    setOpen(false);
  };

  return (
    <>
      {/* The button is named by its own text: the label, then the chosen value. */}
      <button type="button" className="picker-field" disabled={disabled} onClick={() => setOpen(true)}>
        <span className="picker-label" id={labelId}>{label}</span>{' '}
        <span className={value ? 'picker-value' : 'picker-value picker-placeholder'} id={`${labelId}-value`}>
          {display || (kind === 'date' ? s.onboarding.selectDate : s.onboarding.selectTime)}
        </span>
        <IonIcon aria-hidden="true" icon={kind === 'date' ? calendarOutline : timeOutline} className="picker-icon" />
      </button>
      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)} initialBreakpoint={1} breakpoints={[0, 1]}
        className="picker-sheet" aria-label={label}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonButton color="medium" onClick={() => setOpen(false)}>{s.common.cancel}</IonButton></IonButtons>
            <IonButtons slot="end"><IonButton color="primary" strong onClick={done}>{s.common.done}</IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonDatetime ref={ref} presentation={kind} preferWheel locale={c.locale}
          value={kind === 'date' ? start : `2000-01-01T${start}:00`} min={min} max={max} />
      </IonModal>
    </>
  );
}
