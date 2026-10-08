import React, { useState } from 'react';

export function Field({ label, error, hint, required, children }) {
  return (
    <div className="ops-form-field">
      {label && (
        <label className="ops-form-label">
          <span>
            {label}
            {required && <span style={{ color: 'var(--ops-error)', marginLeft: '3px' }}>*</span>}
          </span>
          {hint && <span className="ops-form-hint">{hint}</span>}
        </label>
      )}
      {children}
      {error && (
        <span role="alert" style={{ color: 'var(--ops-error)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  const fields = error.fieldErrors ? Object.entries(error.fieldErrors) : [];
  return (
    <div
      role="alert"
      style={{
        padding: '0.875rem 1rem',
        borderRadius: 'var(--ops-radius-md)',
        backgroundColor: 'var(--ops-error-container)',
        color: 'var(--ops-on-error-container)',
        border: '1px solid rgba(186, 26, 26, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
        <span>{error.message || 'Something went wrong.'}</span>
      </div>
      {fields.length > 0 && (
        <ul style={{ margin: '0 0 0 1.5rem', padding: 0, fontSize: '0.8125rem' }}>
          {fields.map(([k, v]) => (
            <li key={k}><strong>{k}</strong>: {v}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <button
          type="button"
          className="ops-btn ops-btn-secondary ops-btn-sm"
          style={{ width: 'fit-content', marginTop: '0.25rem' }}
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No items found', message, action, icon = 'inbox' }) {
  return (
    <div style={{
      padding: '3rem 1.5rem',
      textAlign: 'center',
      color: 'var(--ops-on-surface-variant)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      backgroundColor: 'var(--ops-surface-container-lowest)',
      borderRadius: 'var(--ops-radius-xl)',
      border: '1px dashed var(--ops-outline-variant)'
    }}>
      <div style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '9999px',
        backgroundColor: 'var(--ops-surface-container-low)',
        color: 'var(--ops-outline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{icon}</span>
      </div>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--ops-on-surface)' }}>
        {title}
      </h3>
      {message && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ops-outline)', maxWidth: '24rem' }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
}

export function StatusBadge({ value }) {
  const v = (value || 'draft').toLowerCase();
  let badgeClass = 'ops-badge-draft';
  let icon = 'schedule';

  if (v === 'published' || v === 'active' || v === 'confirmed' || v === 'completed') {
    badgeClass = 'ops-badge-published';
    icon = 'check_circle';
  } else if (v === 'archived' || v === 'cancelled') {
    badgeClass = 'ops-badge-archived';
    icon = 'archive';
  } else if (v === 'action_required' || v === 'error') {
    badgeClass = 'ops-badge-error';
    icon = 'warning';
  } else if (v === 'in_transit') {
    badgeClass = 'ops-badge-confirmed';
    icon = 'directions_car';
  }

  const label = v.replace(/_/g, ' ');

  return (
    <span className={`ops-badge ${badgeClass}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{icon}</span>
      <span style={{ textTransform: 'capitalize' }}>{label}</span>
    </span>
  );
}

export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const set = (k) => (e) => {
    const v = e?.target?.type === 'checkbox' ? e.target.checked : e?.target?.value;
    setValues((s) => ({ ...s, [k]: v }));
  };
  return [values, set, setValues];
}
