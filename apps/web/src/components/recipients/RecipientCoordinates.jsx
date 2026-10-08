import React from 'react';

export function RecipientCoordinates({ values, onChange, config }) {
  const metros = config?.metros || [];
  const hospitals = config?.hospitals || [];

  return (
    <section className="rf-section-card">
      <div className="rf-section-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="rf-section-badge">02</span>
          <div className="rf-section-title-wrap">
            <h2 className="rf-section-title">Residential &amp; Hospital Coordinates</h2>
            <p className="rf-section-subtitle">Pickup address and default medical network routing</p>
          </div>
        </div>
        <span className="rf-section-tag">Transit Logistics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
        {/* Home Address */}
        <div className="rf-field" style={{ gridColumn: 'span 12' }}>
          <label className="rf-label" htmlFor="homeAddress">
            <span>Home Address / Primary Pickup Location <span className="rf-req">*</span></span>
          </label>
          <textarea
            id="homeAddress"
            name="homeAddress"
            rows={2}
            required
            className="rf-textarea"
            placeholder="Flat 402, Pine Wood Heights, 14th Main, Indiranagar"
            value={values.homeAddress}
            onChange={(e) => onChange('homeAddress', e.target.value)}
          />
        </div>

        {/* City / Metro */}
        <div className="rf-field rf-col-8">
          <label className="rf-label" htmlFor="cityMetro">
            <span>City / Operational Metro <span className="rf-req">*</span></span>
          </label>
          <div className="rf-input-wrapper">
            <select
              id="cityMetro"
              name="cityMetro"
              required
              className="rf-select"
              value={values.cityMetro}
              onChange={(e) => onChange('cityMetro', e.target.value)}
            >
              <option value="" disabled>Select Operational Metro</option>
              {metros.map((m) => {
                const val = typeof m === 'string' ? m : m.value;
                const lbl = typeof m === 'string' ? m : m.label;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
            </select>
            <span className="material-symbols-outlined rf-input-icon">apartment</span>
          </div>
        </div>

        {/* Pincode */}
        <div className="rf-field rf-col-4">
          <label className="rf-label" htmlFor="pincode">
            <span>Pincode <span className="rf-req">*</span></span>
          </label>
          <div className="rf-input-wrapper">
            <input
              id="pincode"
              name="pincode"
              type="text"
              maxLength={6}
              required
              className="rf-input"
              value={values.pincode}
              onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
        </div>

        {/* Primary Preferred Hospital */}
        <div className="rf-field rf-col-8">
          <label className="rf-label" htmlFor="hospital">
            Primary Preferred Hospital
          </label>
          <div className="rf-input-wrapper">
            <select
              id="hospital"
              name="hospital"
              className="rf-select"
              value={values.hospital}
              onChange={(e) => onChange('hospital', e.target.value)}
            >
              <option value="">Select hospital (Optional)</option>
              {hospitals.map((h) => {
                const val = typeof h === 'string' ? h : h.name || h.value;
                return (
                  <option key={val} value={val}>
                    {val}
                  </option>
                );
              })}
            </select>
            <span className="material-symbols-outlined rf-input-icon">local_hospital</span>
          </div>
        </div>

        {/* Hospital UHID / Patient ID */}
        <div className="rf-field rf-col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="rf-label" htmlFor="uhid">
              Hospital UHID
            </label>
            <span style={{ fontSize: '11px', color: 'var(--rf-text-secondary)', backgroundColor: 'var(--rf-surface-container)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              Optional
            </span>
          </div>
          <div className="rf-input-wrapper">
            <input
              id="uhid"
              name="uhid"
              type="text"
              className="rf-input"
              placeholder="e.g. MH-982103"
              value={values.uhid}
              onChange={(e) => onChange('uhid', e.target.value)}
            />
          </div>
        </div>

        <div style={{ gridColumn: 'span 12' }}>
          <span className="rf-helper">
            UHID helps companions locate OPD registration counters and diagnostic desk files without delays.
          </span>
        </div>
      </div>
    </section>
  );
}
