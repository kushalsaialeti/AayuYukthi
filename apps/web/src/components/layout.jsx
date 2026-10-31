import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../analytics.js';
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = `${title} — AayuYukthi`;
    const tag = document.querySelector('meta[name="description"]');
    if (tag && description) tag.setAttribute('content', description);
  }, [title, description]);
}

export function usePageView() {
  const location = useLocation();
  useEffect(() => {
    track('PAGE_VIEWED');
  }, [location.pathname]);
}

export function Loading({ t }) {
  return (
    <div className="container" aria-busy="true" aria-live="polite">
      <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: '55%' }} />
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}

export function LoadError({ t, onRetry }) {
  return (
    <div className="container">
      <div className="card">
        <p>{t.loadError}</p>
        <button className="btn btn-secondary" onClick={onRetry}>{t.tryAgain}</button>
      </div>
    </div>
  );
}
