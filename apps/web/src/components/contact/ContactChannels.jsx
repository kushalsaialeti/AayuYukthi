import React from 'react';

export function ContactChannels({ contact, blocks }) {
  const safeContact = contact || {};
  const safeBlocks = blocks || {};
  const tollFreeDisplay = safeContact.phone || '1800-AAYU-CARE';
  const tollFreeRaw = (safeContact.phone || '180022982273').replace(/[^\d+]/g, '');
  const hours = safeContact.hours_en || 'Mon–Sun, 7:00 AM – 9:00 PM IST';
  const supportEmail = safeContact.email || 'support@aayuyukthi.com';
  const partnershipsEmail = safeContact.socials?.partnerships_email || 'partnerships@aayuyukthi.com';
  const whatsappNumber = safeContact.socials?.whatsapp || '+91 98765 43210';
  const whatsappDigits = whatsappNumber.replace(/[^\d]/g, '');

  const phoneSub = safeContact.socials?.phone_sub || (safeContact.phone ? '' : '(1800-2298-2273)');
  const helplineDesc = safeBlocks['contact.channels.helpline_desc']?.body_en
    || safeContact.socials?.phone_desc
    || `Available ${hours}. Average response under 45 seconds with native multilingual support.`;
  const whatsappSub = safeBlocks['contact.channels.whatsapp_sub']?.body_en
    || safeContact.socials?.whatsapp_sub
    || 'Verified Care Business Account';
  const whatsappDesc = safeBlocks['contact.channels.whatsapp_desc']?.body_en
    || safeContact.socials?.whatsapp_desc
    || 'Send prescription photos, doctor appointment slips, discharge summaries, or request on-demand companion availability.';
  const supportSub = safeBlocks['contact.channels.support_sub']?.body_en
    || safeContact.socials?.support_sub
    || 'Family Coordination & Scheduling';
  const partnershipsSub = safeBlocks['contact.channels.partnerships_sub']?.body_en
    || safeContact.socials?.partnerships_sub
    || 'Hospital Networks & Corporate Plans';

  return (
    <div className="contact-channels-grid">
      {/* 1. Direct Helpline / Toll-Free */}
      <div className="contact-channel-card">
        <div className="contact-channel-stripe" style={{ backgroundColor: 'var(--pub-primary-container, #0d5c63)' }} />
        <div>
          <div className="contact-channel-icon-wrap" style={{ backgroundColor: 'rgba(13, 92, 99, 0.1)', color: 'var(--pub-primary-container, #0d5c63)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>call</span>
          </div>
          <span className="contact-channel-eyebrow">Direct Helpline</span>
          <h3 className="contact-channel-title">Toll-Free Coordination Desk</h3>
          <p className="contact-channel-highlight" style={{ color: 'var(--pub-primary-container, #0d5c63)' }}>
            {tollFreeDisplay}
          </p>
          {phoneSub && <p className="contact-channel-sub">{phoneSub}</p>}
          <p className="contact-channel-desc">
            {helplineDesc}
          </p>
        </div>
        <div className="contact-channel-footer">
          <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>Instant connect</span>
          <a className="contact-channel-action" href={`tel:${tollFreeRaw}`}>
            <span>Dial Toll-Free</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
          </a>
        </div>
      </div>

      {/* 2. Instant WhatsApp Concierge */}
      <div className="contact-channel-card">
        <div className="contact-channel-stripe" style={{ backgroundColor: '#25d366' }} />
        <div>
          <div className="contact-channel-icon-wrap" style={{ backgroundColor: 'rgba(37, 211, 102, 0.12)', color: '#128c7e' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chat</span>
          </div>
          <span className="contact-channel-eyebrow">Fast Messaging</span>
          <h3 className="contact-channel-title">Instant WhatsApp Concierge</h3>
          <p className="contact-channel-highlight" style={{ color: '#128c7e' }}>
            {whatsappNumber}
          </p>
          <p className="contact-channel-sub">{whatsappSub}</p>
          <p className="contact-channel-desc">
            {whatsappDesc}
          </p>
        </div>
        <div className="contact-channel-footer">
          <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>Response in &lt; 5 mins</span>
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

      {/* 3. Dedicated Support Desk */}
      <div className="contact-channel-card">
        <div className="contact-channel-stripe" style={{ backgroundColor: 'var(--pub-secondary, #4b6077)' }} />
        <div>
          <div className="contact-channel-icon-wrap" style={{ backgroundColor: 'rgba(75, 96, 119, 0.12)', color: 'var(--pub-secondary, #4b6077)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>mail</span>
          </div>
          <span className="contact-channel-eyebrow">Written Inquiries</span>
          <h3 className="contact-channel-title">Dedicated Support Desk</h3>
          <div style={{ margin: '0.5rem 0' }}>
            <a
              href={`mailto:${supportEmail}`}
              style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--pub-primary)', textDecoration: 'none', display: 'block' }}
            >
              {supportEmail}
            </a>
            <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>
              {supportSub}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <a
              href={`mailto:${partnershipsEmail}`}
              style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--pub-on-variant)', textDecoration: 'none', display: 'block' }}
            >
              {partnershipsEmail}
            </a>
            <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>
              {partnershipsSub}
            </span>
          </div>
        </div>
        <div className="contact-channel-footer">
          <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>Formal ticketing</span>
          <a className="contact-channel-action" href={`mailto:${supportEmail}`}>
            <span>Write an Email</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
}
