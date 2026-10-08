import React from 'react';
import { Link } from 'react-router-dom';

function getInitials(name) {
  if (!name) return 'CG';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function RequestCareHeader({
  user,
  helplinePhone = '1800-AAYU-CARE',
  activeMetro = 'Bhimavaram',
  onExit,
}) {
  const caregiverName = user?.full_name || 'Caregiver Account';
  const cleanHelpline = typeof helplinePhone === 'object'
    ? (helplinePhone.body_en || helplinePhone.title_en || '1800-AAYU-CARE')
    : String(helplinePhone || '1800-AAYU-CARE');

  return (
    <header className="rc-header">
      <div className="rc-header-inner">
        {/* Brand section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link to="/app" className="rc-brand-link" title="AayuYukthi">
            <div className="rc-logo-box">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>spa</span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cust-primary)', letterSpacing: '-0.02em' }}>
              AayuYukthi
            </span>
          </Link>
          <span className="rc-portal-pill">
            Family Care Portal
          </span>
        </div>

        {/* Center: Title & Exit Link */}
        <div className="rc-header-center">
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            Request Care Accompaniment
          </span>
          <Link
            to="/app"
            onClick={onExit}
            className="rc-header-exit-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
            <span>Exit to Dashboard</span>
          </Link>
        </div>

        {/* Right tools: Helpline, Metro, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Urgent Desk Hotline */}
          <div style={{ display: 'none', flexDirection: 'column', textAlign: 'right' }} className="xl:flex">
            <span style={{ fontSize: '0.6875rem', color: 'var(--cust-on-surface-variant)', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--cust-tertiary-container)' }} />
              24/7 Urgent Care Desk
            </span>
            <a
              href={`tel:${cleanHelpline.replace(/[^0-9]/g, '') || '1800229822'}`}
              style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cust-primary)', textDecoration: 'none' }}
            >
              {cleanHelpline}
            </a>
          </div>

          {/* Active Metro */}
          <div style={{ display: 'none', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.625rem', borderRadius: '0.5rem', backgroundColor: 'var(--cust-surface-container-low)', fontSize: '0.75rem', color: 'var(--cust-on-surface-variant)' }} className="lg:flex">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-primary)' }}>location_on</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>{activeMetro}</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--cust-outline)' }}>Active Hub</span>
            </div>
          </div>

          {/* Caregiver Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-primary-container)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem'
              }}>
                {getInitials(user?.full_name)}
              </div>
              <span style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-primary)',
                border: '2px solid #ffffff'
              }} />
            </div>
            <div style={{ display: 'none', flexDirection: 'column', lineHeight: 1.2 }} className="sm:flex">
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                {caregiverName}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--cust-secondary)' }}>
                Primary Account
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
