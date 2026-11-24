import { useState } from 'react';
import { useApp } from '../state/store';
import { nameProblem, nameUsable, validDate } from '../state/validation';
import { DateTimeFields, TimeZoneCheck, blankDraft, draftToProfile, timeStatus, type Draft } from './BirthFields';
import { PlaceSearch } from './PlaceSearch';
import css from './screens.module.css';

export function Onboarding() {
  const { setProfile, go } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraftState] = useState<Draft>(blankDraft);
  const set = (p: Partial<Draft>) => setDraftState(d => ({ ...d, ...p }));

  const status = timeStatus(draft);
  const blocked =
    (step === 1 && !nameUsable(draft.name)) ||
    (step === 2 && (!validDate(draft.date) || (!draft.timeUnknown && !draft.time))) ||
    (step === 3 && status !== 'ok');

  const next = async () => {
    if (blocked) return;
    if (step < 3) { setStep(step + 1); return; }
    const profile = draftToProfile(draft);
    if (!profile) return;
    await setProfile(profile);
    go('home');
  };

  const nameMsg = nameProblem(draft.name);

  return (
    <div className={css.onboard}>
      <div className={css.onboardInner}>
        <div className={css.dots} aria-hidden="true">
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: i === step ? 28 : 8, background: i <= step ? 'var(--gold)' : 'rgba(201,163,90,0.25)' }} />
          ))}
        </div>

        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div className={css.welcomeMark} aria-hidden="true">
              <div className={css.welcomeDash} />
              <div className={css.crossV} style={{ top: -8, bottom: -8 }} />
              <div className={css.crossH} style={{ left: -8, right: -8 }} />
              <div className={css.welcomeCore} />
            </div>
            <div className="eyebrow" style={{ letterSpacing: '0.22em', marginBottom: 14 }}>Welcome to</div>
            <h1 className="display" style={{ fontSize: 54, lineHeight: 1, marginBottom: 18, letterSpacing: '0.01em' }}>Celestial Atlas</h1>
            <p className={css.welcomeLead}>Your birth chart, your numbers, and the cards — read together, in plain language you can actually use.</p>
            <button type="button" className="btn-primary" style={{ padding: '15px 36px', fontSize: 15, letterSpacing: '0.04em' }} onClick={next}>Build my atlas</button>
            <p className="note" style={{ fontSize: 12.5, marginTop: 20 }}>Takes about a minute. Saved on this device only.</p>
          </div>
        )}

        {step === 1 && (
          <div className="fade-up">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Step 1 of 3</div>
            <h2 className={css.stepTitle} id="name-title">What's your full birth name?</h2>
            <p className={css.stepLead}>Numerology uses every letter of the name on your birth certificate — first, middle, and last.</p>
            <input className="input" type="text" aria-labelledby="name-title" value={draft.name} autoComplete="name"
              onChange={e => set({ name: e.target.value })} placeholder="e.g. Amelia Rose Laurent" style={{ fontSize: 17, padding: '15px 16px' }}
              onKeyDown={e => { if (e.key === 'Enter') void next(); }} />
            {nameMsg && <p className="error" role="alert" style={{ marginTop: 10 }}>{nameMsg}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Step 2 of 3</div>
            <h2 className={css.stepTitle}>When were you born?</h2>
            <p className={css.stepLead}>Your birth time sets your rising sign. If you don't know it, we'll leave rising out.</p>
            <div className="stack" style={{ gap: 16 }}>
              <DateTimeFields draft={draft} set={set} />
              <label className="check">
                <input type="checkbox" checked={draft.timeUnknown} onChange={e => set({ timeUnknown: e.target.checked, disambiguation: undefined })} />
                I don't know my birth time
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-up">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Step 3 of 3</div>
            <h2 className={css.stepTitle}>Where were you born?</h2>
            <p className={css.stepLead}>Pick the closest city — location and time zone place your chart.</p>
            <div className="stack" style={{ gap: 16 }}>
              <PlaceSearch value={draft.place} onChange={place => set({ place, disambiguation: undefined })} label="Birthplace" />
              <TimeZoneCheck draft={draft} set={set} />
            </div>
          </div>
        )}

        {step > 0 && (
          <div className={css.onbNav}>
            <button type="button" className="btn-quiet" onClick={() => setStep(Math.max(0, step - 1))}>← Back</button>
            <button type="button" className="btn-primary" style={{ padding: '14px 30px', fontSize: 15 }} disabled={blocked} onClick={next}>
              {step === 3 ? 'Create my atlas' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
