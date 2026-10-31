import React from 'react';
import { Link } from 'react-router-dom';

export function AddressQuestion({
  pickupRequired = true,
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
  const eyebrow = cmsConfig.eyebrow || 'Step 5 of 6 • Doorstep Pickup & Logistics';
  const title = cmsConfig.title || 'Doorstep Pickup & Mandated Care Consent';
  const desc = cmsConfig.desc ||
    'We coordinate door-to-door transit to ensure timely hospital arrival with dedicated companion assistance.';

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>directions_car</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      {/* Single Dedicated Option: Doorstep Pickup */}
      <div
        className="rq-option-card selected"
        style={{
          border: '2px solid var(--rq-primary, #004349)',
          background: 'linear-gradient(135deg, rgba(19, 226, 191, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'default',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--rq-primary, #004349)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            directions_car
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '16px', color: 'var(--rq-text, #0f172a)' }}>
              Doorstep Pickup (Standard Included Care)
            </strong>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#10b981',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
              }}
            >
              Active
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#004349', fontWeight: 600 }}>
            We will pick you up at your doorstep 20 minutes before the appointment time.
          </p>
        </div>
      </div>

      {/* Residence Pickup Address Form */}
      <div
        style={{
          background: 'var(--rq-surface-alt, #f8fafc)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--rq-border, #e2e8f0)',
          marginTop: '16px',
        }}
      >
        <div className="rq-form-group">
          <label className="rq-label" htmlFor="rq-pickup-addr">
            Residence Pickup Address *
          </label>
          <textarea
            id="rq-pickup-addr"
            className="rq-textarea"
            placeholder="House/Flat No., Apartment/Street Name, Landmark, Area, City"
            value={pickupAddress || ''}
            onChange={(e) => onPickupAddressChange(e.target.value)}
            rows={3}
            required
            autoFocus
          />
          <span className="rq-hint" style={{ fontSize: '12px', color: 'var(--rq-text-muted)', marginTop: '4px', display: 'block' }}>
            Our verified driver and companion arrive at this address 20 minutes prior to your appointment.
          </span>
          {error && (
            <div className="rq-error-msg" role="alert" style={{ marginTop: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="rq-form-group" style={{ marginBottom: 0, marginTop: '16px' }}>
          <label className="rq-label" htmlFor="rq-drop-addr">
            Return Drop Address (Leave empty if same as pickup)
          </label>
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

      {/* Mandatory WhatsApp Number Field */}
      <div
        style={{
          background: 'var(--rq-surface-alt, #f8fafc)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--rq-border, #e2e8f0)',
          marginTop: '20px',
        }}
      >
        <div className="rq-form-group" style={{ marginBottom: 0 }}>
          <label className="rq-label" htmlFor="rq-whatsapp-number" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: '#25D366', fontSize: '20px' }}>
              chat
            </span>
            <span>WhatsApp Mobile Number (Mandatory) *</span>
          </label>
          <p style={{ fontSize: '13px', color: 'var(--rq-text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
            We send live driver location, companion arrival notice 20 minutes prior, and prescription photos to this WhatsApp number.
          </p>
          <input
            id="rq-whatsapp-number"
            type="tel"
            className="rq-input"
            placeholder={currentUserPhone || '+91 98765 43210'}
            value={updatePhone || ''}
            onChange={(e) => onUpdatePhoneChange(e.target.value)}
            required
          />
          {phoneError && (
            <div className="rq-error-msg" role="alert" style={{ marginTop: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              <span>{phoneError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Consent Column Checkbox for Terms & Conditions and Privacy Policy */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: consentAccepted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 67, 73, 0.04)',
          border: consentError ? '2px solid #ef4444' : '1px solid var(--rq-border, #e2e8f0)',
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConsentAcceptedChange(!consentAccepted);
              }
            }}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              cursor: 'pointer',
              accentColor: 'var(--rq-primary, #004349)',
            }}
          />
          <div style={{ fontSize: '13.5px', lineHeight: '1.55', color: 'var(--rq-text, #0f172a)' }}>
            <strong>Mandatory Consent &amp; Directives:</strong> I agree to the{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--rq-primary, #004349)', fontWeight: 700, textDecoration: 'underline' }}
              onClick={(e) => e.stopPropagation()}
            >
              Terms &amp; Conditions
            </Link>{' '}
            and acknowledge the{' '}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--rq-primary, #004349)', fontWeight: 700, textDecoration: 'underline' }}
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            . I consent to receive doorstep pickup and hospital accompaniment coordination from AayuYukthi.
          </div>
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
