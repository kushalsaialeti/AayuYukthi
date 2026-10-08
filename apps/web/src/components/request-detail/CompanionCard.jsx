import React from 'react';

export function CompanionCard({
  name,
  role = null,
  companionId = null,
  escortsCount = null,
  phone = null,
  photoUrl = null,
  isAssigned = false,
}) {
  const companionName = name || (isAssigned ? 'Care Companion' : null);
  const firstName = companionName ? companionName.split(' ')[0] : 'Companion';
  const badgeId = companionId || null;

  if (!companionName) {
    return (
      <div className="rd-card" style={{ gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--cust-secondary-container)',
            color: 'var(--cust-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', animation: 'spin 3s linear infinite' }}>
              sync
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
              Matching Dedicated Companion
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
              Field Dispatch in Progress
            </span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
          Our hospital operations desk is assigning a verified BLS-trained companion matched to the patient's mobility directives.
        </p>

        {phone && (
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
            className="rd-btn-call-desk"
            style={{ height: '2.5rem', fontSize: '0.8125rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>support_agent</span>
            <span>Contact Care Dispatch Desk</span>
          </a>
        )}
      </div>
    );
  }

  const getInitials = (n) => {
    if (!n) return 'C';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rd-card" style={{ gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={companionName}
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '1rem',
                objectFit: 'cover',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                border: '2px solid rgba(0, 67, 73, 0.2)',
              }}
            />
          ) : (
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: 'var(--cust-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            }}>
              {getInitials(companionName)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
                {companionName}
              </span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: 'var(--cust-primary)' }}
                title="Accredited Caregiver"
              >
                verified
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
              {role || 'Care Companion'}
            </span>
            {badgeId && (
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--cust-on-surface-variant)', marginTop: '0.1rem' }}>
                ID: {badgeId}
              </span>
            )}
          </div>
        </div>

        {escortsCount && (
          <span style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--cust-secondary-fixed)',
            color: 'var(--cust-on-secondary-fixed)',
            fontSize: '0.75rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            {escortsCount}
          </span>
        )}
      </div>

      {/* Radio Contact Verified Pill */}
      <div style={{
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        backgroundColor: 'rgba(13, 92, 99, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--cust-primary)' }}>
          cell_tower
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cust-primary)' }}>
            Verified Escort Companion
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-on-surface-variant)' }}>
            Active on ground with patient
          </span>
        </div>
      </div>

      {/* Action Button */}
      {phone && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
            className="rd-btn-call-desk"
            style={{ height: '2.75rem' }}
            title={`Call ${companionName}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>phone</span>
            <span>Call {firstName} Directly</span>
          </a>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)', textAlign: 'center' }}>
            Direct coordinate link to hospital desk
          </span>
        </div>
      )}
    </div>
  );
}
