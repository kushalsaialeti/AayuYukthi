import React from 'react';

export function AddressQuestion({
  pickupRequired,
  onPickupRequiredChange,
  pickupAddress,
  onPickupAddressChange,
  dropoffAddress,
  onDropoffAddressChange,
  updatePhone,
  onUpdatePhoneChange,
  currentUserPhone,
  consentAccepted,
  onConsentAcceptedChange,
  cmsConfig = {},
  error,
  consentError,
  phoneError,
}) {
  const eyebrow = cmsConfig.eyebrow || 'Step 6 of 7 • Logistics & User Consent';
  const title = cmsConfig.title || 'Transit Logistics & Care Consent';
  const desc = cmsConfig.desc ||
    'Specify pickup preferences, contact for journey updates, and provide mandatory care consent.';

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_taxi</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      <div className="rq-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <button
          type="button"
          className={`rq-option-card ${!pickupRequired ? 'selected' : ''}`}
          onClick={() => onPickupRequiredChange(false)}
        >
          <div className="rq-option-radio" aria-hidden="true" />
          <div className="rq-option-icon" aria-hidden="true">
            <span className="material-symbols-outlined">meeting_room</span>
          </div>
          <div className="rq-option-content">
            <div className="rq-option-title">Meet at Hospital</div>
            <div className="rq-option-desc">Direct rendezvous at partner hospital main reception desk.</div>
          </div>
        </button>

        <button
          type="button"
          className={`rq-option-card ${pickupRequired ? 'selected' : ''}`}
          onClick={() => onPickupRequiredChange(true)}
        >
          <div className="rq-option-radio" aria-hidden="true" />
          <div className="rq-option-icon" aria-hidden="true">
            <span className="material-symbols-outlined">directions_car</span>
          </div>
          <div className="rq-option-content">
            <div className="rq-option-title">Doorstep Pickup Needed</div>
            <div className="rq-option-desc">Care companion or sanitized cab picks up patient from home.</div>
          </div>
        </button>
      </div>

      {pickupRequired && (
        <div style={{ background: 'var(--rq-surface-alt)', padding: '20px', borderRadius: '12px', border: '1px solid var(--rq-border)', marginTop: '16px' }}>
          <div className="rq-form-group">
            <label className="rq-label" htmlFor="rq-pickup-addr">Residence Pickup Address *</label>
            <textarea
              id="rq-pickup-addr"
              className="rq-textarea"
              placeholder="Flat/House No., Street, Landmark, Area, City"
              value={pickupAddress || ''}
              onChange={(e) => onPickupAddressChange(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rq-form-group" style={{ marginBottom: 0 }}>
            <label className="rq-label" htmlFor="rq-drop-addr">Return Drop Address (Leave empty if same as pickup)</label>
            <input
              id="rq-drop-addr"
              type="text"
              className="rq-input"
              placeholder="Same as pickup address"
              value={dropoffAddress || ''}
              onChange={(e) => onDropoffAddressChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rq-error-msg" role="alert" style={{ marginTop: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Updates Phone */}
      <div style={{ background: 'var(--rq-surface-alt)', padding: '20px', borderRadius: '12px', border: '1px solid var(--rq-border)', marginTop: '20px' }}>
        <div className="rq-form-group" style={{ marginBottom: 0 }}>
          <label className="rq-label" htmlFor="rq-update-phone">
            Who should receive WhatsApp & SMS updates?
          </label>
          <p style={{ fontSize: '13px', color: 'var(--rq-text-muted)', marginBottom: '8px' }}>
            Live companion milestones, doctor consultation notes, and arrival alerts will be dispatched here.
          </p>
          <input
            id="rq-update-phone"
            type="tel"
            className="rq-input"
            placeholder={currentUserPhone || '+91 98765 43210'}
            value={updatePhone || ''}
            onChange={(e) => onUpdatePhoneChange(e.target.value)}
          />
          {phoneError && (
            <div className="rq-error-msg" role="alert" style={{ marginTop: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              <span>{phoneError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Step 6 Consent Checkbox */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: consentAccepted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 58, 138, 0.04)',
          border: consentError ? '2px solid #ef4444' : '1px solid var(--rq-border)',
          transition: 'all 0.2s ease',
        }}
      >
        <label
          htmlFor="rq-mandatory-consent"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            id="rq-mandatory-consent"
            type="checkbox"
            checked={Boolean(consentAccepted)}
            onChange={(e) => onConsentAcceptedChange(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              cursor: 'pointer',
              accentColor: 'var(--rq-primary, #059669)',
            }}
          />
          <span style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--rq-text)' }}>
            <strong>Mandatory Consent:</strong> I agree to the <strong>Terms &amp; Conditions</strong> and acknowledge the <strong>Privacy Policy</strong> for professional hospital accompaniment care. I authorize AayuYukthi to assign a trained care companion for this visit.
          </span>
        </label>
        {consentError && (
          <div className="rq-error-msg" role="alert" style={{ marginTop: '8px', marginLeft: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
            <span>{consentError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
