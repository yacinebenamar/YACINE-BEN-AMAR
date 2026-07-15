import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA (Android APK & Desktop Standalone)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('FBM ERP Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  });
}

// Request permission for native system push notifications on mobile and desktop
if ('Notification' in window && Notification.permission === 'default') {
  // We can request permission on user interaction or app load
  setTimeout(() => {
    Notification.requestPermission().then((permission) => {
      console.log('Notification permission status:', permission);
    });
  }, 3000); // Slight delay for smoother initial render
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
