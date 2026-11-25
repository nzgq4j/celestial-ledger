import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton,
  IonText, IonTitle, IonToolbar,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useState } from 'react';
import { fill, useStrings } from '../i18n';
import * as account from '../platform/account';
import { API_BASE } from '../platform/api';
import { useApp } from '../state/store';
import css from './screens.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const siteUrl = () => (API_BASE || window.location.origin);

export function SignIn() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.signin;
  const [method, setMethod] = useState<'code' | 'password'>('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'danger' | 'medium'; text: string } | null>(null);
  const validEmail = EMAIL_RE.test(email.trim());

  const run = async (fn: () => Promise<void>) => {
    if (!validEmail) { setMessage({ tone: 'danger', text: s.invalidEmail }); return; }
    setBusy(true); setMessage(null);
    try { await fn(); }
    catch (e) { setMessage({ tone: 'danger', text: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };
  const done = () => { app.closeSignIn(); app.showToast(s.welcome); };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle id="signin-title">{s.title}</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label={strings.common.close} onClick={app.closeSignIn}><IonIcon aria-hidden="true" slot="icon-only" icon={closeOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className={css.sheetBody}>
          <p className="body" style={{ marginTop: 0 }}>{s.lead}</p>
          <IonSegment value={method} aria-label={s.methods} onIonChange={e => { setMethod(e.detail.value as 'code' | 'password'); setMessage(null); }}>
            <IonSegmentButton value="code"><IonLabel>{s.code}</IonLabel></IonSegmentButton>
            <IonSegmentButton value="password"><IonLabel>{s.password}</IonLabel></IonSegmentButton>
          </IonSegment>
          <IonList lines="none" className="field-list" style={{ marginTop: 16 }}>
            <IonItem>
              <IonInput type="email" label={s.email} labelPlacement="stacked" fill="outline" autocomplete="email" inputmode="email"
                value={email} onIonInput={e => setEmail(String(e.detail.value ?? ''))} />
            </IonItem>
            {method === 'code' && codeSent && (
              <IonItem>
                <IonInput label={s.codeLabel} labelPlacement="stacked" fill="outline" inputmode="numeric" autocomplete="one-time-code"
                  maxlength={10} value={code} onIonInput={e => setCode(String(e.detail.value ?? '').replace(/\s/g, ''))} />
              </IonItem>
            )}
            {method === 'password' && (
              <IonItem>
                <IonInput type="password" label={s.passwordLabel} labelPlacement="stacked" fill="outline" autocomplete="current-password"
                  value={password} onIonInput={e => setPassword(String(e.detail.value ?? ''))} />
              </IonItem>
            )}
          </IonList>
          {message && <IonText color={message.tone} role="alert"><p className="small-text">{message.text}</p></IonText>}

          {method === 'code' && (codeSent ? (
            <>
              <p className="small">{fill(s.codeSent, { email: email.trim() })}</p>
              <IonButton expand="block" disabled={busy || code.length < 6}
                onClick={() => void run(async () => { await account.verifyEmailCode(email.trim(), code); done(); })}>{s.verify}</IonButton>
              <IonButton expand="block" fill="clear" color="medium" disabled={busy}
                onClick={() => void run(async () => { await account.sendEmailCode(email.trim()); setCode(''); })}>{s.resend}</IonButton>
            </>
          ) : (
            <IonButton expand="block" disabled={busy || !validEmail}
              onClick={() => void run(async () => { await account.sendEmailCode(email.trim()); setCodeSent(true); })}>{s.sendCode}</IonButton>
          ))}

          {method === 'password' && (
            <>
              <IonButton expand="block" disabled={busy || !validEmail || !password}
                onClick={() => void run(async () => { await account.signInWithPassword(email.trim(), password); done(); })}>{s.signIn}</IonButton>
              <div className={css.buttonRow} style={{ justifyContent: 'space-between' }}>
                <IonButton fill="clear" color="medium" disabled={busy || !validEmail || password.length < 8}
                  onClick={() => void run(async () => {
                    const r = await account.signUp(email.trim(), password, `${siteUrl()}/today`);
                    if (r.needsConfirmation) setMessage({ tone: 'medium', text: s.created }); else done();
                  })}>{s.create}</IonButton>
                <IonButton fill="clear" color="medium" disabled={busy || !validEmail}
                  onClick={() => void run(async () => {
                    await account.sendPasswordReset(email.trim(), `${siteUrl()}/profile`);
                    setMessage({ tone: 'medium', text: fill(s.resetSent, { email: email.trim() }) });
                  })}>{s.forgot}</IonButton>
              </div>
            </>
          )}
          {busy && <p className="small" role="status">{s.working}</p>}
        </div>
      </IonContent>
    </>
  );
}
