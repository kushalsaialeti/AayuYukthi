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

const AVATAR_PRESETS = {
  mother:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6sp8k8cmMPBfnukguURh_AJz3i-Jj4AofgyvjIq-150i_A3cmZEAYN-swTi7neusLr-UlQ90wYc4BwJ0OEroAntufio4sd00_thLCM5q3H7GhBBppmIpJgZ9QPGMAvBlSENCaKULBhlBjrj0y8Wql2WMu0I0xGpNpvWm22fERVLAGxpBz_H8tEj8Kni4Kxuuu5Rb23U-I_u38rfEBBIL-Kt0OLxIQPTy_R7_0iWXVsrKyk2DlIN8',
  father:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDvnlgvnxSkTutuNQtR3vVmKoUTF12qZglQXpaQxySjfCAaa7sedcTcwJRQqIn-5X-r2JVQCKt_SAo2gRfKSn7RfOhFkbYnObN9jE1z3U2AkF2GxT8bIUre-r-PIt2GYF8VRO50keZ2fYR1dRkj6TMWk9E-64cwUM76tubF0BTeAG9Nxd6N-PEv9EHtBUqWWQm3mkvtemTjsHSkPftOBHiFVybP2sEGH3WJ_ms8T275bc6l1D8lk4g',
  female:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDiqqIFmNiXAWNFjnw9vaupT5yyikS7P6IttIlqfc8z92pULyZGxTmK7V8f8zkTXVOTRbOb-fnW-u-J_3UY1ZIfqlIifVxTLLVsGXAcJ2J6foyODjkdKZ1EwH3nqXU52ja6xwWz9e-CePkyZCHWnYz6ey9shgZ-DgFcTf7_wZZcTV0fGZkaaBJMADVjsLzdnTdZsuPQkZ8w2lSqDATmcjFT4HNbV7948MZdNqAPPudCAPrc7PHLpCM',
  default:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
};

function getAvatarUrl(recipient) {
  if (recipient?.image_url) return recipient.image_url;
  const rel = (recipient?.relationship || '').toLowerCase();
  const gen = (recipient?.gender || '').toLowerCase();
  if (rel.includes('mother') || rel.includes('mom')) return AVATAR_PRESETS.mother;
  if (rel.includes('father') || rel.includes('dad')) return AVATAR_PRESETS.father;
  if (gen === 'female' || rel.includes('wife')) return AVATAR_PRESETS.female;
  return AVATAR_PRESETS.default;
}

