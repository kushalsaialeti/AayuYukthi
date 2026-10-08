import React from 'react';

export function AddressQuestion({
  pickupRequired,
  onPickupRequiredChange,
  pickupAddress,
  onPickupAddressChange,
  dropoffAddress,
  onDropoffAddressChange,
  cmsConfig = {},
  error,
}) {
  const eyebrow = cmsConfig.eyebrow || 'Step 6 • Transit & Pickup';
  const title = cmsConfig.title || 'Do you require home transit or doorstep pickup?';
  const desc = cmsConfig.desc ||
    'We arrange sanitized transit with wheelchair boarding assistance from your residence to the hospital.';

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
            <div className="rq-option-desc">Direct rendezvous at partner hospital main reception.</div>
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
        <div className="rq-error-msg" role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
