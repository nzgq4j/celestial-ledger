import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonInput, IonItem, IonLabel, IonList, IonNote,
  IonSelect, IonSelectOption, IonText, IonToggle, useIonAlert,
} from '@ionic/react';
import { useState } from 'react';
import { AVAILABLE_LOCALES, LANGUAGE_NAMES, fill, useStrings, type Locale } from '../i18n';
import * as account from '../platform/account';
import { ApiError } from '../platform/api';
import { billing } from '../platform/billing';
import { isNative } from '../platform/native';
import { primePermission, pushSupport } from '../platform/push';
import { PickerField } from '../ui/PickerField';
import { useApp } from '../state/store';
import { nameProblem, nameUsable } from '../state/validation';
import { CalcDetails } from '../ui/components';
import { DateTimeFields, TimeZoneCheck, blankDraft, draftFromProfile, draftToProfile, type Draft } from './BirthFields';
import { PlaceSearch } from './PlaceSearch';
import css from './screens.module.css';

export function Profile() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.profile;
  const o = strings.onboarding;
  const [alert] = useIonAlert();
  const p = app.profile;
  const [draft, setDraft] = useState<Draft>(() => (p ? draftFromProfile(p) : blankDraft));
  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const problem = nameProblem(draft.name);
  const m = app.account.membership;
  const support = pushSupport();
  // The Android app can always use on-device notifications; the web needs push.
  const notifPossible = isNative() || support === 'web';
  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(app.locale, { year: 'numeric', month: 'long', day: 'numeric' }) : '');

  const saveProfile = async () => {
    const next = nameUsable(draft.name) ? draftToProfile(draft) : null;
    if (!next) { app.showToast(s.invalid); return; }
    await app.setProfile(next);
    app.showToast(s.saved);
  };

  const confirmReset = () => void alert({
    message: s.resetConfirm,
    buttons: [
      { text: strings.common.cancel, role: 'cancel' },
      { text: s.reset, role: 'destructive', handler: () => { void app.resetAll(); } },
    ],
  });

  const confirmDelete = () => void alert({
    header: s.deleteTitle,
    message: s.deleteCopy,
    inputs: [{ name: 'confirm', type: 'text', placeholder: 'DELETE', attributes: { autocapitalize: 'characters', 'aria-label': 'DELETE' } }],
    buttons: [
      { text: strings.common.cancel, role: 'cancel' },
      {
        text: s.deleteAccount, role: 'destructive',
        handler: (values: { confirm?: string }) => {
          if (values.confirm?.trim() !== 'DELETE') return false;
          void account.deleteAccount().then(async () => {
            await app.resetAll();
            app.showToast(s.deleted);
          }).catch((e: unknown) => {
            if (e instanceof ApiError && e.code === 'REAUTH_REQUIRED') { app.showToast(s.deleteReauth); app.openSignIn(); return; }
            app.showToast(e instanceof ApiError && e.code === 'ACTIVE_SUBSCRIPTION' ? s.deleteActiveSub : e instanceof Error ? e.message : String(e));
          });
          return true;
        },
      },
    ],
  });

  return (
    <div className="screen fade-up" style={{ gap: 18, maxWidth: 640 }}>
      <div className={css.pageHead}>
        <div className="eyebrow">{s.eyebrow}</div>
        <h1 className="h1">{p?.name || s.eyebrow}</h1>
      </div>

      {p && (
        <IonCard>
          <IonCardHeader><IonCardSubtitle className="eyebrow">{s.birthDetails}</IonCardSubtitle></IonCardHeader>
          <IonCardContent className="stack" style={{ gap: 6 }}>
            <IonList lines="none" className="field-list">
              <IonItem>
                <IonInput label={s.fullName} labelPlacement="stacked" fill="outline" value={draft.name} autocomplete="name"
                  onIonInput={e => set({ name: String(e.detail.value ?? '') })} />
              </IonItem>
            </IonList>
            {problem && <IonText color="danger" role="alert"><p className="small-text">{o[problem]}</p></IonText>}
            <DateTimeFields draft={draft} set={set} />
            <PlaceSearch value={draft.place} onChange={place => set({ place, disambiguation: undefined })} label={s.changePlace} />
            <TimeZoneCheck draft={draft} set={set} />
            <IonButton onClick={() => void saveProfile()}>{s.save}</IonButton>
            {app.derived && <CalcDetails records={[app.derived.chart.record]} summary={strings.common.howCalculated} />}
          </IonCardContent>
        </IonCard>
      )}

      {app.account.available && (
        <IonCard>
          <IonCardHeader><IonCardSubtitle className="eyebrow">{s.account}</IonCardSubtitle></IonCardHeader>
          <IonCardContent className="stack" style={{ gap: 10 }}>
            {app.account.email ? (
              <>
                <p className="body" style={{ margin: 0 }}>{fill(s.signedInAs, { email: app.account.email })}</p>
                <p className="small" style={{ margin: 0 }}>{app.account.syncing ? s.syncing : s.synced}</p>
                <div className={css.buttonRow}>
                  <IonButton fill="outline" onClick={() => void app.signOut()}>{s.signOut}</IonButton>
                  <IonButton fill="clear" color="danger" onClick={confirmDelete}>{s.deleteAccount}</IonButton>
                </div>
              </>
            ) : (
              <>
                <p className="small" style={{ margin: 0 }}>{s.notSignedIn}</p>
                <IonButton onClick={app.openSignIn}>{strings.common.signIn}</IonButton>
              </>
            )}
          </IonCardContent>
        </IonCard>
      )}

      <IonCard>
        <IonList lines="full">
          <IonItem>
            <IonSelect label={s.language} interface="action-sheet" value={app.locale}
              onIonChange={e => app.setLocale(e.detail.value as Locale)}>
              {AVAILABLE_LOCALES.map(l => <IonSelectOption key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonToggle checked={app.notif.enabled && notifPossible} disabled={!notifPossible}
              onIonChange={e => {
                // Safari only shows the permission prompt during the tap itself.
                if (e.detail.checked) primePermission();
                void app.setNotif({ ...app.notif, enabled: e.detail.checked });
              }}>
              <IonLabel className="ion-text-wrap">
                <h3>{s.notifTitle}</h3>
                <p>{s.notifCopy}</p>
                {support === 'needs-home-screen' && <p>{s.notifHomeScreen}</p>}
                {support === 'unsupported' && !isNative() && <p>{s.notifUnsupported}</p>}
                {app.notifIssue && <IonText color="danger"><p>{app.notifIssue === 'blocked' ? s.notifBlocked : s.notifFailed}</p></IonText>}
              </IonLabel>
            </IonToggle>
          </IonItem>
          {app.notif.enabled && notifPossible && (
            <IonItem>
              <PickerField kind="time" label={s.notifTime} value={app.notif.time}
                onChange={time => void app.setNotif({ ...app.notif, time })} />
            </IonItem>
          )}
          <IonItem>
            <IonLabel className="ion-text-wrap">
              <h3>{s.membership}</h3>
              <p>{app.premium ? s.member : s.free}</p>
              {m?.currentPeriodEnd && <p>{fill(m.cancelAtPeriodEnd ? s.ends : s.renews, { date: fmt(m.currentPeriodEnd) })}</p>}
            </IonLabel>
            <IonButton slot="end" fill="outline" onClick={() => void app.manageMembership()}>
              {app.premium ? (billing.isDemo ? s.cancelTrial : s.manage) : s.upgrade}
            </IonButton>
          </IonItem>
          <IonItem button detail onClick={() => app.go('privacy')}><IonLabel>{s.privacy}</IonLabel></IonItem>
          <IonItem button detail onClick={() => app.go('terms')}><IonLabel>{s.terms}</IonLabel></IonItem>
          <IonItem lines="none">
            <IonButton fill="clear" color="danger" className="link-button" onClick={confirmReset}>{s.reset}</IonButton>
          </IonItem>
        </IonList>
      </IonCard>

      <IonNote className="note" style={{ lineHeight: 1.6, display: 'block' }}>{s.credits}</IonNote>
    </div>
  );
}
