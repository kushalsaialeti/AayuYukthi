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

function getInitials(name) {
  if (!name) return 'FM';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function DashboardRecipientsWidget({ recipients = [] }) {
  return (
    <div className="cust-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
          Care Recipients
        </h3>
        <Link
          to="/app/recipients/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--cust-primary)',
            textDecoration: 'none'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person_add</span>
          <span>+ Add</span>
        </Link>
      </div>

      {recipients.length === 0 ? (
        <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center', color: 'var(--cust-secondary)', fontSize: '0.8125rem' }}>
          <span>No care recipients added yet. </span>
          <Link to="/app/recipients/new" style={{ color: 'var(--cust-primary)', fontWeight: 600 }}>
            Add your first family member
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recipients.slice(0, 4).map((rec) => {
            const age = calculateAge(rec.date_of_birth);
            const relation = rec.relationship || 'Family';
            const displayName = rec.full_name || rec.name || 'Recipient';
            const initials = getInitials(displayName);

            return (
              <Link
                key={rec.id}
                to="/app/recipients"
                className="dash-recipient-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {rec.image_url ? (
                    <img
                      src={rec.image_url}
                      alt={displayName}
                      style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--cust-surface-container-high, #e6e9e8)',
                      color: 'var(--cust-primary, #004349)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}>
                      {initials}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      {displayName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                      {relation}{age ? ` (${age}y)` : ''}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--cust-surface-container-high)',
                  color: 'var(--cust-on-surface-variant)'
                }}>
                  Active
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
