import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.celestialatlas.app',
  appName: 'Celestial Atlas',
  webDir: 'dist',
  backgroundColor: '#0a1128',
  android: {
    backgroundColor: '#0a1128',
    // Release builds must not be debuggable through Chrome DevTools.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      // The web layer hides the static native splash once React has rendered,
      // then shows the animated splash for about 1.5 s.
      launchAutoHide: false,
      backgroundColor: '#0a1128',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    // Capacitor 8 draws edge to edge and passes the system bar insets to CSS
    // (env(safe-area-inset-*)), which the top bar, tab bar and dialogs use.
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
    StatusBar: {
      style: 'DARK',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_atlas',
      iconColor: '#c9a35a',
    },
  },
};

export default config;
