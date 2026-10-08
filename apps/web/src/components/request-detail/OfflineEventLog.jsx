import React from 'react';

export function OfflineEventLog({
  timeline = [],
  protocol = 'SMS-TETHER-v2',
}) {
  const defaultEvents = [
    {
      id: 'e1',
      time: '10:52 AM',
      title: 'Consultation in Active Progress',
      badge: 'Via Coordinator Radio',
      badgeColor: 'rgba(0, 67, 73, 0.1)',
      textColor: 'var(--cust-primary)',
      message: 'Sister Rekha verified companion is seated inside Chamber 204 with patient. Dr. Srinivas is reviewing past 6-month clinical summary.',
    },
    {
      id: 'e2',
      time: '10:46 AM',
      title: 'Entered Doctor Chamber',
      badge: 'SMS Failover',
      badgeColor: 'var(--cust-secondary-fixed)',
      textColor: 'var(--cust-on-secondary-fixed)',
      message: 'Token #42 admitted into consultation room. Companion assisting patient with seating, vitals clipboard, and questions.',
    },
    {
      id: 'e3',
      time: '10:42 AM',
      title: 'Token #42 Called at OPD Counter',
      badge: 'Automated OPD Hook',
      badgeColor: 'var(--cust-secondary-fixed)',
      textColor: 'var(--cust-on-secondary-fixed)',
      message: 'Nurse station signaled escort companion. Patient was provided water and accompanied to the consultation entry.',
    },
  ];

  return (
    <section className="rd-card">
      <div className="rd-card-header">
        <div className="rd-card-title-group">
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.625rem',
            backgroundColor: 'rgba(0, 67, 73, 0.1)',
            color: 'var(--cust-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>sms</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="rd-card-title">Offline Fallback Event Log</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
              Encrypted manual relays confirmed by on-ground hospital station
            </span>
          </div>
        </div>

        <span style={{
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--cust-surface-container-high)',
          color: 'var(--cust-on-surface-variant)',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}>
          Protocol: {protocol}
        </span>
      </div>

      <div className="rd-log-list">
        {defaultEvents.map((ev) => (
          <div key={ev.id} className="rd-log-item">
            <span className="rd-log-time">{ev.time}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {ev.title}
                </span>
                <span
                  className="rd-log-badge"
                  style={{ backgroundColor: ev.badgeColor, color: ev.textColor }}
                >
                  {ev.badge}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
                {ev.message}
              </p>
            </div>
          </div>
        ))}

        {/* Real timeline updates from server if present */}
        {timeline.map((t, i) => (
          <div key={`tl-${i}`} className="rd-log-item">
            <span className="rd-log-time">
              {new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {t.status.replaceAll('_', ' ')}
                </span>
                <span className="rd-log-badge" style={{ backgroundColor: 'var(--cust-surface-container)', color: 'var(--cust-secondary)' }}>
                  System Event
                </span>
              </div>
              {t.message && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
                  {t.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
