import React from 'react';

export function ContactHubs({ blocks, contact, hospitalsCount }) {
  const safeBlocks = blocks || {};
  const eyebrow = safeBlocks['contact.hubs.eyebrow']?.body_en || 'City Operations & Liaison';
  const cityName = contact?.socials?.city_hub_name || 'Bhimavaram';
  const title = safeBlocks['contact.hubs.title']?.body_en || `${cityName} Operations Hub`;
  const subtitle = safeBlocks['contact.hubs.subtitle']?.body_en ||
    `Dedicated companion coordinators active across leading hospitals in ${cityName}.`;

  let customHubs = null;
  if (safeBlocks['contact.hubs.list']?.body_en) {
    try {
      customHubs = JSON.parse(safeBlocks['contact.hubs.list'].body_en);
    } catch {
      customHubs = null;
    }
  }

  const defaultCoverage = contact?.socials?.city_hub_coverage
    || (hospitalsCount
        ? `Dedicated accompaniment across ${hospitalsCount} accredited partner hospitals in ${cityName}`
        : `Dedicated accompaniment across accredited partner hospitals in ${cityName}`);

  const activeHubs = customHubs || [
    {
      city: cityName,
      badge: 'Primary Operations Hub',
      address: contact?.address_en || 'Main Road, Bhimavaram, West Godavari District, Andhra Pradesh 534201',
      hospitals: defaultCoverage,
    }
  ];

  if (!activeHubs || activeHubs.length === 0) return null;

  return (
    <div className="contact-hubs-box">
      <div className="contact-hubs-header">
        <div>
          <span className="contact-channel-eyebrow" style={{ color: 'var(--pub-primary-container)' }}>
            {eyebrow}
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--pub-on-surface)' }}>
            {title}
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--pub-on-variant)', maxWidth: '420px', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>

      <div className="contact-hubs-grid">
        {activeHubs.map((hub) => (
          <div key={hub.city} className="contact-hub-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--pub-on-surface)' }}>
                  {hub.city}
                </span>
                <span className="contact-hub-badge">
                  {hub.badge || 'Operations Hub'}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--pub-on-variant)', lineHeight: 1.55, margin: 0 }}>
                {hub.address}
              </p>
            </div>
            {hub.hospitals && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: 'var(--pub-on-variant)',
                fontWeight: 500,
                borderTop: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--pub-primary-container)' }}>
                  local_hospital
                </span>
                <span>{hub.hospitals}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
