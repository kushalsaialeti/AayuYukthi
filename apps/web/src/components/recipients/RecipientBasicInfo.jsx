import React from 'react';

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female', icon: 'female' },
  { value: 'Male', label: 'Male', icon: 'male' },
  { value: 'Other', label: 'Other' },
  { value: 'PreferNotToSay', label: 'Prefer not to say' },
];

export function RecipientBasicInfo({ values, onChange, config }) {
  const relationships = config?.relationships || [];

  return (
    <section className="rf-section-card">
      <div className="rf-section-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="rf-section-badge">01</span>
          <div className="rf-section-title-wrap">
            <h2 className="rf-section-title">Basic Information</h2>
            <p className="rf-section-subtitle">Individual identity as recognized in hospital records</p>
          </div>
        </div>
        <span className="rf-section-tag">Required Fields *</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Full Legal Name */}
        <div className="rf-field" style={{ gridColumn: '1 / -1' }}>
          <label className="rf-label" htmlFor="fullName">
            <span>Full Legal Name <span className="rf-req">*</span></span>
          </label>
          <div className="rf-input-wrapper">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="rf-input"
              style={{ paddingRight: '2.5rem' }}
              placeholder="e.g. Saraswathi Murthy"
              value={values.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <span className="material-symbols-outlined rf-input-icon">badge</span>
          </div>
          <span className="rf-helper">Matches hospital file & Aadhaar card for appointment checks</span>
        </div>

        {/* Relationship to You */}
        <div className="rf-field">
          <label className="rf-label" htmlFor="relationship">
            <span>Relationship to You <span className="rf-req">*</span></span>
          </label>
          <div className="rf-input-wrapper">
            <select
              id="relationship"
              name="relationship"
              required
              className="rf-select"
              value={values.relationship}
              onChange={(e) => onChange('relationship', e.target.value)}
            >
              <option value="" disabled>Select Relationship</option>
              {relationships.map((rel) => {
                const val = typeof rel === 'string' ? rel : rel.value;
                const lbl = typeof rel === 'string' ? rel : rel.label;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
            </select>
            <span className="material-symbols-outlined rf-input-icon">expand_more</span>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="rf-field">
          <label className="rf-label" htmlFor="dob">
            <span>Date of Birth <span className="rf-req">*</span></span>
          </label>
          <div className="rf-input-wrapper">
            <input
              id="dob"
              name="dob"
              type="date"
              required
              className="rf-input"
              value={values.dob}
              onChange={(e) => onChange('dob', e.target.value)}
            />
          </div>
        </div>

        {/* Gender Identifier */}
        <div className="rf-field" style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
          <label className="rf-label">
            <span>Gender Identifier <span className="rf-req">*</span></span>
          </label>
          <div className="rf-gender-grid" role="radiogroup" aria-label="Gender Identifier">
            {GENDER_OPTIONS.map((opt) => {
              const active = values.gender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`rf-gender-pill ${active ? 'active' : ''}`}
                  onClick={() => onChange('gender', opt.value)}
                >
                  {opt.icon && (
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {opt.icon}
                    </span>
                  )}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipient Direct Mobile Number */}
        <div className="rf-field" style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="rf-label" htmlFor="recipientPhone">
              Recipient's Direct Mobile Number
            </label>
            <span style={{ fontSize: '11px', color: 'var(--rf-text-secondary)', backgroundColor: 'var(--rf-surface-container)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              Optional
            </span>
          </div>
          <div className="rf-phone-group">
            <span className="rf-phone-prefix">+91</span>
            <input
              id="recipientPhone"
              name="recipientPhone"
              type="tel"
              className="rf-phone-input"
              placeholder="98450 12345"
              value={values.recipientPhone}
              onChange={(e) => onChange('recipientPhone', e.target.value)}
            />
          </div>
          <p className="rf-helper" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0.25rem 0 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--rf-surface-tint)' }}>
              info
            </span>
            <span>Only utilized for companion gate handshakes if the recipient carries an independent phone.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
