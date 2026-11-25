import { IonButton, IonCard, IonCardContent, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import { fill, useStrings } from '../i18n';
import { useApp, type AccountTab } from '../state/store';
import { Journal } from './Journal';
import { AccountSettings } from './Profile';
import css from './screens.module.css';

/** The Account tab: who is signed in and the membership, then Journal and Settings. */
export function Account() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.profile;
  const name = app.profile?.name.trim() || s.account;
  const email = app.account.email;

  return (
    <div className="screen fade-up" style={{ gap: 18, maxWidth: 720 }}>
      <IonCard>
        <IonCardContent>
          <div className={css.accountHead}>
            <span className={css.avatar} aria-hidden="true">{name.charAt(0).toUpperCase() || '·'}</span>
            <div className={css.accountWho}>
              <div className="eyebrow">{s.account}</div>
              <h1 className={css.accountName}>{name}</h1>
              {app.account.available && (
                <p className="small" style={{ margin: 0, overflowWrap: 'anywhere' }}>
                  {email ? fill(s.signedInAs, { email }) : s.notSignedInShort}
                </p>
              )}
              <p className="small" style={{ margin: 0 }}>{app.premium ? s.member : s.free}</p>
            </div>
          </div>
          <div className={css.buttonRow} style={{ marginTop: 14 }}>
            {!app.premium && <IonButton size="small" onClick={app.openPaywall}>{strings.common.atlasPlus}</IonButton>}
            {app.account.available && !email && (
              <IonButton size="small" fill="outline" onClick={app.openSignIn}>{strings.common.signIn}</IonButton>
            )}
          </div>
        </IonCardContent>
      </IonCard>

      <IonSegment value={app.accountTab} aria-label={s.sections} onIonChange={e => app.setAccountTab(e.detail.value as AccountTab)}>
        <IonSegmentButton value="journal"><IonLabel>{strings.journal.title}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="settings"><IonLabel>{s.settings}</IonLabel></IonSegmentButton>
      </IonSegment>

      {app.accountTab === 'journal' ? <Journal /> : <AccountSettings />}
    </div>
  );
}
