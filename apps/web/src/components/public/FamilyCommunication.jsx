import React from 'react';
import { Icon } from './Icon.jsx';

export function FamilyCommunication({
  eyebrow = 'Live Updates & Peace of Mind',
  title = 'Complete Transparency for Family & Caregivers',
  sub = 'Whether you are in another city or abroad, stay connected at every milestone of your parents’ hospital visit.',
  items = [],
}) {
  const defaultItems = [
    {
      icon: 'schedule',
      title: 'Milestone Timestamps',
      desc: 'Real-time SMS & WhatsApp alerts when the patient arrives, enters OPD consultation, and visits the pharmacy.',
    },
    {
      icon: 'support_agent',
      title: 'Direct Companion Phone Access',
      desc: 'Call or message the assigned care companion badge holder directly during the hospital visit.',
    },
    {
      icon: 'description',
      title: 'Post-Visit Care Dossier',
      desc: 'High-resolution scan of doctor prescriptions, follow-up instructions, and pharmacy receipts sent to your phone.',
    },
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <section className="pub-section">
      <div className="pub-container">
        <div style={{ textAlign: 'center', maxWidth: '42rem', margin: '0 auto 2.5rem' }}>
          {eyebrow && <span className="pub-eyebrow">{eyebrow}</span>}
          <h2 className="pub-h2">{title}</h2>
          {sub && <p className="pub-sub">{sub}</p>}
        </div>

        <div className="pub-grid-3">
          {displayItems.map((item, idx) => (
            <div
              key={idx}
              className="pub-card"
              style={{
                border: '1px solid var(--pub-outline-variant, #e2e8f0)',
                background: 'var(--pub-surface, #ffffff)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div
                className="pub-icon-tile"
                style={{
                  background: 'rgba(0, 67, 73, 0.08)',
                  color: 'var(--pub-primary, #004349)',
                  marginBottom: '16px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={item.icon || 'notifications_active'} size={26} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: 'var(--pub-on-surface, #0f172a)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--pub-on-surface-variant, #64748b)', lineHeight: 1.5 }}>
                {item.desc || item.body_en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
