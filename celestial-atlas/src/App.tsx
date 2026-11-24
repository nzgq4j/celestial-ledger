import { useEffect, useState } from 'react';
import { hideNativeSplash, setupSystemBars } from './platform/native';
import { Journal } from './screens/Journal';
import { Numbers } from './screens/Numbers';
import { Onboarding } from './screens/Onboarding';
import { Paywall } from './screens/Paywall';
import { Profile } from './screens/Profile';
import { ReportScreen } from './screens/Report';
import { Splash } from './screens/Splash';
import { Stars } from './screens/Stars';
import { Tarot } from './screens/Tarot';
import { Today } from './screens/Today';
import css from './screens/screens.module.css';
import { useApp, type TabId } from './state/store';
import { Mark, Starfield, Toast } from './ui/components';

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: 'home', label: 'Today', glyph: '☉︎' },
  { id: 'stars', label: 'Stars', glyph: '✦' },
  { id: 'numbers', label: 'Numbers', glyph: '#' },
  { id: 'tarot', label: 'Tarot', glyph: '◈' },
  { id: 'journal', label: 'Journal', glyph: '❧' },
];

/** How long the animated web splash shows after the native splash hides. */
const SPLASH_MS = 1500;

export function App() {
  const app = useApp();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    void setupSystemBars();
    void hideNativeSplash();
    const t = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  let content;
  if (!app.loaded || !splashDone) content = <Splash />;
  else if (!app.profile) content = <Onboarding />;
  else content = <Shell />;

  return (
    <>
      <Starfield />
      {content}
      {app.paywall && <Paywall />}
      <Toast message={app.toast} />
    </>
  );
}

function Shell() {
  const app = useApp();
  const first = app.profile!.name.split(' ')[0];
  const premium = app.premium;
  const screen = (() => {
    if (app.derivedError || !app.derived) {
      return (
        <div className="panel stack" style={{ gap: 12 }}>
          <p className="body">Your chart could not be calculated from the saved birth details. Check them in your profile.</p>
          <button type="button" className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => app.go('profile')}>Open profile</button>
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
      case 'profile': return <Profile />;
    }
  })();
  return (
    <div className={css.shell}>
      <header className={css.topbar}>
        <div className={css.brand}><Mark />Celestial Atlas</div>
        <div className={css.topActions}>
          {!premium && <button type="button" className={css.plusChip} onClick={app.openPaywall}>Atlas+</button>}
          <button type="button" className={css.avatar} onClick={() => app.go('profile')} aria-label={`Profile: ${first}`}>
            {first.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>
      <main className={css.main} aria-hidden={app.paywall || undefined}>{screen}</main>
      <nav className={css.tabbar} aria-label="Main">
        {TABS.map(t => {
          const on = app.tab === t.id;
          return (
            <button key={t.id} type="button" className={on ? `${css.tab} ${css.tabOn}` : css.tab}
              aria-current={on ? 'page' : undefined} onClick={() => app.go(t.id)}>
              <span className={css.tabGlyph} aria-hidden="true">{t.glyph}</span>
              <span className={css.tabLabel}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
