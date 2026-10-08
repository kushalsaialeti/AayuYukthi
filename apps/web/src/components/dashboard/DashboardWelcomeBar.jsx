import React from 'react';
import { Link } from 'react-router-dom';

export function DashboardWelcomeBar({
  user,
  activeCount = 0,
  nextHospitalName = '',
  cmsConfig = {},
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : 'Family Caregiver';
  const greeting = `${getGreeting()}, ${firstName}`;

  const defaultStatusText = activeCount > 0
    ? `Here is your family's care status today. You have ${activeCount} active hospital accompaniment ${
        activeCount === 1 ? 'visit' : 'visits'
      } scheduled${nextHospitalName ? ` at ${nextHospitalName}` : ''}.`
    : `Here is your family's care status today. All accompaniment and transit desks are active across Bhimavaram partner hospitals. Schedule a visit whenever you need guidance.`;

  const sanitize = (val, fallback) => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.body_en || val.title_en || val.body || val.title || fallback;
    return String(val);
  };

  const statusText = sanitize(cmsConfig.welcome_sub, defaultStatusText);
  const badgeText = sanitize(cmsConfig.welcome_badge, 'Family Care Shield Active');

  const handleDownloadSummary = () => {
    window.print();
  };

  return (
    <section className="dash-welcome-bar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div className="dash-shield-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            verified_user
          </span>
          <span>{badgeText}</span>
        </div>
        <h1 className="dash-welcome-title">{greeting}</h1>
        <p className="dash-welcome-sub">{statusText}</p>
      </div>

      <div className="dash-welcome-actions no-print">
        <button
          type="button"
          onClick={handleDownloadSummary}
          className="cust-btn-secondary"
          title="Print or save care summary log"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-secondary)' }}>
            download
          </span>
          <span>Download Care Summary</span>
        </button>

        <Link to="/request-care" className="cust-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add_circle
          </span>
          <span>Request New Care</span>
        </Link>
      </div>
    </section>
  );
}
