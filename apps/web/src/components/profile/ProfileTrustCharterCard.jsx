import React from 'react';

export function ProfileTrustCharterCard({ cmsBlocks = {} }) {
  const title = cmsBlocks['profile.trust.title']?.body_en || 'AayuYukthi Trust Protocol';
  const desc = cmsBlocks['profile.trust.body']?.body_en ||
    'Your family account complies with ISO 27001 medical transit guidelines. All transit escorts carry physical ID badges with cryptographic QR links verified directly by hospital entrance security desks.';

  return (
    <div className="profile-trust-card-shell">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cust-primary, #004349)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>verified_user</span>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{title}</span>
      </div>

      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
        {desc}
      </p>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.open('/charter-directive-sample.pdf', '_blank');
        }}
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--cust-primary)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          paddingTop: '0.25rem',
        }}
      >
        <span>Download Non-Clinical Care Authorization Charter (PDF)</span>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
      </a>
    </div>
  );
}
