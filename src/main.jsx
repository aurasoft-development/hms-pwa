import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support
// Optional: capture beforeinstallprompt so you can show a custom install UI
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  console.log('beforeinstallprompt fired');
});

// Register service worker via Vite PWA virtual module
const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('Offline ready');
  },
  onNeedRefresh() {
    console.log('New content available');
  }
});

