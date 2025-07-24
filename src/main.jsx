import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/debug/ErrorBoundary';
import './debug/setupDebug';
import './index.css';
import './pwa/registerServiceWorker';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <App />
      </ErrorBoundary>
  </React.StrictMode>
);
