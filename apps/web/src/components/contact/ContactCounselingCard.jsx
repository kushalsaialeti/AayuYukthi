import React from 'react';

export function ContactCounselingCard({ contact, blocks }) {
  const safeContact = contact || {};
  const safeBlocks = blocks || {};
  const directPhone = safeContact.socials?.rapid_phone || safeContact.phone || '1800-AAYU-CARE';
  const directDigits = directPhone.replace(/[^\d+]/g, '');

  const coordinatorImg = safeBlocks['contact.counseling.image_url']?.body_en
    || safeContact.socials?.coordinator_image_url
    || '';

  const deskBadge = safeBlocks['contact.counseling.badge']?.body_en || 'In-House Coordination Desk';
  const deskTitle = safeBlocks['contact.counseling.title']?.body_en || 'Certified Hospital Navigators';
  const guidanceHeading = safeBlocks['contact.counseling.heading']?.body_en || 'Human-First Healthcare Guidance';
  const guidanceDesc = safeBlocks['contact.counseling.desc']?.body_en
    || 'Our care coordinators are trained in hospital administrative workflows, patient privacy, and compassionate geriatric support. No call centers — speak directly with certified care specialists.';

  const defaultTrustPoints = [
    'Verified backgrounds, police vetted & hospital-badged',
    'Bilingual fluency (English, Telugu, Hindi, and regional dialects)',
    'Discreet insurance paperwork & discharge coordination',
  ];

  let trustPoints = defaultTrustPoints;
  if (safeBlocks['contact.counseling.points']?.body_en) {
    try {
      const parsed = JSON.parse(safeBlocks['contact.counseling.points'].body_en);
      if (Array.isArray(parsed) && parsed.length > 0) trustPoints = parsed;
    } catch {
      trustPoints = safeBlocks['contact.counseling.points'].body_en.split('\n').filter(Boolean);
    }
  }

  const rapidTitle = safeBlocks['contact.rapid.title']?.body_en || 'Need care in under 3 hours?';
  const rapidSubtitle = safeBlocks['contact.rapid.subtitle']?.body_en || 'Call our rapid transit coordination hotline directly.';

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
          <div className="contact-feature-overlay-text">
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
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              {deskTitle}
            </h3>
          </div>
        </div>

        <div className="contact-feature-body">
          <div className="contact-counseling-box">
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--pub-primary-container)', marginTop: '2px' }}>
              verified
            </span>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--pub-on-surface)' }}>
                {guidanceHeading}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pub-on-variant)', lineHeight: 1.55 }}>
                {guidanceDesc}
              </p>
            </div>
          </div>

          <div className="contact-trust-list">
            {trustPoints.map((point, idx) => (
              <div key={idx} className="contact-trust-item">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#059669' }}>check_circle</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Assistance Card */}
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
            <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--pub-on-surface)' }}>
              {rapidTitle}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pub-on-variant)' }}>
              {rapidSubtitle}
            </p>
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
    </div>
  );
}
