import React from 'react';

// Care-desk feature card + quick assistance. All descriptive copy and trust
// points come from CMS contact blocks; the call action renders only when a
// real phone number exists in contact settings.
export function ContactCounselingCard({ contact, blocks }) {
  const safeContact = contact || {};
  const safeBlocks = blocks || {};

  const directPhone = safeContact.socials?.rapid_phone || safeContact.phone || null;
  const directDigits = directPhone ? directPhone.replace(/[^\d+]/g, '') : null;

  const coordinatorImg = safeBlocks['contact.counseling.image_url']?.body_en
    || safeContact.socials?.coordinator_image_url
    || '';

  const deskBadge = safeBlocks['contact.counseling.badge']?.body_en || null;
  const deskTitle = safeBlocks['contact.counseling.title']?.body_en || null;
  const guidanceHeading = safeBlocks['contact.counseling.heading']?.body_en || null;
  const guidanceDesc = safeBlocks['contact.counseling.desc']?.body_en || null;

  // Trust points only when the CMS provides them — no invented credentials.
  let trustPoints = [];
  if (safeBlocks['contact.counseling.points']?.body_en) {
    try {
      const parsed = JSON.parse(safeBlocks['contact.counseling.points'].body_en);
      if (Array.isArray(parsed)) trustPoints = parsed.filter(Boolean);
    } catch {
      trustPoints = safeBlocks['contact.counseling.points'].body_en.split('\n').filter(Boolean);
    }
  }

  const rapidTitle = safeBlocks['contact.rapid.title']?.body_en || null;
  const rapidSubtitle = safeBlocks['contact.rapid.subtitle']?.body_en || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="contact-feature-card">
        <div className="contact-feature-banner">
          {coordinatorImg ? (
            <img
              src={coordinatorImg}
              alt="AayuYukthi Hospital Care Coordinator"
              className="contact-feature-img"
            />
          ) : (
            /* Wireframe / architectural illustration fallback */
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: '220px',
                backgroundColor: 'var(--pub-surface-container, #eceeed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Wireframe background pattern */}
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: 0, opacity: 0.15 }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="wf-grid-counsel" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#wf-grid-counsel)" />
              </svg>

              {/* Wireframe Healthcare Desk Icon */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1, color: 'var(--pub-primary, #004349)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>
                  support_agent
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  AayuYukthi Care Coordination Desk
                </span>
              </div>
            </div>
          )}

          <div className="contact-feature-gradient" />
          {(deskBadge || deskTitle) && (
            <div className="contact-feature-overlay-text">
              {deskBadge && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#ffffff'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#34d399' }} />
                  {deskBadge}
                </span>
              )}
              {deskTitle && (
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                  {deskTitle}
                </h3>
              )}
            </div>
          )}
        </div>

        <div className="contact-feature-body">
          {(guidanceHeading || guidanceDesc) && (
            <div className="contact-counseling-box">
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--pub-primary-container)', marginTop: '2px' }}>
                verified
              </span>
              <div>
                {guidanceHeading && (
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--pub-on-surface)' }}>
                    {guidanceHeading}
                  </h4>
                )}
                {guidanceDesc && (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pub-on-variant)', lineHeight: 1.55 }}>
                    {guidanceDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {trustPoints.length > 0 && (
            <div className="contact-trust-list">
              {trustPoints.map((point, idx) => (
                <div key={idx} className="contact-trust-item">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#059669' }}>check_circle</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Assistance Card — only when a real number is available */}
      {directPhone && (
        <div className="contact-rapid-assistance">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--pub-primary-container)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>compare_arrows</span>
            </div>
            <div>
              {rapidTitle && (
                <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--pub-on-surface)' }}>
                  {rapidTitle}
                </h4>
              )}
              {rapidSubtitle && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pub-on-variant)' }}>
                  {rapidSubtitle}
                </p>
              )}
            </div>
          </div>
          <a
            href={`tel:${directDigits}`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--pub-primary-container)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Call Direct
          </a>
        </div>
      )}
    </div>
  );
}
