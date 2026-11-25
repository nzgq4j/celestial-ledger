import { IonButton, IonContent, IonFooter, IonInput, IonItem, IonList, IonText, IonToolbar } from '@ionic/react';
import { useKeyboardOpen } from '../ui/useKeyboardOpen';
import { useState } from 'react';
import { fill, useStrings } from '../i18n';
import { useApp } from '../state/store';
import { nameProblem, nameUsable, validDate } from '../state/validation';
import { DateTimeFields, TimeZoneCheck, blankDraft, draftToProfile, timeStatus, type Draft } from './BirthFields';
import { PlaceSearch } from './PlaceSearch';
import css from './screens.module.css';

export function Onboarding() {
  const app = useApp();
  const s = useStrings();
  const o = s.onboarding;
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
    await app.setProfile(profile);
    app.go('home');
  };

  const problem = nameProblem(draft.name);
  // The step buttons would sit behind the phone keyboard's toolbar; hide them while typing.
  const keyboardOpen = useKeyboardOpen();

  return (
    <div className="ion-page">
      <div className={css.safeTop} aria-hidden="true" />
      <IonContent fullscreen>
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
                <div className="eyebrow" style={{ letterSpacing: '0.22em', marginBottom: 14 }}>{o.welcomeKicker}</div>
                <h1 className="display" style={{ fontSize: 54, lineHeight: 1, marginBottom: 18 }}>{s.appName}</h1>
                <p className={css.welcomeLead}>{o.welcomeLead}</p>
                <IonButton expand="block" size="large" onClick={next}>{o.start}</IonButton>
                <p className="note" style={{ marginTop: 16 }}>{o.startNote}</p>
                {app.account.available && (
                  <p className="small" style={{ marginTop: 18 }}>
                    {o.haveAccount}{' '}
                    <IonButton fill="clear" size="small" onClick={app.openSignIn}>{s.common.signIn}</IonButton>
                  </p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="fade-up">
                <div className="eyebrow" style={{ marginBottom: 10 }}>{fill(o.step, { n: 1 })}</div>
                <h2 className={css.stepTitle}>{o.nameTitle}</h2>
                <p className={css.stepLead}>{o.nameLead}</p>
                <IonList lines="none" className="field-list">
                  <IonItem>
                    <IonInput label={o.nameLabel} labelPlacement="stacked" fill="outline" value={draft.name} autocomplete="name"
                      placeholder={o.namePlaceholder} onIonInput={e => set({ name: String(e.detail.value ?? '') })}
                      onKeyDown={e => { if (e.key === 'Enter') void next(); }} />
                  </IonItem>
                </IonList>
                {problem && <IonText color="danger" role="alert"><p className="small-text">{o[problem]}</p></IonText>}
              </div>
            )}

            {step === 2 && (
              <div className="fade-up">
                <div className="eyebrow" style={{ marginBottom: 10 }}>{fill(o.step, { n: 2 })}</div>
                <h2 className={css.stepTitle}>{o.whenTitle}</h2>
                <p className={css.stepLead}>{o.whenLead}</p>
                <DateTimeFields draft={draft} set={set} />
              </div>
            )}

            {step === 3 && (
              <div className="fade-up">
                <div className="eyebrow" style={{ marginBottom: 10 }}>{fill(o.step, { n: 3 })}</div>
                <h2 className={css.stepTitle}>{o.whereTitle}</h2>
                <p className={css.stepLead}>{o.whereLead}</p>
                <div className="stack" style={{ gap: 16 }}>
                  <PlaceSearch value={draft.place} onChange={place => set({ place, disambiguation: undefined })} label={o.birthplace} />
                  <TimeZoneCheck draft={draft} set={set} />
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
      {step > 0 && !keyboardOpen && (
        <IonFooter>
          <IonToolbar>
            <div className={css.onbNav}>
              <IonButton fill="clear" color="medium" onClick={() => setStep(Math.max(0, step - 1))}>{o.back}</IonButton>
              <IonButton color="primary" fill="solid" disabled={blocked} onClick={next}>{step === 3 ? o.create : o.continue}</IonButton>
            </div>
          </IonToolbar>
        </IonFooter>
      )}
    </div>
  );
}
