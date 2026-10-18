import React from 'react';
import { Link } from 'react-router-dom';

export function ProfileRecipientsSidebar({ recipients = [] }) {
  const displayRecipients = (recipients || []).map((r) => ({
    id: r.id,
    full_name: r.full_name || r.name,
    relationship: r.relationship ? `${r.relationship.charAt(0).toUpperCase() + r.relationship.slice(1)}${r.age_years ? ` (${r.age_years} yrs)` : ''}` : 'Family Member',
    care_focus: r.care_level ? `${r.care_level.charAt(0).toUpperCase() + r.care_level.slice(1)} Care` : 'General Assistance',
    initials: (r.full_name || r.name)?.slice(0, 2)?.toUpperCase() || 'FM',
  }));

  return (
    <div className="profile-section-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="profile-section-title">Registered Recipients</h3>
        <Link
          to="/app/recipients"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--cust-primary, #004349)',
            textDecoration: 'none',
          }}
        >
          Manage All
        </Link>
      </div>

      {displayRecipients.length === 0 ? (
        <div style={{
          padding: '1.25rem 0.75rem',
          textAlign: 'center',
          backgroundColor: 'var(--cust-surface-container-low, #f2f4f3)',
          borderRadius: '0.75rem',
        }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            No recipients registered
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
            Add family members who need hospital accompaniment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {displayRecipients.map((rec) => (
            <div key={rec.id} className="profile-recipient-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="profile-recipient-avatar-initials">
                  {rec.initials}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                    {rec.full_name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                    {rec.relationship} • {rec.care_focus}
                  </span>
                </div>
              </div>

              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-surface-tint)' }}>
                check_circle
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/app/recipients/new"
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '0.625rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--cust-surface-container-high, #e6e9e8)',
          color: 'var(--cust-on-surface-variant, #3f484a)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          textAlign: 'center',
          textDecoration: 'none',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cust-surface-container)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--cust-surface-container-high)')}
      >
        + Add Another Family Member
      </Link>
    </div>
  );
}
