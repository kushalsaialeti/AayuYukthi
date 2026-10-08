import React from 'react';

export function RecipientMobility({ values, onChange, config }) {
  const options = config?.mobilityOptions || [];
  const selectedMobility = values.mobility || [];

  const handleToggleMobility = (id) => {
    let next;
    if (selectedMobility.includes(id)) {
      next = selectedMobility.filter((x) => x !== id);
    } else {
      next = [...selectedMobility, id];
    }
    onChange('mobility', next);
  };

  const isWheelchairActive = selectedMobility.includes('wheelchair');

  return (
    <section className="rf-section-card">
      <div className="rf-section-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="rf-section-badge">03</span>
          <div className="rf-section-title-wrap">
            <h2 className="rf-section-title">Mobility &amp; On-Ground Escort</h2>
            <p className="rf-section-subtitle">Physical support required across parking, elevators, and corridors</p>
          </div>
        </div>
        <span className="rf-section-tag">Crucial Setup</span>
      </div>

      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rf-text)', margin: '0 0 0.75rem' }}>
        Escort Requirements <span style={{ fontWeight: 400, color: 'var(--rf-text-secondary)' }}>(Select all that apply)</span>
      </p>

      <div className="rf-mobility-grid">
        {options.map((opt) => {
          const isChecked = selectedMobility.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`rf-mobility-card ${isChecked ? 'active' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggleMobility(opt.id)}
                style={{ marginTop: '0.2rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--rf-primary-container)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="rf-mobility-title">
                  {opt.icon && (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '20px', color: isChecked ? 'var(--rf-surface-tint)' : 'var(--rf-text-secondary)' }}
                    >
                      {opt.icon}
                    </span>
                  )}
                  {opt.label}
                </span>
                <span className="rf-mobility-desc">{opt.description}</span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Conditional Wheelchair Provisioning Option Sub-card */}
      {isWheelchairActive && (
        <div className="rf-sub-card" id="wheelchairOptions">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rf-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--rf-surface-tint)' }}>
              check_circle
            </span>
            Wheelchair Provisioning Option
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--rf-surface-container-lowest)', borderRadius: '0.5rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <input
                type="radio"
                name="wheelchairType"
                value="hospital"
                checked={values.wheelchairType === 'hospital'}
                onChange={() => onChange('wheelchairType', 'hospital')}
                style={{ accentColor: 'var(--rf-primary-container)', width: '1rem', height: '1rem' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--rf-text)', fontWeight: 500 }}>
                Request hospital/companion wheelchair
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--rf-surface-container-lowest)', borderRadius: '0.5rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <input
                type="radio"
                name="wheelchairType"
                value="own"
                checked={values.wheelchairType === 'own'}
                onChange={() => onChange('wheelchairType', 'own')}
                style={{ accentColor: 'var(--rf-primary-container)', width: '1rem', height: '1rem' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--rf-text)', fontWeight: 500 }}>
                Bring own wheelchair in transit vehicle
              </span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
