import {
  IonAlert, IonApp, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonTabBar, IonTabButton,
  IonLabel, IonTitle, IonToast, IonToolbar,
} from '@ionic/react';
import { albumsOutline, arrowBackOutline, bookOutline, calculatorOutline, sparklesOutline, sunnyOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { LocaleContext, stringsFor, useStrings } from './i18n';
import { updatePassword } from './platform/account';
import { hideNativeSplash, setupSystemBars } from './platform/native';
import { Journal } from './screens/Journal';
import { Legal } from './screens/Legal';
import { Numbers } from './screens/Numbers';
import { Onboarding } from './screens/Onboarding';
import { Paywall } from './screens/Paywall';
import { Profile } from './screens/Profile';
import { ReportScreen } from './screens/Report';
import { SignIn } from './screens/SignIn';
import { Splash } from './screens/Splash';
import { Stars } from './screens/Stars';
import { Tarot } from './screens/Tarot';
import { Today } from './screens/Today';
import css from './screens/screens.module.css';
import { useApp, type TabId } from './state/store';
import { Mark, Starfield } from './ui/components';

const TABS: { id: TabId; icon: string }[] = [
  { id: 'home', icon: sunnyOutline },
  { id: 'stars', icon: sparklesOutline },
  { id: 'numbers', icon: calculatorOutline },
  { id: 'tarot', icon: albumsOutline },
  { id: 'journal', icon: bookOutline },
];
const MAIN_TABS = new Set<TabId>(TABS.map(t => t.id));

/** How long the animated web splash shows after the native splash hides. */
const SPLASH_MS = 1500;

export function App() {
  const app = useApp();
  const locale = app.locale;
  const s = stringsFor(locale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    void setupSystemBars();
    void hideNativeSplash();
    const t = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Legal pages are reachable without a profile.
  const legal = app.tab === 'privacy' || app.tab === 'terms';
  let content;
  if (!app.loaded || !splashDone) content = <Splash />;
  else if (legal) content = <Shell />;
  else if (!app.profile) content = <Onboarding />;
  else content = <Shell />;

  return (
    <LocaleContext.Provider value={locale}>
      <IonApp>
        <Starfield />
        {content}
        <IonModal isOpen={app.paywall} onDidDismiss={app.closePaywall} aria-labelledby="paywall-title">
          <Paywall />
        </IonModal>
        <IonModal isOpen={app.signInOpen} onDidDismiss={app.closeSignIn} aria-labelledby="signin-title">
          <SignIn />
        </IonModal>
        <IonAlert
          isOpen={app.passwordPrompt}
          header={s.signin.newPasswordTitle}
          backdropDismiss={false}
          inputs={[{ name: 'password', type: 'password', placeholder: s.signin.newPasswordLabel, attributes: { autocomplete: 'new-password', minlength: 8, 'aria-label': s.signin.newPasswordLabel } }]}
          buttons={[
            { text: s.common.cancel, role: 'cancel', handler: () => app.closePasswordPrompt() },
            {
              text: s.signin.newPasswordSave,
              handler: (values: { password?: string }) => {
                const pw = values.password ?? '';
                if (pw.length < 8) { app.showToast(s.signin.passwordTooShort); return false; }
                void updatePassword(pw).then(() => app.showToast(s.signin.newPasswordSaved), (e: unknown) => app.showToast(e instanceof Error ? e.message : String(e)));
                app.closePasswordPrompt();
                return true;
              },
            },
          ]}
        />
        <IonToast isOpen={!!app.toast} message={app.toast ?? ''} duration={2600} position="bottom" positionAnchor="atlas-tabbar" />
      </IonApp>
    </LocaleContext.Provider>
  );
}

function Shell() {
  const app = useApp();
  const s = useStrings();
  const first = app.profile?.name.split(' ')[0] || '';
  const sub = !MAIN_TABS.has(app.tab);

  const screen = (() => {
    if (app.tab === 'privacy' || app.tab === 'terms') return <Legal kind={app.tab} />;
    if (app.tab === 'profile') return <Profile />;
    if (app.derivedError || !app.derived) {
      return (
        <div className="panel stack" style={{ gap: 12 }}>
          <p className="body">{s.common.chartError}</p>
          <IonButton onClick={() => app.go('profile')}>{s.common.openProfile}</IonButton>
        </div>
      );
    }
    switch (app.tab) {
      case 'home': return <Today />;
      case 'stars': return <Stars />;
      case 'numbers': return <Numbers />;
      case 'tarot': return <Tarot />;
      case 'journal': return <Journal />;
      case 'report': return app.report ? <ReportScreen /> : <Today />;
      default: return <Today />;
    }
  })();

  return (
    <div className="ion-page" id="atlas-shell">
      <IonHeader>
        <IonToolbar>
          {sub && (
            <IonButtons slot="start">
              <IonButton aria-label={s.common.back} onClick={() => { if (!app.back()) app.go('home'); }}>
                <IonIcon aria-hidden="true" slot="icon-only" icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
          )}
          <IonTitle>
            <span className={css.brand}><Mark />{s.appName}</span>
          </IonTitle>
          <IonButtons slot="end">
            {!app.premium && app.profile && (
              <IonButton fill="outline" shape="round" size="small" onClick={app.openPaywall}>{s.common.atlasPlus}</IonButton>
            )}
            {app.profile && (
              <IonButton className={css.avatarButton} aria-label={`${s.common.profile.replace('{name}', first)}`} onClick={() => app.go('profile')}>
                <span className={css.avatar} aria-hidden="true">{first.charAt(0).toUpperCase() || '·'}</span>
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <main className={css.main}>{screen}</main>
      </IonContent>
      {app.profile && (
        <IonFooter>
          <IonTabBar id="atlas-tabbar" selectedTab={MAIN_TABS.has(app.tab) ? app.tab : undefined} aria-label={s.tabs.label}>
            {TABS.map(t => (
              <IonTabButton key={t.id} tab={t.id} onClick={() => app.go(t.id)}>
                <IonIcon aria-hidden="true" icon={t.icon} />
                <IonLabel>{s.tabs[t.id as keyof typeof s.tabs]}</IonLabel>
              </IonTabButton>
            ))}
          </IonTabBar>
        </IonFooter>
      )}
    </div>
  );
}
