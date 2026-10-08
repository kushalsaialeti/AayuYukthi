import React from 'react';

export function PatientComfortChecklist({
  customRequirements,
}) {
  const items = [
    'Wheelchair provided & locked for transit',
    'Diabetic snack kit & hydration carried',
    'Telugu & English speaking companion assistant',
    'Doctor note summary & prescription scan requested',
  ];

  return (
    <div className="rd-card" style={{ gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-primary)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>elderly</span>
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
          Patient Special Provisions
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
        {items.map((it, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--cust-surface-container-low)',
              color: 'var(--cust-on-surface)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-primary)', flexShrink: 0 }}>
              check_circle
            </span>
            <span>{it}</span>
          </div>
        ))}

        {customRequirements && (
          <div
            style={{
              marginTop: '0.25rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(13, 92, 99, 0.05)',
              border: '1px dashed var(--cust-outline-variant)',
              fontSize: '0.75rem',
              color: 'var(--cust-on-surface-variant)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--cust-primary)', display: 'block', marginBottom: '0.2rem' }}>
              Family Caregiver Directives:
            </span>
            {customRequirements}
          </div>
        )}
      </div>
    </div>
  );
}
