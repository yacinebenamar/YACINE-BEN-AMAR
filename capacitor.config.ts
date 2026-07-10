import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.benamar.erp',
  appName: 'FBM',
  webDir: 'dist',
  
  // Keep the WebView alive when app is minimized (critical for background ops)
  android: {
    // Allow mixed content for Firebase requests
    allowMixedContent: true,
    // Keep app alive in background
    backgroundColor: '#000839',
    // Capture console logs from WebView in Android Logcat for debugging
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    // ─── LocalNotifications: Full heads-up config ──────────────────────────
    LocalNotifications: {
      // Default channel id (created in App.tsx at runtime)
      smallIcon: 'ic_launcher',
      iconColor: '#76BC21',
      sound: 'beep.wav',
    },

    // ─── SplashScreen config ───────────────────────────────────────────────
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000839',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },

    // ─── Camera config ─────────────────────────────────────────────────────
    Camera: {
      // Prompt for each capture (don't save to gallery by default)
      saveToGallery: false,
      correctOrientation: true,
    },
  },
};

export default config;
