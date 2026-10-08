import React from 'react';

export function HospitalLiaisonDesk({
  hospitalName = 'Partner Hospital',
  stationManager = null,
  location = null,
  extension = null,
  phone = null,
}) {
  const dialUrl = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}${extension ? `,${extension.replace(/[^0-9]/g, '')}` : ''}` : null;

  return (
    <div className="rd-card" style={{ gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.625rem',
          backgroundColor: 'var(--cust-surface-container)',
          color: 'var(--cust-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>desk</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
            {hospitalName} Care Desk
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
            AayuYukthi Dedicated Station
          </span>
        </div>
      </div>

      <div style={{
        padding: '0.875rem 1rem',
        borderRadius: '0.75rem',
        backgroundColor: 'var(--cust-surface-container-low)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        fontSize: '0.8125rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Station Manager
          </span>
          <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            {stationManager || 'Assigned on-site'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Physical Location
          </span>
          <span style={{ color: 'var(--cust-on-surface)' }}>
            {location || `${hospitalName} Desk`}
          </span>
        </div>

        {extension && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Hospital Intercom
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cust-primary)' }}>
              {extension}
            </span>
          </div>
        )}
      </div>

      {dialUrl && (
        <a
          href={dialUrl}
          className="rd-btn-call-desk"
          style={{
            backgroundColor: 'var(--cust-surface-container)',
            color: 'var(--cust-primary)',
            height: '2.75rem',
            border: '1px solid var(--cust-outline-variant)',
          }}
          title={extension ? `Dial hospital intercom ${extension}` : 'Call hospital liaison'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
          <span>Dial Liaison Desk</span>
        </a>
      )}
    </div>
  );
}
