import React from 'react';
import { Link } from 'react-router-dom';

function getStatusBadge(status) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', bg: 'var(--cust-secondary-container)', color: 'var(--cust-on-secondary-container)' };
    case 'IN_TRANSIT':
      return { label: 'In Transit', bg: 'var(--cust-primary-fixed)', color: 'var(--cust-on-primary-fixed-variant)' };
    case 'CONFIRMED':
      return { label: 'Dispatch Confirmed', bg: 'var(--cust-primary-container)', color: 'var(--cust-on-primary)' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', bg: 'var(--cust-surface-container-high)', color: 'var(--cust-on-surface)' };
    case 'ACTION_REQUIRED':
      return { label: 'Action Needed', bg: 'var(--cust-error-container)', color: 'var(--cust-on-error-container)' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'var(--cust-surface-container-high)', color: 'var(--cust-secondary)' };
    default:
      return { label: status?.replace('_', ' ') || 'Received', bg: 'var(--cust-surface-container-high)', color: 'var(--cust-on-surface)' };
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            Recent &amp; Scheduled Requests
          </h2>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--cust-surface-container-high)',
            color: 'var(--cust-on-surface)'
          }}>
            {totalCount || requests.length} Total
          </span>
        </div>

        <Link
          to="/app/requests"
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cust-primary)', textDecoration: 'none' }}
        >
          View All History &rarr;
        </Link>
      </div>

      {requests.length === 0 ? (
        <div style={{
          padding: '2.5rem 1.5rem',
          borderRadius: '0.875rem',
          backgroundColor: 'var(--cust-surface-container-lowest)',
          border: '1px dashed var(--cust-outline-variant)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--cust-surface-container-low)',
            color: 'var(--cust-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>assignment</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            No care requests yet
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-secondary)', maxWidth: '24rem' }}>
            Book an accompaniment for upcoming hospital visits, OPD consultations, or medical tests in Bhimavaram.
          </p>
          <Link to="/request-care" className="cust-btn-primary" style={{ marginTop: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            <span>Schedule First Visit</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {requests.slice(0, 5).map((req) => {
            const badge = getStatusBadge(req.status);
            const hospitalName = typeof req.hospital === 'string'
              ? req.hospital
              : (req.hospital?.name || req.hospital?.name_en || 'Partner Hospital');
            const dateText = formatDate(req.appointment_date || req.schedule_at || req.created_at);
            const serviceTitle = typeof req.service === 'string'
              ? req.service
              : (req.service?.title || req.service?.title_en || 'Hospital Accompaniment');
            const recipientName = typeof req.recipient === 'string'
              ? req.recipient
              : (req.recipient?.name || 'Care Recipient');
            const recipientRel = req.recipient?.relationship ? ` (${req.recipient.relationship})` : '';
            const companionName = typeof req.coordinator === 'string'
              ? req.coordinator
              : (req.coordinator?.name || 'Care Companion Assigned');

            return (
              <div key={req.id} className="dash-request-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div className="dash-item-icon-box">
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                        local_hospital
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                        {hospitalName}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
                        {serviceTitle} • {dateText}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Recipient & Companion tags */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--cust-surface-container-low)',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--cust-secondary)' }}>Recipient:</span>
                    <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      {recipientName}{recipientRel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--cust-secondary)' }}>Companion:</span>
                    <span style={{ fontWeight: 500, color: 'var(--cust-on-surface)' }}>
                      {companionName}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem' }}>
                  <Link
                    to={`/app/requests/${req.id}`}
                    className="cust-btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/app/requests/${req.id}`}
                    className="cust-btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.35rem 0.875rem' }}
                  >
                    Track Visit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
