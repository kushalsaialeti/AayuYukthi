import React from 'react';

export function ContactEmergencyNotice({ blocks }) {
  const safeBlocks = blocks || {};
  const title = safeBlocks['contact.emergency.title']?.body_en ||
    'Important Notice & Clinical Safety Scope';
  const body = safeBlocks['contact.emergency.body']?.body_en ||
    'AayuYukthi is not an emergency response service (EMS), ICU transit provider, or ambulance network. For acute, life-threatening medical emergencies, please immediately call 108 (Emergency Response) or 112, or proceed directly to the nearest hospital casualty emergency room.';

  return (
    <div className="contact-emergency-banner">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div className="contact-emergency-icon">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
            e911_emergency
          </span>
        </div>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--pub-on-surface)' }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pub-on-variant)', lineHeight: 1.55 }}>
            {body}
          </p>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <a
          href="tel:108"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.625rem 1.125rem',
            borderRadius: '0.5rem',
            backgroundColor: '#6d230f',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.8125rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(109, 35, 15, 0.3)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>emergency</span>
          <span>Call 108 EMS</span>
        </a>
      </div>
    </div>
  );
}
