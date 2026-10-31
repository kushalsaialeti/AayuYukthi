import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useDocumentMeta } from '../components/layout.jsx';

// CMS-driven legal documents (/privacy and /terms). The real text lives in the
// CMS (`legal.privacy` / `legal.terms` content blocks, seeded server-side) —
// this page never invents legal copy. If a document has not been published we
// say so honestly and point to the contact page.

const KIND_CONFIG = {
  privacy: { key: 'legal.privacy', fallbackTitle: 'Privacy Policy' },
  terms: { key: 'legal.terms', fallbackTitle: 'Terms & Conditions' },
};

// Pure-React body renderer (HTML strings are never injected). The CMS body is plain
// text: paragraphs separated by blank lines, `## ` headings, and `- ` bullets.
function renderBody(body) {
  const blocks = String(body)
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="pub-legal-h2">
          {block.slice(3).trim()}
        </h2>
      );
    }

    const lines = block.split('\n');
    if (lines.every((line) => line.trim().startsWith('- '))) {
      return (
        <ul key={i} className="pub-legal-ul">
          {lines.map((line, j) => (
            <li key={j}>{line.trim().slice(2)}</li>
          ))}
        </ul>
      );
    }

    // Paragraph: internal line breaks are preserved via CSS (white-space: pre-line).
    return (
      <p key={i} className="pub-legal-p">
        {block}
      </p>
    );
  });
}

export function Legal({ kind, t }) {
  const config = KIND_CONFIG[kind] ?? KIND_CONFIG.privacy;
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useDocumentMeta(doc?.title_en ?? config.fallbackTitle, 'Published document from AayuYukthi.');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setDoc(null);
    api
      .blocks([config.key])
      .then((blocks) => {
        if (alive) setDoc(blocks?.[config.key] ?? null);
      })
      .catch(() => {
        if (alive) setDoc(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [config.key]);

  const title = doc?.title_en ?? config.fallbackTitle;

  return (
    <div className="pub-container pub-page pub-legal">
      <p style={{ marginBottom: '1.25rem' }}>
        <Link className="pub-link" to="/">
          ← {t?.home ?? 'Back to home'}
        </Link>
      </p>

      {loading && (
        <div aria-busy="true" aria-live="polite">
          <div className="skeleton" style={{ height: 36, width: '50%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 16, width: '85%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: '75%' }} />
        </div>
      )}

      {!loading && !doc && (
        <div className="pub-empty pub-legal-empty">
          <h1 className="pub-legal-title">{title}</h1>
          <p>This document has not been published yet.</p>
          <p style={{ marginTop: 12 }}>
            <Link className="pub-link" to="/contact">
              Contact us
            </Link>
          </p>
        </div>
      )}

      {!loading && doc && (
        <article className="pub-legal-article">
          <h1 className="pub-legal-title">{doc.title_en ?? title}</h1>
          {doc.body_en ? (
            <div className="pub-legal-body">{renderBody(doc.body_en)}</div>
          ) : (
            <div className="pub-empty pub-legal-empty">
              <p>This document has not been published yet.</p>
              <p style={{ marginTop: 12 }}>
                <Link className="pub-link" to="/contact">
                  Contact us
                </Link>
              </p>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
