import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonText, IonTitle, IonToolbar,
} from '@ionic/react';
import { arrowBackOutline, closeOutline } from 'ionicons/icons';
import { useState } from 'react';
import { fill, useStrings } from '../i18n';
import * as account from '../platform/account';
import { API_BASE } from '../platform/api';
import { useApp } from '../state/store';
import css from './screens.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const siteUrl = () => (API_BASE || window.location.origin);

type View = 'signin' | 'create';
type Message = { tone: 'danger' | 'medium'; text: string };

/** The account window: Sign in, with Create account as its own screen. */
export function SignIn() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.signin;
  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const trimmed = email.trim();
  const validEmail = EMAIL_RE.test(trimmed);

  const run = async (fn: () => Promise<void>) => {
    if (!validEmail) { setMessage({ tone: 'danger', text: s.invalidEmail }); return; }
    setBusy(true); setMessage(null);
    try { await fn(); }
    catch (e) { setMessage({ tone: 'danger', text: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };
  const done = () => { app.closeSignIn(); app.showToast(s.welcome); };
  // The email carries over between the two screens; passwords do not.
  const show = (next: View) => { setView(next); setPassword(''); setConfirm(''); setMessage(null); };

  const signIn = () => void run(async () => { await account.signInWithPassword(trimmed, password); done(); });
  const forgot = () => void run(async () => {
    await account.sendPasswordReset(trimmed, `${siteUrl()}/profile`);
    setMessage({ tone: 'medium', text: fill(s.resetSent, { email: trimmed }) });
  });
  const create = () => {
    if (password.length < MIN_PASSWORD) { setMessage({ tone: 'danger', text: strings.signin.passwordTooShort }); return; }
    if (password !== confirm) { setMessage({ tone: 'danger', text: s.passwordsDiffer }); return; }
    void run(async () => {
      const r = await account.signUp(trimmed, password, `${siteUrl()}/today`);
      if (r.alreadyExists) { show('signin'); setMessage({ tone: 'medium', text: fill(s.alreadyExists, { email: trimmed }) }); }
      else if (r.needsConfirmation) setMessage({ tone: 'medium', text: fill(s.created, { email: trimmed }) });
      else done();
    });
  };

  const creating = view === 'create';
  return (
    <>
      <IonHeader>
        <IonToolbar>
          {creating && (
            <IonButtons slot="start">
              <IonButton aria-label={strings.common.back} onClick={() => show('signin')}>
                <IonIcon aria-hidden="true" slot="icon-only" icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
          )}
          <IonTitle id="signin-title">{creating ? s.createTitle : s.title}</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label={strings.common.close} onClick={app.closeSignIn}><IonIcon aria-hidden="true" slot="icon-only" icon={closeOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form className={css.sheetBody} noValidate onSubmit={e => { e.preventDefault(); if (creating) create(); else signIn(); }}>
          <p className="body" style={{ marginTop: 0 }}>{creating ? s.createLead : s.lead}</p>
          <IonList lines="none" className="field-list" style={{ marginTop: 16 }}>
            <IonItem>
              <IonInput type="email" label={s.email} labelPlacement="stacked" fill="outline" autocomplete="email" inputmode="email"
                value={email} onIonInput={e => setEmail(String(e.detail.value ?? ''))} />
            </IonItem>
            <IonItem>
              <IonInput type="password" label={creating ? s.newPassword : s.passwordLabel} labelPlacement="stacked" fill="outline"
                autocomplete={creating ? 'new-password' : 'current-password'} helperText={creating ? s.passwordHint : undefined}
                value={password} onIonInput={e => setPassword(String(e.detail.value ?? ''))} />
            </IonItem>
            {creating && (
              <IonItem>
                <IonInput type="password" label={s.confirmPassword} labelPlacement="stacked" fill="outline" autocomplete="new-password"
                  value={confirm} onIonInput={e => setConfirm(String(e.detail.value ?? ''))} />
              </IonItem>
            )}
          </IonList>
          {message && <IonText color={message.tone} role="alert"><p className="small-text">{message.text}</p></IonText>}

          {creating ? (
            <>
              <IonButton type="submit" expand="block" disabled={busy || !trimmed || !password || !confirm}>{s.create}</IonButton>
              <div className={css.switchRow}>
                <span className="small">{s.haveAccount}</span>
                <IonButton fill="clear" size="small" onClick={() => show('signin')}>{s.signIn}</IonButton>
              </div>
            </>
          ) : (
            <>
              <IonButton type="submit" expand="block" disabled={busy || !trimmed || !password}>{s.signIn}</IonButton>
              <IonButton fill="clear" color="medium" size="small" disabled={busy} onClick={forgot}>{s.forgot}</IonButton>
              <div className={css.switchRow}>
                <span className="small">{s.newHere}</span>
                <IonButton fill="outline" size="small" onClick={() => show('create')}>{s.create}</IonButton>
              </div>
            </>
          )}
          {busy && <p className="small" role="status">{s.working}</p>}
        </form>
      </IonContent>
    </>
  );
}
