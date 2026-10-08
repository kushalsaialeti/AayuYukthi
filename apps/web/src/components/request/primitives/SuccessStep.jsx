import React from 'react';
import { Link } from 'react-router-dom';

export function SuccessStep({
  requestResult,
  recipientName,
  serviceTitle,
  serviceTitles = [],
  hospitalName,
  cmsConfig = {},
  onReset,
}) {
  const reqId = requestResult?.id || requestResult?.request?.id || 'AY-REQ';
  const status = requestResult?.status || requestResult?.request?.status || 'REQUEST_RECEIVED';

  const title = cmsConfig.title || 'Care Request Submitted!';
  const desc = cmsConfig.desc ||
    'Our operations coordinator is reviewing hospital desk availability and assigning a dedicated companion escort.';

  const displayServices = Array.isArray(serviceTitles) && serviceTitles.length > 0
    ? serviceTitles.join(', ')
    : (serviceTitle || 'Not selected');

  const statusLabel = status === 'CONFIRMED'
    ? 'Confirmed'
    : status === 'SCHEDULED'
    ? 'Scheduled'
    : 'Request Received & Under Review';

  return (
    <div className="rq-question-container rq-success-card">
      <div className="rq-success-icon-wrap" aria-hidden="true">
        <span className="material-symbols-outlined" style={{ fontSize: 44 }}>
          check_circle
        </span>
      </div>

      <h1 className="rq-title" style={{ fontSize: '28px', marginBottom: '8px' }}>
        {title}
      </h1>
      <p className="rq-description" style={{ maxWidth: '480px', margin: '0 auto' }}>
        {desc}
      </p>

      <div className="rq-success-id-box">
        <div className="rq-success-id-label">Official Care Request ID</div>
        <div className="rq-success-id-val">{reqId}</div>
        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--rq-primary)' }}>
          Status: <strong>{statusLabel}</strong>
        </div>
      </div>

      <div style={{ background: 'var(--rq-surface-alt)', borderRadius: '12px', border: '1px solid var(--rq-border)', padding: '16px 20px', maxWidth: '440px', margin: '0 auto 28px', textAlign: 'left' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--rq-text-muted)', marginBottom: '8px' }}>
          Summary
        </div>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
          Patient: <strong>{recipientName}</strong>
        </div>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
          Service: <strong>{serviceTitle}</strong>
        </div>
        <div style={{ fontSize: '14px' }}>
          Hospital: <strong>{hospitalName}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to={`/app/requests/${reqId}`}
          className="rq-btn-primary"
          style={{ textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined">track_changes</span>
          <span>Track Request & Live Timeline</span>
        </Link>
        <Link
          to="/app/requests"
          className="rq-btn-secondary"
          style={{ textDecoration: 'none' }}
        >
          View All Requests
        </Link>
      </div>
    </div>
  );
}
