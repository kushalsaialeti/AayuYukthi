import React from 'react';

function sanitizeText(val, fallback = '') {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.body_en || val.title_en || val.body || val.title || fallback;
  }
  return String(val);
}

export function DashboardAssuranceWidget({ cmsAdvisory = {} }) {
  const title = sanitizeText(cmsAdvisory.title, 'Compassionate Care Assurance');
  const body = sanitizeText(
    cmsAdvisory.body,
    'Need to adjust pickup timing, add dietary instructions, or modify doctor notes? Your assigned companion and our Bhimavaram support desk are available for custom family briefings.'
  );

  return (
    <div
      className="cust-card"
      style={{
        padding: '1.25rem',
        backgroundColor: 'var(--cust-surface-container-low)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        border: '1px solid rgba(0, 67, 73, 0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cust-tertiary-container)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          favorite
        </span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.55 }}>
        {body}
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        fontSize: '0.75rem',
        color: 'var(--cust-secondary)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
            security
          </span>
          Full Background Verified
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
            health_and_safety
          </span>
          Paramedic Supervised
        </span>
      </div>
    </div>
  );
}
