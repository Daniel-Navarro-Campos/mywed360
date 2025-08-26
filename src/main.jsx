import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/debug/ErrorBoundary';
import './debug/setupDebug';
// Registrar comandos de diagnóstico globales antes de montar la aplicación
import './utils/consoleCommands';
import './index.css';
import './pwa/registerServiceWorker';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <App />
      </ErrorBoundary>
  </React.StrictMode>
);
