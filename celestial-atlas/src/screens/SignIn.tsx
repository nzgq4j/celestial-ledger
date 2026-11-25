import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonText, IonTitle, IonToolbar,
} from '@ionic/react';
import { arrowBackOutline, closeOutline } from 'ionicons/icons';
import { useState } from 'react';
import { fill, useStrings } from '../i18n';
import * as account from '../platform/account';
import { API_BASE } from '../platform/api';
import { isNative } from '../platform/native';
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
  // Google needs no email typed here; on the web the page leaves for Google.
  const google = async () => {
    setBusy(true); setMessage(null);
    try { await account.signInWithGoogle(`${siteUrl()}/auth/callback`); }
    catch { setMessage({ tone: 'danger', text: s.googleFailed }); }
    finally { setBusy(false); }
  };
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
  // The Android app signs in with Google only; email and password are web-only.
  const googleOnly = isNative();
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
          <button type="button" className={css.googleButton} disabled={busy} onClick={() => void google()}>
            <GoogleMark />
            <span>{s.google}</span>
          </button>
          {googleOnly ? (
            message && <IonText color={message.tone} role="alert"><p className="small-text">{message.text}</p></IonText>
          ) : (<>
            <div className={css.orRule} role="separator"><span>{s.or}</span></div>
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
          </>)}
          {busy && <p className="small" role="status">{s.working}</p>}
        </form>
      </IonContent>
    </>
  );
}

/** Google's "G" mark, as the brand guidelines require on sign-in buttons. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
