import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useDocumentMeta } from '../components/layout.jsx';
import { Icon } from '../components/public/Icon.jsx';

// Full journey page. Steps come from CMS blocks (home.how.1..7 + optional
// home.how.meta.N) — the same source as the homepage preview. No hardcoded
// production copy: an empty CMS renders an empty state, not English filler.
const STEP_KEYS = ['home.how.1', 'home.how.2', 'home.how.3', 'home.how.4', 'home.how.5', 'home.how.6', 'home.how.7'];

export function HowItWorks({ t }) {
  const [blocks, setBlocks] = useState(null);

  useDocumentMeta('How it works', 'Clear steps from request to completed hospital journey.');

  useEffect(() => {
    api.blocks([...STEP_KEYS, ...STEP_KEYS.map((k) => k.replace('home.how.', 'home.how.meta.'))]).then(setBlocks).catch(() => setBlocks({}));
  }, []);

  const steps = STEP_KEYS.map((k) => {
    const b = blocks?.[k];
    if (!b) return null;
    const n = k.split('.').pop();
    return { ...b, meta: blocks?.[`home.how.meta.${n}`]?.body_en ?? null };
  }).filter(Boolean);

  return (
    <section className="pub-section">
      <div className="pub-container">
        <span className="pub-eyebrow">{t.howTitle}</span>
        <h1 className="pub-h2">{t.howTitle}</h1>
        <p className="pub-sub" style={{ marginBottom: 28 }}>{t.tagline}</p>
        {!blocks && <div className="pub-skeleton" style={{ height: 200 }} />}
        {blocks && steps.length === 0 && (
          <div className="pub-empty"><p>Steps are being published — please check back soon.</p></div>
        )}
        {steps.length > 0 && (
          <div className="pub-grid-3">
            {steps.map((s, i) => (
              <div key={s.key} className="pub-card">
                <div className="pub-step-num">{i + 1}</div>
                <h3>{s.title_en}</h3>
                <p className="body">{s.body_en}</p>
                {s.meta && (
                  <div className="pub-card-meta" style={{ color: 'var(--pub-primary)' }}>
                    <Icon name={s.icon} fallback="check_circle" size={16} />
                    {s.meta}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p style={{ marginTop: 24 }}>
          <Link className="pub-btn" to="/request-care">
            {t.requestCare} <Icon name="arrow_forward" size={20} />
          </Link>
        </p>
      </div>
    </section>
  );
}
