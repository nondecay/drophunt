import { Buffer } from 'buffer';
// Polyfill must be established before ANY other imports that might use it
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = (window as any).process || { env: {} };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Critical: Root element "root" not found in the DOM.');
}

try {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Trackdropz Protocol Initialized Successfully");
} catch (error) {
  console.error('Bootstrap Error:', error);
  container.innerHTML = `
    <div style="color: white; background: #020617; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif; padding: 20px; text-align: center;">
      <h1 style="color: #ef4444; font-size: 2rem; margin-bottom: 10px;">Critical Startup Error</h1>
      <p style="opacity: 0.7; margin-bottom: 20px;">The application failed to initialize properly.</p>
      <div style="background: #1e293b; padding: 20px; border-radius: 12px; max-width: 600px; width: 100%; text-align: left; overflow-x: auto; border: 1px solid #334155;">
        <code style="color: #cbd5e1; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap;">${error instanceof Error ? error.stack || error.message : String(error)}</code>
      </div>
      <button onclick="window.location.reload()" style="margin-top: 30px; padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">Retry Boot</button>
    </div>
  `;
}