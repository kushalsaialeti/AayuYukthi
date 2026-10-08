import React from 'react';

export function ProfileHeaderCard({
  user,
  recipientsCount = 0,
  requestsCount = 0,
  cmsBlocks = {},
  onSignOut,
  onEditClick,
}) {
  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const memberYear = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Nov 2024';

  const badgeText = cmsBlocks['profile.header.badge']?.body_en || 'Family Caregiver Account Admin';
  const networkText = cmsBlocks['profile.header.network']?.body_en || 'Apollo Bannerghatta & Manipal Old Airport Road Network';
  const healthStatus = cmsBlocks['profile.health.status']?.body_en || 'Active & Insured';
  const punctualityScore = cmsBlocks['profile.stats.punctuality']?.body_en || '100%';
  const billingBalance = cmsBlocks['profile.stats.billing']?.body_en || '₹0 Pending';

  return (
    <div className="profile-hero-card">
      <div className="profile-hero-glow" />

      {/* Top Identity & Summary Row */}
      <div className="profile-hero-top">
        {/* Left: Avatar & Caregiver Details */}
        <div className="profile-identity-block">
          <div className="profile-avatar-large">
            {getInitials(user?.full_name)}
            <div className="profile-avatar-badge" title="Identity Verified">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
            </div>
          </div>

          <div className="profile-identity-meta">
            <div className="profile-name-badge-row">
              <h2 className="profile-full-name">{user?.full_name || 'Caregiver Account'}</h2>
              <span className="profile-role-pill">{badgeText}</span>
            </div>

            <div className="profile-network-strip">
              <span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-surface-tint, #20686f)' }}>verified_user</span>
                Member since {memberYear} • Verified Identity
              </span>
              <span style={{ color: 'var(--cust-outline-variant)' }}>•</span>
              <span style={{ fontWeight: 500, color: 'var(--cust-on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>domain</span>
                {networkText}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Account Health & Sparkline */}
        <div className="profile-health-widget">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--cust-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Account Health
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cust-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {healthStatus}
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-surface-tint)' }}>check_circle</span>
            </span>
          </div>

          <div style={{ width: '4rem', height: '2rem', flexShrink: 0 }}>
            <svg style={{ width: '100%', height: '100%', color: 'var(--cust-surface-tint)' }} fill="none" viewBox="0 0 64 32">
              <path d="M2 28L14 20L26 24L38 12L50 16L62 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Key Stats Strip (4 Metrics) */}
      <div className="profile-stats-grid">
        {/* Stat 1: Recipients */}
        <div className="profile-stat-item">
          <div className="profile-stat-header">
            <span>Recipients</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>family_restroom</span>
          </div>
          <span className="profile-stat-val">
            {recipientsCount > 0 ? `${recipientsCount} Active` : '3 Active'}
          </span>
          <span className="profile-stat-sub" style={{ color: 'var(--cust-primary)', fontWeight: 600 }}>
            Family Members
          </span>
        </div>

        {/* Stat 2: Care Journeys */}
        <div className="profile-stat-item">
          <div className="profile-stat-header">
            <span>Care Journeys</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
          </div>
          <span className="profile-stat-val">
            {requestsCount > 0 ? `${requestsCount} Visits` : '13 Visits'}
          </span>
          <span className="profile-stat-sub">
            Escorted & Scheduled
          </span>
        </div>

        {/* Stat 3: Punctuality Score */}
        <div className="profile-stat-item">
          <div className="profile-stat-header">
            <span>Punctuality Score</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>avg_pace</span>
          </div>
          <span className="profile-stat-val highlight">{punctualityScore}</span>
          <span className="profile-stat-sub">Handshake verified</span>
        </div>

        {/* Stat 4: Billing Balance */}
        <div className="profile-stat-item">
          <div className="profile-stat-header">
            <span>Billing Balance</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance_wallet</span>
          </div>
          <span className="profile-stat-val">{billingBalance}</span>
          <span className="profile-stat-sub" style={{ color: 'var(--cust-surface-tint)', fontWeight: 600 }}>
            Auto-settled post-visit
          </span>
        </div>
      </div>
    </div>
  );
}
