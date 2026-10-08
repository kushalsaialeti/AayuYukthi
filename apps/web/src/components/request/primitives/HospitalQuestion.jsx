import React, { useState, useMemo } from 'react';

export function HospitalQuestion({
  hospitals = [],
  selectedHospitalId,
  onSelectHospital,
  cmsConfig = {},
  error,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const eyebrow = cmsConfig.eyebrow || 'Step 3 • Hospital Selection';
  const title = cmsConfig.title || 'Which hospital will you be visiting?';
  const desc = cmsConfig.desc ||
    'Our care companions have verified security badges and designated rendezvous desks at these partner hospitals.';

  const cities = useMemo(() => {
    const set = new Set();
    hospitals.forEach((h) => {
      if (h.city) set.add(h.city);
    });
    return Array.from(set);
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const matchesSearch = !searchTerm.trim() ||
        h.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = !selectedCity || h.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [hospitals, searchTerm, selectedCity]);

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_hospital</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <input
            type="text"
            className="rq-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by hospital name or locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span
            className="material-symbols-outlined"
            style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--rq-text-muted)', fontSize: '20px' }}
          >
            search
          </span>
        </div>
        {cities.length > 1 && (
          <select
            className="rq-select"
            style={{ flex: '0 0 140px' }}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      <div
        className="rq-options-grid"
        role="radiogroup"
        aria-label="Partner Hospitals"
        style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}
      >
        {filteredHospitals.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--rq-text-muted)' }}>
            No hospitals match your search. Try adjusting the filter.
          </div>
        ) : (
          filteredHospitals.map((hosp) => {
            const isSelected = selectedHospitalId === hosp.id;
            return (
              <button
                key={hosp.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`rq-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectHospital(hosp.id)}
              >
                <div className="rq-option-radio" aria-hidden="true" />
                <div className="rq-option-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">apartment</span>
                </div>
                <div className="rq-option-content">
                  <div className="rq-option-title">{hosp.name_en}</div>
                  <div className="rq-option-desc">
                    {hosp.city ? `${hosp.city}` : ''}
                    {hosp.campus_highlight_en ? ` • ${hosp.campus_highlight_en}` : ''}
                  </div>
                  {hosp.tag_en && (
                    <span className="rq-badge">{hosp.tag_en}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
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
