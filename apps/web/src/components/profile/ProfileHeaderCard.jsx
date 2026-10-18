import React from 'react';

export function ProfileHeaderCard({
  user,
  recipientsCount = 0,
  requestsCount = 0,
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
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="profile-hero-card">
      {/* Top Identity Row */}
      <div className="profile-hero-top">
        <div className="profile-identity-block">
          <div className="profile-avatar-large">
            {getInitials(user?.full_name)}
          </div>

          <div className="profile-identity-meta">
            <div className="profile-name-badge-row">
              <h2 className="profile-full-name">{user?.full_name || 'My Account'}</h2>
              <span className="profile-role-pill">Primary Account</span>
            </div>

            <div className="profile-network-strip">
              {user?.email && (
                <span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                  {user.email}
                </span>
              )}
              {user?.phone && (
                <>
                  <span style={{ color: 'var(--cust-outline-variant)' }}>•</span>
                  <span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                    {user.phone}
                  </span>
                </>
              )}
              {memberYear && (
                <>
                  <span style={{ color: 'var(--cust-outline-variant)' }}>•</span>
                  <span>Member since {memberYear}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="cust-btn-secondary"
            style={{ alignSelf: 'flex-start' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Key Stats Strip (Clean 2-card stats) */}
      <div className="profile-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="profile-stat-item">
          <div className="profile-stat-header">
            <span>Family Members</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>family_restroom</span>
          </div>
          <span className="profile-stat-val">
            {recipientsCount}
          </span>
          <span className="profile-stat-sub">
            Care recipients registered
          </span>
        </div>

        <div className="profile-stat-item">
          <div className="profile-stat-header">
            <span>Hospital Visits</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
          </div>
          <span className="profile-stat-val">
            {requestsCount}
          </span>
          <span className="profile-stat-sub">
            Total care requests booked
          </span>
        </div>
      </div>
    </div>
  );
}
