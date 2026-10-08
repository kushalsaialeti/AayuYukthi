import React from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_FALLBACK_RECIPIENTS = [
  {
    id: 'sample-1',
    full_name: 'K. S. Murthy',
    relationship: 'Father (78 yrs)',
    care_focus: 'Nephrology Care',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpB-SLzR2sZtHz3nx0D-GEC5MmnCV5lpD7yKbg1TgsCudxGEFuQXJHAEjMJY79u8Iib46zuwnK_bNImgnzaKFaHxq5_u-ZJnMIfc5pJQfvcrMp3BxWm2pYH_PzjKFzc_7SQz5habvheYaVFxmIzQGOpyfmGZo-zTZUMmoTo4cr9VgDBV_l5xlIKIE8THCq7bx4FGSuZn3n_S6vBY6ZNNsFPzqmjM8IgN_Zgc9UsZoCXkM5eGvMD8k',
  },
  {
    id: 'sample-2',
    full_name: 'Lakshmi Murthy',
    relationship: 'Mother (73 yrs)',
    care_focus: 'Cardiology Routine',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGr8J8fM8o_pXwLJxvftXsCtitvm_SKNlpt91fWl6IU34b3PZXSq4RE7drrBYyXuai82Y_Doro5Vho0v17FMJkvzgDdCCLrIt1Y391Cg3Z5D5ZxFyBv-6c1ikUP_en8EF3yBKcg_f93nNcODTmtOmc4W6X5jiS2VyuyNY851uTXPPRn6oYn6l7ggg62ADwJd2bho9U4uBtSSrxwN0uYEhCAXtoX_0IoAMqLib2foTnPQiTX5eH4hc',
  },
  {
    id: 'sample-3',
    full_name: 'Radha Ananth',
    relationship: 'Aunt (69 yrs)',
    care_focus: 'Orthopedic Rehab',
    initials: 'RA',
  },
];

export function ProfileRecipientsSidebar({ recipients = [] }) {
  const displayRecipients = recipients && recipients.length > 0
    ? recipients.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        relationship: r.relationship ? `${r.relationship.charAt(0).toUpperCase() + r.relationship.slice(1)}${r.age_years ? ` (${r.age_years} yrs)` : ''}` : 'Family Member',
        care_focus: r.care_level ? `${r.care_level.charAt(0).toUpperCase() + r.care_level.slice(1)} Care` : 'General Assistance',
        initials: r.full_name?.slice(0, 2)?.toUpperCase() || 'FM',
      }))
    : DEFAULT_FALLBACK_RECIPIENTS;

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {displayRecipients.map((rec) => (
          <div key={rec.id} className="profile-recipient-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {rec.avatar ? (
                <img
                  src={rec.avatar}
                  alt={rec.full_name}
                  className="profile-recipient-avatar-thumb"
                />
              ) : (
                <div className="profile-recipient-avatar-initials">
                  {rec.initials}
                </div>
              )}

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
