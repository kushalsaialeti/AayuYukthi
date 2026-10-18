import React from 'react';
import { Link } from 'react-router-dom';

function getStatusBadge(status) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', bg: '#ecfdf5', color: '#047857' };
    case 'IN_TRANSIT':
      return { label: 'In Transit', bg: '#eff6ff', color: '#1d4ed8' };
    case 'CONFIRMED':
    case 'SCHEDULED':
      return { label: 'Confirmed', bg: 'var(--cust-secondary-container)', color: 'var(--cust-on-secondary-container)' };
    case 'UNDER_REVIEW':
    case 'REQUEST_RECEIVED':
      return { label: 'In Review', bg: '#fef3c7', color: '#b45309' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'var(--cust-surface-container-high)', color: 'var(--cust-secondary)' };
    default:
      return { label: status?.replace(/_/g, ' ') || 'Received', bg: 'var(--cust-surface-container-high)', color: 'var(--cust-on-surface)' };
  }
}

function formatDate(dStr) {
  if (!dStr) return '';
  try {
    const d = new Date(dStr);
    if (Number.isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dStr;
  }
}

export function DashboardRequestsFeed({ requests = [], totalCount = 0 }) {
  return (
    <div className="dash-feed-col">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
          Recent Requests
        </h2>

        <Link
          to="/app/requests"
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cust-primary)', textDecoration: 'none' }}
        >
          View All →
        </Link>
      </div>

      {requests.length === 0 ? (
        <div style={{
          padding: '2rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--cust-surface-container-lowest)',
          border: '1px dashed var(--cust-outline-variant)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div className="requests-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>assignment</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            No requests yet
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-secondary)', maxWidth: '22rem' }}>
            Book a care companion for your next hospital visit.
          </p>
          <Link to="/request-care" className="cust-btn-primary" style={{ marginTop: '0.25rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            <span>Request Care</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {requests.slice(0, 5).map((req) => {
            const badge = getStatusBadge(req.status);
            const hospitalName = typeof req.hospital === 'string'
              ? req.hospital
              : (req.hospital?.name || req.hospital?.name_en || 'Hospital');
            const dateText = formatDate(req.appointment_date || req.schedule_at || req.created_at);
            const serviceTitle = typeof req.service === 'string'
              ? req.service
              : (req.service?.title || req.service?.title_en || 'Care Service');
            const recipientName = typeof req.recipient === 'string'
              ? req.recipient
              : (req.recipient?.name || 'Recipient');

            return (
              <Link
                key={req.id}
                to={`/app/requests/${req.id}`}
                className="dash-request-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div className="dash-item-icon-box">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        local_hospital
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)', display: 'block' }}>
                        {hospitalName}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)', display: 'block', marginTop: '0.125rem' }}>
                        {serviceTitle} · {recipientName} · {dateText}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
