import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import '@fontsource/noto-sans-symbols/400.css';
import '@fontsource/noto-sans-symbols-2/400.css';
import './ui/ionic-theme.css';
import './ui/global.css';
import { setupIonicReact } from '@ionic/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme, readThemePref } from './platform/theme';
import { AppProvider } from './state/store';

// Material Design on every platform, so the web and Android look the same.
setupIonicReact({ mode: 'md' });
// Apply the saved appearance before the first paint.
applyTheme(readThemePref())(); // paint only; the store follows device changes

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
