import React, { useState } from 'react';

export function TelemetryStatusBanner({
  status,
  companionName = 'Rajesh Varma',
  recipientName = 'Patient',
  helplinePhone = '1800-AAYU-CARE',
  companionPhone = '+91 98765 43210',
  cmsConfig = {},
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryLabel, setRetryLabel] = useState('Retry Telemetry Sync');

  const safeCompanion = companionName || 'Care Companion';
  const companionFirstName = safeCompanion.split(' ')[0] || 'Companion';
  const safeRecipient = recipientName || 'Patient';

  const isDisrupted = status === 'SERVICE_IN_PROGRESS' || !status || status === 'CONFIRMED' || status === 'COORDINATION_IN_PROGRESS';

  const defaultTitle = isDisrupted
    ? 'Escort Telemetry Disrupted — Ground Team Contacted'
    : 'Live Escort Telemetry Synchronized';

  const defaultBadge = isDisrupted ? 'Manual Relay Active' : 'Live Sync Active';

  const defaultBody = isDisrupted
    ? `Live GPS location ping for Companion ${safeCompanion} timed out 4 minutes ago due to hospital basement network blindspot (Tower B Radiology). On-ground Care Coordinator Sister Rekha is in direct radio contact. Patient ${safeRecipient} is safe and comfortably seated in the consultation lounge.`
    : `Continuous telemetry beacon for Companion ${safeCompanion} is online. Real-time updates and doctor visit notes are streaming live. Patient ${safeRecipient} is accompanied under our Zero-Separation Protocol.`;

  const bannerTitle = cmsConfig.title || defaultTitle;
  const bannerBadge = cmsConfig.badge || defaultBadge;
  const bannerBody = cmsConfig.body || defaultBody;

  const handleRetryTelemetry = () => {
    if (retrying) return;
    setRetrying(true);
    setRetryLabel('Pinging Hospital Node…');

    setTimeout(() => {
      setRetryLabel('Mesh Offline • SMS Relay Active');
      setTimeout(() => {
        setRetryLabel('Retry Telemetry Sync');
        setRetrying(false);
      }, 3000);
    }, 1800);
  };

  const cleanHelpline = typeof helplinePhone === 'object'
    ? (helplinePhone.phone || helplinePhone.body_en || '1800-AAYU-CARE')
    : String(helplinePhone || '1800-AAYU-CARE');

  return (
    <section className="rd-alert-banner">
      {/* Decorative ambient backdrop */}
      <div
        style={{
          position: 'absolute',
          right: '-3rem',
          bottom: '-3rem',
          width: '16rem',
          height: '16rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(140, 57, 35, 0.08)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
        }}
      />

      <div className="rd-alert-inner">
        <div className="rd-alert-content">
          <div className="rd-alert-icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {isDisrupted ? 'signal_cellular_connected_no_internet_4_bar' : 'cell_tower'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cust-on-tertiary-fixed-variant, #7c2e19)' }}>
                {bannerTitle}
              </span>
              <span className="rd-alert-badge">{bannerBadge}</span>
            </div>

            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--cust-on-tertiary-fixed-variant, #7c2e19)', lineHeight: 1.6 }}>
              {bannerBody}
            </p>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="rd-alert-actions">
          <a
            href={`tel:${cleanHelpline.replace(/[^0-9+]/g, '')}`}
            className="rd-btn-call-desk"
            title="Call 24/7 Desk Coordinator"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>phone_in_talk</span>
            <span>Call Desk Coordinator</span>
          </a>

          <button
            type="button"
            className="rd-btn-retry"
            onClick={handleRetryTelemetry}
            disabled={retrying}
            title="Ping ground station to refresh telemetry"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '20px',
                animation: retrying ? 'spin 1s linear infinite' : 'none',
              }}
            >
              sync
            </span>
            <span>{retryLabel}</span>
          </button>

          <a
            href={`tel:${(companionPhone || cleanHelpline).replace(/[^0-9+]/g, '')}`}
            className="rd-btn-call-companion"
            title={`Direct call to ${safeCompanion}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dialer_sip</span>
            <span>Call {companionFirstName} ({companionPhone || cleanHelpline})</span>
          </a>
        </div>
      </div>
    </section>
  );
}
