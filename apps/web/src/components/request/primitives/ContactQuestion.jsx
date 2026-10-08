import React from 'react';

export function ContactQuestion({
  updatePhone,
  onUpdatePhoneChange,
  currentUserPhone,
  cmsConfig = {},
  error,
}) {
  const eyebrow = cmsConfig.eyebrow || 'Step 7 • Journey Updates';
  const title = cmsConfig.title || 'Who should receive live journey updates?';
  const desc = cmsConfig.desc ||
    'We send timestamped milestone notifications (Arrival, OPD Doctor Intake, Pharmacy Dossier) via SMS & WhatsApp to keep the entire family informed.';

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>notifications_active</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      <div className="rq-form-group">
        <label className="rq-label" htmlFor="rq-update-phone">Caregiver Mobile Number (WhatsApp / SMS) *</label>
        <div style={{ position: 'relative' }}>
          <input
            id="rq-update-phone"
            type="tel"
            className="rq-input"
            style={{ paddingLeft: '40px' }}
            placeholder="+91 98765 43210"
            value={updatePhone || currentUserPhone || ''}
            onChange={(e) => onUpdatePhoneChange(e.target.value)}
          />
          <span
            className="material-symbols-outlined"
            style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--rq-text-muted)', fontSize: '20px' }}
          >
            phone_iphone
          </span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--rq-text-muted)', marginTop: '6px' }}>
          Your companion will share doctor notes and prescription copies directly to this number upon visit completion.
        </div>
      </div>

      {error && (
        <div className="rq-error-msg" role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
