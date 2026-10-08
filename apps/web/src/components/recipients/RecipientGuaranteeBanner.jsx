import React from 'react';

export function RecipientGuaranteeBanner({ config = {} }) {
  const guarantee = config?.guarantee || {
    badge: 'AayuYukthi Safety Standard',
    title: 'Empathetic Companion Matching',
    description:
      'Prior to every hospital visit or outpatient pickup, our coordination engine pairs your loved one with a certified healthcare escort proficient in their spoken language and trained specifically for their mobility constraints. You will receive real-time check-in updates and doctor note summaries.',
    helplineTitle: 'Need urgent coordinator help?',
    helplineNumber: '1800-AAYU-CARE',
    helplineSubtitle: 'Toll-free 24/7 family transit support',
  };

  return (
    <div className="rc-safety-banner">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '48rem' }}>
        <div className="rc-safety-icon">
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>handshake</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div>
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: '#e6e9e8', color: '#3f484a', fontSize: '12px', fontWeight: 600 }}>
              {guarantee.badge || 'AayuYukthi Safety Standard'}
            </span>
          </div>
          <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 600, color: '#191c1c' }}>
            {guarantee.title || 'Empathetic Companion Matching'}
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '14px', lineHeight: 1.6, color: '#3f484a' }}>
            {guarantee.description}
          </p>
        </div>
      </div>

      <div className="rc-helpline-card">
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b6077', fontWeight: 700 }}>
          {guarantee.helplineTitle || 'Need urgent coordinator help?'}
        </span>
        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#004349' }}>
          {guarantee.helplineNumber || '1800-AAYU-CARE'}
        </span>
        <span style={{ fontSize: '12px', color: '#4b6077' }}>
          {guarantee.helplineSubtitle || 'Toll-free 24/7 family transit support'}
        </span>
      </div>
    </div>
  );
}
