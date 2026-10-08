import React from 'react';

export function RecipientEmergencyContact({ values, onChange, user }) {
  const userName = user?.full_name || 'Anand Murthy';
  const userPhone = user?.phone_e164 || '+91 98765 43210';
  const relationText = values.relationship ? ` (${values.relationship === 'Mother' || values.relationship === 'Father' ? 'Son / Daughter' : 'Caregiver'})` : ' (Primary Caregiver)';

  return (
    <section className="rf-section-card">
      <div className="rf-section-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="rf-section-badge tertiary">05</span>
          <div className="rf-section-title-wrap">
            <h2 className="rf-section-title">Emergency Escalation Contact</h2>
            <p className="rf-section-subtitle">Immediate protocol for companion notifications &amp; doctor decisions</p>
          </div>
        </div>
        <span className="rf-section-tag safety">Safety Protocol</span>
      </div>

      {/* Primary Contact Checkbox */}
      <div className="rf-emergency-primary">
        <input
          id="primaryContactCheck"
          name="primaryContactCheck"
          type="checkbox"
          checked={values.isPrimaryContact}
          onChange={(e) => onChange('isPrimaryContact', e.target.checked)}
          style={{ marginTop: '0.2rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--rf-primary-container)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--rf-text)' }}>
            I am the primary emergency contact
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rf-text-muted)', marginTop: '0.15rem' }}>
            {userName}{relationText} • {userPhone}
          </span>
          <span className="rf-helper" style={{ marginTop: '0.25rem' }}>
            You will receive real-time SMS status pings at each hospital transit milestone.
          </span>
        </div>
      </div>

      {/* Secondary Contact Collapsible */}
      <details className="rf-accordion">
        <summary className="rf-accordion-summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--rf-text-secondary)' }}>
              person_add
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rf-text)' }}>
              Add Secondary / Alternate Emergency Contact
            </span>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--rf-text-secondary)' }}>
            expand_more
          </span>
        </summary>

        <div className="rf-accordion-body">
          <div className="rf-field">
            <label className="rf-label" htmlFor="secName">Secondary Contact Name</label>
            <input
              id="secName"
              name="secName"
              type="text"
              className="rf-input"
              style={{ height: '2.75rem' }}
              placeholder="e.g. Dr. Raghav Murthy"
              value={values.secName}
              onChange={(e) => onChange('secName', e.target.value)}
            />
          </div>

          <div className="rf-field">
            <label className="rf-label" htmlFor="secRel">Relationship to Recipient</label>
            <input
              id="secRel"
              name="secRel"
              type="text"
              className="rf-input"
              style={{ height: '2.75rem' }}
              placeholder="e.g. Brother / Family Physician"
              value={values.secRel}
              onChange={(e) => onChange('secRel', e.target.value)}
            />
          </div>

          <div className="rf-field rf-accordion-full">
            <label className="rf-label" htmlFor="secPhone">Secondary Contact Mobile Phone</label>
            <div className="rf-phone-group">
              <span className="rf-phone-prefix" style={{ height: '2.75rem' }}>+91</span>
              <input
                id="secPhone"
                name="secPhone"
                type="tel"
                className="rf-phone-input"
                style={{ height: '2.75rem' }}
                placeholder="94480 67890"
                value={values.secPhone}
                onChange={(e) => onChange('secPhone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
