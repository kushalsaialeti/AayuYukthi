import React from 'react';

export function TextQuestion({
  stepNumber,
  stepLabel = 'Visit Purpose',
  title,
  description,
  value,
  onChange,
  placeholder,
  suggestions = [],
  isTextarea = false,
  cmsConfig = {},
  error,
}) {
  const eyebrow = cmsConfig.eyebrow || (stepNumber ? `Step ${stepNumber} • ${stepLabel}` : null);
  const effectiveTitle = cmsConfig.title || title;
  const effectiveDesc = cmsConfig.desc || description;

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        {eyebrow && (
          <span className="rq-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
            {eyebrow}
          </span>
        )}
        <h2 className="rq-title" tabIndex="-1">{effectiveTitle}</h2>
        {effectiveDesc && <p className="rq-description">{effectiveDesc}</p>}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              className="rq-badge"
              style={{
                cursor: 'pointer',
                border: '1px solid var(--rq-border)',
                background: value === sug ? 'var(--rq-primary)' : 'var(--rq-surface-alt)',
                color: value === sug ? '#ffffff' : 'var(--rq-text)',
                padding: '6px 12px',
                fontSize: '13px',
              }}
              onClick={() => onChange(sug)}
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      <div className="rq-form-group">
        {isTextarea ? (
          <textarea
            className="rq-textarea"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        ) : (
          <input
            type="text"
            className="rq-input"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>

      {error && (
        <div className="rq-error-msg" role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
