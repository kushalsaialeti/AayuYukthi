import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorAlert } from '../components/ui.jsx';
import { useToast } from '../components/OpsToast.jsx';

const LEGAL_DOCS = [
  {
    key: 'legal.privacy',
    title: 'Privacy Policy',
    defaultTitle: 'Privacy Policy',
    icon: 'privacy_tip',
    description: 'Defines how patient medical requests, phone numbers, WhatsApp communications, and caregiver data are stored and protected.',
    publicUrl: 'http://localhost:5173/privacy',
    publicPath: '/privacy',
  },
  {
    key: 'legal.terms',
    title: 'Terms & Conditions',
    defaultTitle: 'Terms & Conditions',
    icon: 'gavel',
    description: 'Establishes user rights, caregiver accompaniment scope, service boundaries, cancellations, and doorstep transit protocols.',
    publicUrl: 'http://localhost:5173/terms',
    publicPath: '/terms',
  },
];

function PolicyCard({ config, initialData, onSave }) {
  const [title, setTitle] = useState(initialData?.title_en || config.defaultTitle);
  const [body, setBody] = useState(initialData?.body_en || '');
  const [status, setStatus] = useState(initialData?.status || 'published');
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title_en || config.defaultTitle);
      setBody(initialData.body_en || '');
      setStatus(initialData.status || 'published');
    }
  }, [initialData, config.defaultTitle]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.put('cms/content-blocks', {
        key: config.key,
        title_en: title.trim(),
        body_en: body.trim(),
        status,
      });
      toast.success(`${config.title} saved and updated live!`);
      if (onSave) onSave();
    } catch (err) {
      toast.error(err.message || `Failed to update ${config.title}`);
    } finally {
      setSaving(false);
    }
  };

  const insertHelper = (snippet) => {
    setBody((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  // Pure-React preview matching public renderBody
  const renderPreview = (text) => {
    const blocks = String(text || '')
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      return (
        <div style={{ color: 'var(--ops-outline)', fontStyle: 'italic', padding: '1.5rem', textAlign: 'center' }}>
          No content written yet. Click 'Edit Document' to add legal sections.
        </div>
      );
    }

    return blocks.map((block, i) => {
      if (block.startsWith('## ')) {
        return (
          <h3 key={i} style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ops-primary)', margin: '1.25rem 0 0.5rem' }}>
            {block.slice(3).trim()}
          </h3>
        );
      }
      const lines = block.split('\n');
      if (lines.every((line) => line.trim().startsWith('- '))) {
        return (
          <ul key={i} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0', color: 'var(--ops-on-surface-variant)' }}>
            {lines.map((line, j) => (
              <li key={j} style={{ marginBottom: '0.35rem', lineHeight: 1.5 }}>
                {line.trim().slice(2)}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i} style={{ margin: '0 0 0.75rem', lineHeight: 1.6, color: 'var(--ops-on-surface-variant)', whiteSpace: 'pre-line' }}>
          {block}
        </p>
      );
    });
  };

  return (
    <div
      className="ops-card"
      style={{
        border: '1px solid var(--ops-outline-subtle)',
        boxShadow: 'var(--ops-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Feature Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--ops-outline-subtle)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--ops-radius-md)',
              backgroundColor: 'var(--ops-primary-fixed, rgba(0,67,73,0.1))',
              color: 'var(--ops-primary, #004349)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              {config.icon}
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ops-on-surface)' }}>
                {config.title}
              </h2>
              <span
                className="ops-badge"
                style={{
                  backgroundColor: status === 'published' ? 'var(--ops-success-container)' : '#fef3c7',
                  color: status === 'published' ? 'var(--ops-success)' : '#92400e',
                  fontSize: '0.75rem',
                }}
              >
                {status === 'published' ? 'Live on Portal' : 'Draft Only'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ops-outline)', fontFamily: 'monospace', marginTop: '2px' }}>
              key: {config.key}
            </div>
          </div>
        </div>

        {/* View Mode & Live Link */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--ops-surface-container)', borderRadius: 'var(--ops-radius-md)', padding: '2px' }}>
            <button
              type="button"
              className={`ops-btn ops-btn-sm ${viewMode === 'edit' ? 'ops-btn-primary' : 'ops-btn-ghost'}`}
              style={{ fontSize: '12px', padding: '0.25rem 0.75rem', minHeight: '30px' }}
              onClick={() => setViewMode('edit')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
              Edit
            </button>
            <button
              type="button"
              className={`ops-btn ops-btn-sm ${viewMode === 'preview' ? 'ops-btn-primary' : 'ops-btn-ghost'}`}
              style={{ fontSize: '12px', padding: '0.25rem 0.75rem', minHeight: '30px' }}
              onClick={() => setViewMode('preview')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
              Live Preview
            </button>
          </div>

          <a
            href={config.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ops-btn ops-btn-secondary ops-btn-sm"
            style={{ fontSize: '12px', minHeight: '30px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Open live public document in new tab"
          >
            <span>View Live</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
          </a>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ops-on-surface-variant)', lineHeight: 1.5 }}>
        {config.description}
      </p>

      {/* Mode 1: Editor */}
      {viewMode === 'edit' ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">Document Display Title *</label>
              <input
                type="text"
                className="ops-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">Publication Visibility</label>
              <select
                className="ops-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="published">Published (Visible to Customers & Public)</option>
                <option value="draft">Draft (Hidden from Live Website)</option>
              </select>
            </div>
          </div>

          {/* Markdown Helper Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--ops-surface-container-low)', padding: '0.5rem 0.75rem', borderRadius: 'var(--ops-radius-md)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', marginRight: '4px' }}>
              Insert Block:
            </span>
            <button
              type="button"
              className="ops-btn ops-btn-ghost ops-btn-sm"
              style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
              onClick={() => insertHelper('## New Section Title\n\nEnter explanation or clauses here.')}
            >
              + Heading (##)
            </button>
            <button
              type="button"
              className="ops-btn ops-btn-ghost ops-btn-sm"
              style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
              onClick={() => insertHelper('- Point 1\n- Point 2\n- Point 3')}
            >
              + Bullet List (-)
            </button>
            <button
              type="button"
              className="ops-btn ops-btn-ghost ops-btn-sm"
              style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
              onClick={() => insertHelper('AayuYukthi provides hospital care accompaniment and does not replace emergency medical response.')}
            >
              + Paragraph
            </button>
          </div>

          <div className="ops-form-field">
            <label className="ops-form-label">Document Text &amp; Sections (Plain text / Markdown) *</label>
            <textarea
              className="ops-textarea"
              rows={12}
              style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter document clauses here using ## for headings and - for bullet points."
              required
            />
            <span className="ops-form-hint">
              Separate paragraphs with a blank line. Use <code>## Heading</code> for major sections and <code>- item</code> for bullet points.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <button
              type="submit"
              className="ops-btn ops-btn-primary"
              disabled={saving}
              style={{ minWidth: '180px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {saving ? 'hourglass_empty' : 'save'}
              </span>
              <span>{saving ? 'Updating Live...' : `Save & Publish ${config.title}`}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Mode 2: Live Document Preview */
        <div
          style={{
            background: 'var(--ops-surface-container-low)',
            borderRadius: 'var(--ops-radius-md)',
            padding: '1.5rem',
            border: '1px solid var(--ops-outline-subtle)',
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(0,67,73,0.12)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
              Live Website Document Preview
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0', color: 'var(--ops-on-surface)' }}>
              {title}
            </h1>
          </div>
          <div>{renderPreview(body)}</div>
        </div>
      )}
    </div>
  );
}

export function LegalPolicies() {
  const [blocks, setBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list('cms/content-blocks');
      const allBlocks = res?.data || [];
      const map = {};
      for (const b of allBlocks) {
        if (b.key) map[b.key] = b;
      }
      setBlocks(map);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '28px' }}>
              policy
            </span>
            <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
              Terms &amp; Conditions and Privacy Policy CMS
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Effortlessly update and publish legal disclosures, caregiver consent terms, and data policies. Changes save via a single API call and reflect instantly across the public portal.
          </p>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={loadData} />

      {loading && (
        <div className="ops-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="ops-spinner" aria-hidden="true" />
          <p style={{ margin: '0.75rem 0 0', color: 'var(--ops-outline)' }}>Loading legal documents...</p>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {LEGAL_DOCS.map((doc) => (
            <PolicyCard
              key={doc.key}
              config={doc}
              initialData={blocks[doc.key]}
              onSave={loadData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LegalPolicies;
