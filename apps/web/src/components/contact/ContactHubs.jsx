import React from 'react';

// Operations hub section: title/eyebrow/subtitle only from CMS contact blocks,
// hub entries only from the CMS `contact.hubs.list` block or real contact
// settings — no hardcoded address and no hospital-count coverage claims.
export function ContactHubs({ blocks, contact }) {
  const safeBlocks = blocks || {};

  let customHubs = null;
  if (safeBlocks['contact.hubs.list']?.body_en) {
    try {
      const parsed = JSON.parse(safeBlocks['contact.hubs.list'].body_en);
      if (Array.isArray(parsed) && parsed.length > 0) customHubs = parsed;
    } catch {
      customHubs = null;
    }
  }

  const address = contact?.address_en || null;
  const cityName = contact?.socials?.city_hub_name || null;

  // Fall back to a single entry built from real contact settings only.
  const activeHubs = customHubs || (address || cityName ? [{ city: cityName, address }] : []);

  const eyebrow = safeBlocks['contact.hubs.eyebrow']?.body_en || null;
  const title = safeBlocks['contact.hubs.title']?.body_en || null;
  const subtitle = safeBlocks['contact.hubs.subtitle']?.body_en || null;

  if (activeHubs.length === 0) return null;

  return (
    <div className="contact-hubs-box">
      {(eyebrow || title || subtitle) && (
        <div className="contact-hubs-header">
          <div>
            {eyebrow && (
              <span className="contact-channel-eyebrow" style={{ color: 'var(--pub-primary-container)' }}>
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--pub-on-surface)' }}>
                {title}
              </h2>
            )}
          </div>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--pub-on-variant)', maxWidth: '420px', lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="contact-hubs-grid">
        {activeHubs.map((hub, idx) => (
          <div key={hub.city || hub.address || idx} className="contact-hub-card">
            <div>
              {(hub.city || hub.badge) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  {hub.city && (
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--pub-on-surface)' }}>
                      {hub.city}
                    </span>
                  )}
                  {hub.badge && (
                    <span className="contact-hub-badge">
                      {hub.badge}
                    </span>
                  )}
                </div>
              )}
              {hub.address && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--pub-on-variant)', lineHeight: 1.55, margin: 0 }}>
                  {hub.address}
                </p>
              )}
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
