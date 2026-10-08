import React from 'react';

export function CustomerStatsCards({ requests = [] }) {
  const total = requests.length;

  const activeStatuses = new Set([
    'REQUEST_RECEIVED',
    'UNDER_REVIEW',
    'COORDINATION_IN_PROGRESS',
    'CONFIRMED',
    'SCHEDULED',
    'SERVICE_IN_PROGRESS',
  ]);

  const activeCount = requests.filter((r) => activeStatuses.has(r.status)).length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
  const dossiersCount = requests.filter((r) => r.status === 'COMPLETED' && (r.latest_summary || r.completed_at)).length;

  const stats = [
    {
      label: 'Total Requests',
      value: total.toString(),
      icon: 'calendar_month',
      iconBg: 'rgba(0, 67, 73, 0.08)',
      iconColor: 'var(--cust-primary)',
      valColor: 'var(--cust-on-surface)',
    },
    {
      label: 'Active & Upcoming',
      value: `${activeCount} ${activeCount === 1 ? 'Visit' : 'Visits'}`,
      icon: 'directions_walk',
      iconBg: 'var(--cust-secondary-container)',
      iconColor: 'var(--cust-on-secondary-container)',
      valColor: 'var(--cust-primary)',
    },
    {
      label: 'Completed Safely',
      value: completedCount.toString(),
      icon: 'verified',
      iconBg: 'var(--cust-surface-container-high)',
      iconColor: 'var(--cust-on-surface-variant)',
      valColor: 'var(--cust-on-surface)',
    },
    {
      label: 'Dossiers Ready',
      value: `${dossiersCount} ${dossiersCount === 1 ? 'PDF' : 'PDFs'}`,
      icon: 'assignment_turned_in',
      iconBg: 'var(--cust-tertiary-fixed)',
      iconColor: 'var(--cust-on-tertiary-fixed-variant)',
      valColor: 'var(--cust-tertiary-container)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1rem',
      width: '100%'
    }}>
      {stats.map((s, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--cust-surface-container-lowest)',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}
        >
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: s.iconBg,
            color: s.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              {s.icon}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--cust-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {s.label}
            </span>
            <span style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: s.valColor,
              letterSpacing: '-0.01em',
              lineHeight: 1.25
            }}>
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
