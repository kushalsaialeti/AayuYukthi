import React from 'react';

export function CustomerAdvisoryBanner({ cmsBlocks = {} }) {
  const title = cmsBlocks['customer.advisory.title']?.body_en || 'Need urgent modifications or companion adjustments?';
  const body = cmsBlocks['customer.advisory.body']?.body_en || 'Changes are accommodated up to 4 hours prior to scheduled appointment with zero penalty.';
  const helpline = cmsBlocks['customer.advisory.helpline']?.body_en || '1800-AAYU-CARE';
  const tel = cmsBlocks['customer.advisory.tel']?.body_en || 'tel:180022982273';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.25rem',
      borderRadius: '1rem',
      backgroundColor: 'rgba(203, 226, 253, 0.4)',
      border: '1px solid rgba(75, 96, 119, 0.12)'
    }}>
      <div style={{
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '0.75rem',
        backgroundColor: 'var(--cust-primary-container)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
          verified_user
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        width: '100%',
        alignItems: 'flex-start'
      }} className="md:flex-row md:items-center">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            {title}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
            {body}
          </span>
        </div>

        <a
          href={tel}
          className="cust-btn-secondary"
          style={{
            whiteSpace: 'nowrap',
            color: 'var(--cust-primary)',
            backgroundColor: '#ffffff',
            fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
          <span>{helpline}</span>
        </a>
      </div>
    </div>
  );
}
