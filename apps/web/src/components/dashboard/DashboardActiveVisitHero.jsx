import React from 'react';
import { Link } from 'react-router-dom';

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Number.isNaN(age) || age < 0 ? null : age;
}

function formatSchedule(dateString) {
  if (!dateString) return 'Scheduled soon';
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function DashboardActiveVisitHero({
  activeVisit,
  helplinePhone = '1800-AAYU-CARE',
}) {
  const cleanPhone = typeof helplinePhone === 'object'
    ? (helplinePhone?.body_en || helplinePhone?.title_en || '1800-AAYU-CARE')
    : String(helplinePhone || '1800-AAYU-CARE');

  if (!activeVisit) {
    // No active visits — show simple CTA card
    return (
      <section className="dash-hero-card">
        <div className="dash-hero-microbar">
          <div className="dash-pulse-indicator">
            <span className="dash-pulse-dot">
              <span className="dash-pulse-dot-ring" />
              <span className="dash-pulse-dot-core" />
            </span>
            <span>Care Desks Active</span>
          </div>
          <span style={{ fontSize: '0.8125rem' }}>Partner Hospitals Online</span>
        </div>

        <div className="dash-hero-body" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '44rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
              Ready to schedule a hospital visit?
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
              Book a care companion to assist your loved one with hospital navigation, queue management, and doctor consultations.
            </p>
          </div>

          <Link to="/request-care" className="cust-btn-primary" style={{ padding: '0.625rem 1.25rem', whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              calendar_add_on
            </span>
            <span>Request Care</span>
          </Link>
        </div>
      </section>
    );
  }

  // Active or Upcoming Booking Card
  const scheduledDate = formatSchedule(activeVisit.appointment_date || activeVisit.schedule_at);
  const hospitalName = activeVisit.hospital?.name || 'Partner Hospital';
  const hospitalCity = activeVisit.hospital?.city || '';
  const serviceName = activeVisit.service?.title || 'Care Accompaniment';
  const recipient = activeVisit.recipient || {};
  const recipientAge = calculateAge(recipient.date_of_birth);
  const coordinatorName = activeVisit.coordinator?.name || 'Companion Assigned';

  // Stage computation (1 to 5)
  let stageNum = 2;
  let stageText = 'Companion Assigned';
  if (activeVisit.status === 'REQUEST_RECEIVED') {
    stageNum = 1;
    stageText = 'Request Received';
  } else if (activeVisit.status === 'UNDER_REVIEW') {
    stageNum = 2;
    stageText = 'Under Review';
  } else if (activeVisit.status === 'CONFIRMED' || activeVisit.status === 'SCHEDULED') {
    stageNum = 3;
    stageText = 'Confirmed';
  } else if (activeVisit.status === 'SERVICE_IN_PROGRESS' || activeVisit.status === 'IN_TRANSIT') {
    stageNum = 4;
    stageText = 'In Progress';
  } else if (activeVisit.status === 'COMPLETED') {
    stageNum = 5;
    stageText = 'Completed';
  }

  return (
    <section className="dash-hero-card">
      {/* Top Micro-bar */}
      <div className="dash-hero-microbar">
        <div className="dash-pulse-indicator">
          <span className="dash-pulse-dot">
            <span className="dash-pulse-dot-ring" />
            <span className="dash-pulse-dot-core" />
          </span>
          <span>Active Visit · {stageText}</span>
        </div>
        <span style={{ fontSize: '0.8125rem' }}>
          {scheduledDate}
        </span>
      </div>

      {/* Hero Core Content */}
      <div className="dash-hero-body">
        {/* Left Panel */}
        <div className="dash-hero-main">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
                {hospitalName}
              </h2>
              {hospitalCity && (
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'var(--cust-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
                    location_on
                  </span>
                  {hospitalCity}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span className="cust-chip" style={{ backgroundColor: 'var(--cust-secondary-container)', color: 'var(--cust-on-secondary-container)', fontWeight: 600 }}>
                {serviceName}
              </span>
            </div>

            {/* Recipient */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.625rem',
              backgroundColor: 'var(--cust-surface-container-low)',
            }}>
              <div style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}>
                {(recipient.name || 'R').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {recipient.name || 'Care Recipient'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                  {recipient.relationship || 'Family'}{recipientAge ? ` · ${recipientAge}y` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cust-primary)' }}>
              Step {stageNum} of 5 — {stageText}
            </span>
            <div className="dash-progress-track">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`dash-progress-seg ${s < stageNum ? 'is-filled' : s === stageNum ? 'is-active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Companion + Actions */}
        <div className="dash-hero-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--cust-secondary)' }}>
              Assigned Companion
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
              }}>
                {coordinatorName ? coordinatorName.slice(0, 2).toUpperCase() : 'CC'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {coordinatorName}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                  {activeVisit.coordinator?.role || 'Care Companion'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <a
                href={`tel:${cleanPhone.replace(/[^0-9]/g, '') || '1800229822'}`}
                className="cust-btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.5rem', gap: '0.25rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                <span>Call</span>
              </a>
              <Link
                to="/app/support"
                className="cust-btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.5rem', gap: '0.25rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>chat</span>
                <span>Support</span>
              </Link>
            </div>

            <Link
              to={`/app/requests/${activeVisit.id}`}
              className="cust-btn-primary"
              style={{ justifyContent: 'center' }}
            >
              <span>View Details</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
