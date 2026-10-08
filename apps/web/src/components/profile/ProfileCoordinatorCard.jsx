import React from 'react';
import { Link } from 'react-router-dom';

export function ProfileCoordinatorCard({ cmsBlocks = {} }) {
  const name = cmsBlocks['profile.coordinator.name']?.body_en || 'Central Care Coordinator';
  const role = cmsBlocks['profile.coordinator.role']?.body_en || 'Bhimavaram Care Station';
  const rating = cmsBlocks['profile.coordinator.rating']?.body_en || null;
  const bio = cmsBlocks['profile.coordinator.bio']?.body_en ||
    'Our dedicated operations desk coordinates pre-transit logistics, hospital rendezvous check-ins, and OPD queue management.';
  const phone = cmsBlocks['profile.coordinator.phone']?.body_en || '1800-AAYU-CARE';

  return (
    <div className="profile-section-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--cust-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Designated Care Coordinator
        </span>
        <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: 'var(--cust-surface-tint)' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--cust-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.1rem',
        }}>
          {name.slice(0, 2).toUpperCase()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              {name}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-surface-tint)' }}>
              verified
            </span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
            {role}
          </span>
          {rating && (
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-surface-tint)', fontWeight: 600 }}>
              {rating}
            </span>
          )}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
        {bio}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingTop: '0.25rem' }}>
        <Link
          to="/app/support/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0.5rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--cust-surface-container-high, #e6e9e8)',
            color: 'var(--cust-on-surface)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cust-surface-container)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--cust-surface-container-high)')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
          <span>Direct Chat</span>
        </Link>

        <a
          href={`tel:${phone.replace(/[^0-9]/g, '') || '1800229822'}`}
          className="cust-btn-primary"
          style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
          <span>Call Concierge</span>
        </a>
      </div>
    </div>
  );
}
