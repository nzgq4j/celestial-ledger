import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useState } from 'react';
import { fill, useStrings } from '../i18n';
import { PLANS, TRIAL_DAYS, billing } from '../platform/billing';
import { useApp } from '../state/store';
import css from './screens.module.css';

export function Paywall() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.paywall;
  const [busy, setBusy] = useState(false);
  const needsAccount = app.account.available && !app.account.email;
  const plan = PLANS[0];

  const start = async () => {
    if (needsAccount) { app.closePaywall(); app.openSignIn(); return; }
    setBusy(true);
    try { await app.startTrial(plan.id); }
    catch { app.showToast(s.failed); }
    finally { setBusy(false); }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{strings.common.atlasPlus}</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label={strings.common.close} onClick={app.closePaywall}><IonIcon aria-hidden="true" slot="icon-only" icon={closeOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className={css.sheetBody}>
          <h2 id="paywall-title" className="display" style={{ fontSize: 34, marginBottom: 18 }}>{s.title}</h2>
          <ul className={css.featureList}>
            {s.features.map(f => (
              <li key={f}><span aria-hidden="true">✦</span>{f}</li>
            ))}
          </ul>
          <div className={`${css.plan} ${css.planOn}`}>
            <span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{s.yearly}</span>
              <span className="small" style={{ fontSize: 12.5 }}>{fill(s.note, { days: TRIAL_DAYS })}</span>
            </span>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{plan.price}</span>
          </div>
          {needsAccount && <p className="small" style={{ margin: '14px 0 0' }}>{s.signInFirst}</p>}
          <IonButton expand="block" size="large" style={{ marginTop: 18 }} disabled={busy} onClick={() => void start()}>
            {needsAccount ? strings.common.signIn : fill(s.start, { days: TRIAL_DAYS })}
          </IonButton>
          <p className="note" style={{ textAlign: 'center', marginTop: 12 }}>{billing.isDemo ? s.demo : s.cancelAnytime}</p>
          {!billing.isDemo && !needsAccount && (
            <IonButton expand="block" fill="clear" color="medium" onClick={() => void billing.restore().then(() => app.closePaywall())}>{s.restore}</IonButton>
          )}
        </div>
      </IonContent>
    </>
  );
}
