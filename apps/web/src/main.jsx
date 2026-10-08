import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../../packages/ui/tokens.css';
import './site.css';
import './theme-public.css';
import { App, ErrorBoundary } from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
