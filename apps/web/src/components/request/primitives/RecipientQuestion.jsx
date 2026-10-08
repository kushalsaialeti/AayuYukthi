import React, { useState } from 'react';

const RELATIONSHIPS = [
  { value: 'self', label: 'Self (Booking for Myself)', roleNote: 'Account will be registered under your name' },
  { value: 'mother', label: 'Mother', roleNote: 'Caregiver account will be created for you' },
  { value: 'father', label: 'Father', roleNote: 'Caregiver account will be created for you' },
  { value: 'spouse', label: 'Spouse', roleNote: 'Caregiver account will be created for you' },
  { value: 'child', label: 'Son / Daughter', roleNote: 'Caregiver account will be created for you' },
  { value: 'host', label: 'Host (Hospital Coordinator / Guest Organizer)', roleNote: 'Direct email OTP verification for host' },
  { value: 'other', label: 'Other Family Member / Friend', roleNote: 'Caregiver account will be created for you' },
];

export function RecipientQuestion({
  recipients = [],
  selectedRecipientId,
  newRecipient,
  onSelectRecipient,
  onUpdateNewRecipient,
  cmsConfig = {},
  error,
}) {
  const [showNewForm, setShowNewForm] = useState(() => {
    return recipients.length === 0 || Boolean(newRecipient?.fullName);
  });

  const handleSelectExisting = (id) => {
    setShowNewForm(false);
    onSelectRecipient(id);
    onUpdateNewRecipient(null);
  };

  const handleFormChange = (field, val) => {
    onSelectRecipient(null);
    onUpdateNewRecipient({
      ...(newRecipient || { fullName: '', relationship: 'mother', phone: '', dateOfBirth: '' }),
      [field]: val,
    });
  };

  const eyebrow = cmsConfig.eyebrow || 'Step 1 • Care Recipient';
  const title = cmsConfig.title || 'Who needs care support at the hospital?';
  const desc = cmsConfig.desc ||
    'We tailor mobility equipment, escort dialect, and care rendezvous around the patient.';

  const currentRel = newRecipient?.relationship || 'mother';
  const selectedRelObj = RELATIONSHIPS.find((r) => r.value === currentRel);

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      {recipients && recipients.length > 0 && !showNewForm && (
        <div className="rq-options-grid" role="radiogroup" aria-label="Existing Care Recipients">
          {recipients.map((r) => {
            const isSelected = selectedRecipientId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`rq-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectExisting(r.id)}
              >
                <div className="rq-option-radio" aria-hidden="true" />
                <div className="rq-option-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">
                    {r.relationship === 'self' ? 'person' : 'elderly'}
                  </span>
                </div>
                <div className="rq-option-content">
                  <div className="rq-option-title">{r.full_name}</div>
                  <div className="rq-option-desc">
                    Relationship: <strong style={{ textTransform: 'capitalize' }}>{r.relationship}</strong>
                    {r.phone_e164 ? ` • ${r.phone_e164}` : ''}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            className="rq-option-card"
            style={{ borderStyle: 'dashed', justifyContent: 'center' }}
            onClick={() => {
              setShowNewForm(true);
              onSelectRecipient(null);
              onUpdateNewRecipient({ fullName: '', relationship: 'mother', phone: '', dateOfBirth: '' });
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--rq-primary)' }}>person_add</span>
            <div className="rq-option-title" style={{ color: 'var(--rq-primary)' }}>+ Add another family member</div>
          </button>
        </div>
      )}

      {(showNewForm || !recipients || recipients.length === 0) && (
        <div style={{ background: 'var(--rq-surface-alt)', padding: '20px', borderRadius: '12px', border: '1px solid var(--rq-border)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--rq-text)' }}>
              {recipients.length > 0 ? 'Enter New Recipient Details' : 'Care Recipient Details'}
            </h3>
            {recipients.length > 0 && (
              <button
                type="button"
                className="rq-btn-secondary"
                style={{ padding: '4px 10px', minHeight: '32px', fontSize: '13px' }}
                onClick={() => setShowNewForm(false)}
              >
                Choose Existing
              </button>
            )}
          </div>

          <div className="rq-form-group">
            <label className="rq-label" htmlFor="rq-rec-rel">Relationship / Role *</label>
            <select
              id="rq-rec-rel"
              className="rq-select"
              value={currentRel}
              onChange={(e) => handleFormChange('relationship', e.target.value)}
            >
              {RELATIONSHIPS.map((rel) => (
                <option key={rel.value} value={rel.value}>{rel.label}</option>
              ))}
            </select>
            {selectedRelObj?.roleNote && (
              <div style={{ fontSize: '12px', color: 'var(--rq-primary)', marginTop: '4px', fontWeight: 500 }}>
                ℹ {selectedRelObj.roleNote}
              </div>
            )}
          </div>

          <div className="rq-form-group">
            <label className="rq-label" htmlFor="rq-rec-name">
              {currentRel === 'self' ? 'Your Full Name *' : 'Patient / Recipient Full Name *'}
            </label>
            <input
              id="rq-rec-name"
              type="text"
              className="rq-input"
              placeholder={currentRel === 'self' ? 'e.g. Ramesh Chandra' : 'e.g. Kamala Devi'}
              value={newRecipient?.fullName || ''}
              onChange={(e) => handleFormChange('fullName', e.target.value)}
              autoFocus
            />
          </div>

          <div className="rq-form-group" style={{ marginBottom: 0 }}>
            <label className="rq-label" htmlFor="rq-rec-dob">Date of Birth / Year (Optional)</label>
            <input
              id="rq-rec-dob"
              type="date"
              className="rq-input"
              value={newRecipient?.dateOfBirth || ''}
              onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
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
