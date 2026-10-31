import React from 'react';

// Direct contact channels. Every row renders only when the underlying value
// exists in CMS contact settings — no fabricated phone numbers, emails,
// response-time SLAs or "verified account" claims.
export function ContactChannels({ contact, blocks }) {
  const safeContact = contact || {};
  const safeBlocks = blocks || {};

  const phone = safeContact.phone || null;
  const phoneRaw = phone ? phone.replace(/[^\d+]/g, '') : null;
  const phoneSub = safeContact.socials?.phone_sub || null;
  const helplineDesc =
    safeBlocks['contact.channels.helpline_desc']?.body_en || safeContact.socials?.phone_desc || null;

  const whatsappNumber = safeContact.socials?.whatsapp || null;
  const whatsappDigits = whatsappNumber ? whatsappNumber.replace(/[^\d]/g, '') : null;
  const whatsappSub =
    safeBlocks['contact.channels.whatsapp_sub']?.body_en || safeContact.socials?.whatsapp_sub || null;
  const whatsappDesc =
    safeBlocks['contact.channels.whatsapp_desc']?.body_en || safeContact.socials?.whatsapp_desc || null;

  const supportEmail = safeContact.email || null;
  const supportSub =
    safeBlocks['contact.channels.support_sub']?.body_en || safeContact.socials?.support_sub || null;
  const partnershipsEmail = safeContact.socials?.partnerships_email || null;
  const partnershipsSub =
    safeBlocks['contact.channels.partnerships_sub']?.body_en || safeContact.socials?.partnerships_sub || null;

  if (!phone && !whatsappNumber && !supportEmail) return null;

  return (
    <div className="contact-channels-grid">
      {/* 1. Direct phone line (only when a number is configured) */}
      {phone && (
        <div className="contact-channel-card">
          <div className="contact-channel-stripe" style={{ backgroundColor: 'var(--pub-primary-container, #0d5c63)' }} />
          <div>
            <div className="contact-channel-icon-wrap" style={{ backgroundColor: 'rgba(13, 92, 99, 0.1)', color: 'var(--pub-primary-container, #0d5c63)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>call</span>
            </div>
            <span className="contact-channel-eyebrow">Direct Line</span>
            <h3 className="contact-channel-title">Care Coordination Desk</h3>
            <p className="contact-channel-highlight" style={{ color: 'var(--pub-primary-container, #0d5c63)' }}>
              {phone}
            </p>
            {phoneSub && <p className="contact-channel-sub">{phoneSub}</p>}
            {helplineDesc && (
              <p className="contact-channel-desc">
                {helplineDesc}
              </p>
            )}
          </div>
          <div className="contact-channel-footer">
            <a className="contact-channel-action" href={`tel:${phoneRaw}`}>
              <span>Call This Number</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
            </a>
          </div>
        </div>
      )}

      {/* 2. WhatsApp (only when a WhatsApp number is configured) */}
      {whatsappNumber && (
        <div className="contact-channel-card">
          <div className="contact-channel-stripe" style={{ backgroundColor: '#25d366' }} />
          <div>
            <div className="contact-channel-icon-wrap" style={{ backgroundColor: 'rgba(37, 211, 102, 0.12)', color: '#128c7e' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chat</span>
            </div>
            <span className="contact-channel-eyebrow">Messaging</span>
            <h3 className="contact-channel-title">WhatsApp</h3>
            <p className="contact-channel-highlight" style={{ color: '#128c7e' }}>
              {whatsappNumber}
            </p>
            {whatsappSub && <p className="contact-channel-sub">{whatsappSub}</p>}
            {whatsappDesc && (
              <p className="contact-channel-desc">
                {whatsappDesc}
              </p>
            )}
          </div>
          <div className="contact-channel-footer">
            <a
              className="contact-channel-action"
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Chat on WhatsApp</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>launch</span>
            </a>
          </div>
        </div>
      )}

      {/* 3. Email (only when an address is configured) */}
      {supportEmail && (
        <div className="contact-channel-card">
          <div className="contact-channel-stripe" style={{ backgroundColor: 'var(--pub-secondary, #4b6077)' }} />
          <div>
            <div className="contact-channel-icon-wrap" style={{ backgroundColor: 'rgba(75, 96, 119, 0.12)', color: 'var(--pub-secondary, #4b6077)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>mail</span>
            </div>
            <span className="contact-channel-eyebrow">Written Inquiries</span>
            <h3 className="contact-channel-title">Email Support Desk</h3>
            <div style={{ margin: '0.5rem 0' }}>
              <a
                href={`mailto:${supportEmail}`}
                style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--pub-primary)', textDecoration: 'none', display: 'block' }}
              >
                {supportEmail}
              </a>
              {supportSub && (
                <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>
                  {supportSub}
                </span>
              )}
            </div>
            {partnershipsEmail && (
              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href={`mailto:${partnershipsEmail}`}
                  style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--pub-on-variant)', textDecoration: 'none', display: 'block' }}
                >
                  {partnershipsEmail}
                </a>
                {partnershipsSub && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>
                    {partnershipsSub}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="contact-channel-footer">
            <a className="contact-channel-action" href={`mailto:${supportEmail}`}>
              <span>Write an Email</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