const getRecipientAvatar = getAvatarUrl;

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
    // When no active visits exist: Clean Bhimavaram Companion Service Card
    return (
      <section className="dash-hero-card">
        <div className="dash-hero-microbar">
          <div className="dash-pulse-indicator">
            <span className="dash-pulse-dot">
              <span className="dash-pulse-dot-ring" />
              <span className="dash-pulse-dot-core" />
            </span>
            <span>Bhimavaram Care Desks Active</span>
          </div>
          <span style={{ fontSize: '0.8125rem' }}>Partner Hospitals Network Online</span>
        </div>

        <div className="dash-hero-body" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '44rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="cust-chip" style={{ backgroundColor: 'var(--cust-secondary-container)', color: 'var(--cust-on-secondary-container)', fontWeight: 600 }}>
                Bhimavaram &amp; Surrounding
              </span>
              <span className="cust-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
                  accessible
                </span>
                Wheelchair Logistics
              </span>
              <span className="cust-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
                  verified
                </span>
                Verified Hospital Escort
              </span>
            </div>

            <h2 style={{ margin: '0.25rem 0', fontSize: '1.35rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
              Ready to schedule a hospital accompaniment?
            </h2>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.55 }}>
              Book an empathetic, background-verified care companion to assist your loved one with gate pickup, wheelchair transport, OPD queue standing, and doctor note summaries across partner hospitals in Bhimavaram.
            </p>
          </div>

          <Link to="/request-care" className="cust-btn-primary" style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              calendar_add_on
            </span>
            <span>Request Care Visit</span>
          </Link>
        </div>
      </section>
    );
  }

  // Active or Upcoming Booking Card
  const refCode = `#SRV-${activeVisit.id ? activeVisit.id.slice(0, 6).toUpperCase() : '993821'}`;
  const scheduledDate = formatSchedule(activeVisit.appointment_date || activeVisit.schedule_at);
  const hospitalName = activeVisit.hospital?.name || 'Selected Partner Hospital';
  const hospitalCity = activeVisit.hospital?.city || 'Bhimavaram';
  const serviceName = activeVisit.service?.title || 'Hospital Care Accompaniment';
  const recipient = activeVisit.recipient || {};
  const recipientAge = calculateAge(recipient.date_of_birth);
  const avatarUrl = getAvatarUrl(recipient);
  const coordinatorName = activeVisit.coordinator?.name || 'Assigned Senior Companion';

  // Stage computation (1 to 5)
  let stageNum = 2;
  let stageText = 'Stage 2 of 5: Companion Assigned';
  if (activeVisit.status === 'REQUEST_RECEIVED') {
    stageNum = 1;
    stageText = 'Stage 1 of 5: Request Received';
  } else if (activeVisit.status === 'UNDER_REVIEW') {
    stageNum = 2;
    stageText = 'Stage 2 of 5: Pre-visit Briefing Complete';
  } else if (activeVisit.status === 'IN_TRANSIT') {
    stageNum = 3;
    stageText = 'Stage 3 of 5: En Route to Gate Porch';
  } else if (activeVisit.status === 'COMPLETED') {
    stageNum = 5;
    stageText = 'Stage 5 of 5: Journey Successfully Completed';
  }

  return (
    <section className="dash-hero-card">
      {/* Top Ambient Micro-bar */}
      <div className="dash-hero-microbar">
        <div className="dash-pulse-indicator">
          <span className="dash-pulse-dot">
            <span className="dash-pulse-dot-ring" />
            <span className="dash-pulse-dot-core" />
          </span>
          <span>Active Booking • {activeVisit.status?.replace('_', ' ') || 'Dispatch Confirmed'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
          <span>Ref ID: <strong style={{ color: '#ffffff' }}>{refCode}</strong></span>
          <span>•</span>
          <span>Scheduled: <strong style={{ color: '#ffffff' }}>{scheduledDate}</strong></span>
        </div>
      </div>

      {/* Hero Core Content */}
      <div className="dash-hero-body">
        {/* Left Sub-panel */}
        <div className="dash-hero-main">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="cust-chip" style={{ backgroundColor: 'var(--cust-secondary-container)', color: 'var(--cust-on-secondary-container)', fontWeight: 600 }}>
                {serviceName}
              </span>
              <span className="cust-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-tertiary-container)' }}>
                  accessible
                </span>
                {activeVisit.pickup_required ? 'Wheelchair & Transit Pre-arranged' : 'Standard Escort'}
              </span>
            </div>

            <div>
              <h2 style={{ margin: '0.125rem 0', fontSize: '1.35rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
                {hospitalName}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--cust-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
                  location_on
                </span>
                {hospitalCity} • Gate 1 Main Entrance Porch
              </p>
            </div>

            {/* Recipient Profile Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--cust-surface-container-low)',
              maxWidth: '28rem'
            }}>
              <img
                src={avatarUrl}
                alt={recipient.name || 'Recipient'}
                style={{ width: '3rem', height: '3rem', borderRadius: '9999px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                    {recipient.name || 'Care Recipient'}
                  </span>
                  <span className="cust-chip" style={{ padding: '0.125rem 0.35rem', fontSize: '0.6875rem' }}>
                    {recipient.relationship || 'Family'}{recipientAge ? `, ${recipientAge}y` : ''}
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
                  {activeVisit.additional_requirements || 'Hospital Consultation & Medical Navigation'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Step Status Progress Mini-bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--cust-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  hourglass_top
                </span>
                {stageText}
              </span>
              <span style={{ color: 'var(--cust-secondary)' }}>
                Rendezvous: Gate 1 Porch
              </span>
            </div>

            {/* Visual Segmented Bar */}
            <div className="dash-progress-track">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`dash-progress-seg ${s < stageNum ? 'is-filled' : s === stageNum ? 'is-active' : ''}`}
                />
              ))}
            </div>

            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.4 }}>
              Companion is briefed and coordinating pre-consultation desk logistics. Real-time arrival milestones will be dispatched to your phone.
            </p>
          </div>
        </div>

        {/* Right Sub-panel: Assigned Companion Card */}
        <div className="dash-hero-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cust-secondary)' }}>
                Care Escort Lead
              </span>
              <span className="cust-chip" style={{ backgroundColor: 'var(--cust-primary-fixed)', color: 'var(--cust-on-primary-fixed-variant)', fontSize: '0.6875rem', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                Verified Lead
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
              }}>
                {coordinatorName ? coordinatorName.slice(0, 2).toUpperCase() : 'CC'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {coordinatorName}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                  {activeVisit.coordinator?.role || 'Hospital Care Companion'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--cust-primary)', fontWeight: 600, marginTop: '0.125rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    shield
                  </span>
                  <span>Active Ground Escort</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--cust-surface-container-lowest)',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--cust-secondary)' }}>Care Station:</span>
                <span style={{ fontWeight: 600, color: 'var(--cust-primary)' }}>{hospitalName} Desk</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <a
                href={`tel:${cleanPhone.replace(/[^0-9]/g, '') || '1800229822'}`}
                className="cust-btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.5rem', gap: '0.25rem', backgroundColor: 'var(--cust-tertiary-container)', color: '#ffffff', border: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                <span>Call Desk</span>
              </a>
              <Link
                to="/app/support"
                className="cust-btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.5rem', gap: '0.25rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>chat</span>
                <span>Support Desk</span>
              </Link>
            </div>

            <Link
              to={`/app/requests/${activeVisit.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--cust-primary)',
                textDecoration: 'none',
                paddingTop: '0.25rem'
              }}
            >
              <span>Open Live Visit Timeline &amp; Gate Protocol</span>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
