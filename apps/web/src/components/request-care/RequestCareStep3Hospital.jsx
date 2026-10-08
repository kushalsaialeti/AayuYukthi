import React, { useState, useMemo } from 'react';

export function RequestCareStep3Hospital({
  hospitals = [],
  selectedHospitalId,
  onSelectHospital,
  onBack,
  onContinue,
  canContinue,
  tx,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  // Extract unique cities
  const cities = useMemo(() => {
    const set = new Set();
    for (const h of hospitals) {
      if (h.city) set.add(h.city);
    }
    return Array.from(set);
  }, [hospitals]);

  // Filtered hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const name = (h.name_en || '').toLowerCase();
      const city = (h.city || '').toLowerCase();
      const address = (h.address_en || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesQuery = !query || name.includes(query) || city.includes(query) || address.includes(query);
      const matchesCity = cityFilter === 'all' || (h.city || '').toLowerCase() === cityFilter.toLowerCase();
      return matchesQuery && matchesCity;
    });
  }, [hospitals, searchTerm, cityFilter]);

  return (
    <section className="rc-step-panel">
      {/* Step Header */}
      <div className="rc-step-header-block">
        <div className="rc-step-chip">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            local_hospital
          </span>
          <span>STEP 3 OF 7 • DESTINATION HOSPITAL</span>
        </div>
        <h1 className="rc-step-title">Select destination hospital in Bhimavaram</h1>
        <p className="rc-step-desc">
          Choose from our network of verified partner hospitals and specialty clinics. Our companions operate continuous circuits with pre-scouted wheelchair ramps.
        </p>
      </div>

      {/* Search and City Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          position: 'relative',
          flex: '1 1 18rem',
          display: 'flex',
          alignItems: 'center',
        }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '0.85rem',
              color: 'var(--cust-outline)',
              fontSize: '20px',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            type="text"
            className="input"
            placeholder="Search hospitals by name, area, or landmark…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>

        {cities.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCityFilter('all')}
              className={`cust-filter-chip ${cityFilter === 'all' ? 'is-active' : ''}`}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid var(--cust-outline-variant)',
                backgroundColor: cityFilter === 'all' ? 'var(--cust-primary)' : 'var(--cust-surface-container-low)',
                color: cityFilter === 'all' ? '#ffffff' : 'var(--cust-on-surface)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All Hubs ({hospitals.length})
            </button>
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCityFilter(c)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--cust-outline-variant)',
                  backgroundColor: cityFilter.toLowerCase() === c.toLowerCase() ? 'var(--cust-primary)' : 'var(--cust-surface-container-low)',
                  color: cityFilter.toLowerCase() === c.toLowerCase() ? '#ffffff' : 'var(--cust-on-surface)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hospital Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {filteredHospitals.length === 0 ? (
          <div style={{
            padding: '2.5rem 1.5rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--cust-surface-container-lowest)',
            border: '1px dashed var(--cust-outline-variant)',
            textAlign: 'center',
            color: 'var(--cust-on-surface-variant)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--cust-outline)' }}>
              location_off
            </span>
            <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
              No hospitals matched "{searchTerm}".
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
              Try searching for "Bhimavaram", "Apollo", or clearing the search filter.
            </p>
          </div>
        ) : (
          filteredHospitals.map((h) => {
            const isSel = selectedHospitalId === h.id;
            const name = tx ? tx('hospitals', h.id, 'name_en', h.name_en) : h.name_en;
            const highlight = h.campus_highlight_en || h.wait_info_en || 'Main Porch Wheelchair Rendezvous Protocol';
            const city = h.city || 'Bhimavaram';
            const rating = h.rating || 4.8;
            const visits = h.assisted_visits_count || '150+ visits';

            return (
              <div
                key={h.id}
                onClick={() => onSelectHospital(h.id)}
                className={`rc-recipient-card ${isSel ? 'is-selected' : ''}`}
                style={{
                  cursor: 'pointer',
                  padding: '1.15rem 1.25rem',
                  borderRadius: '1rem',
                  border: isSel
                    ? '2px solid var(--cust-primary, #004349)'
                    : '1px solid var(--cust-outline-variant, #bfc8c9)',
                  backgroundColor: isSel
                    ? 'rgba(0, 67, 73, 0.03)'
                    : 'var(--cust-surface-container-lowest, #ffffff)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSel ? '0 2px 8px rgba(0, 67, 73, 0.08)' : 'none',
                }}
                role="radio"
                aria-checked={isSel}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onSelectHospital(h.id);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0 }}>
                    {h.logo_url || h.image_url ? (
                      <img
                        src={h.logo_url || h.image_url}
                        alt={name}
                        style={{
                          width: '3.25rem',
                          height: '3.25rem',
                          borderRadius: '0.75rem',
                          objectFit: 'cover',
                          flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '3.25rem',
                          height: '3.25rem',
                          borderRadius: '0.75rem',
                          backgroundColor: isSel ? 'var(--cust-primary, #004349)' : 'var(--cust-surface-container-high, #e6e9e8)',
                          color: isSel ? '#ffffff' : 'var(--cust-primary, #004349)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                          local_hospital
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
                          {name}
                        </h3>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--cust-secondary-fixed, #cee5ff)',
                          color: 'var(--cust-on-secondary-fixed, #041d31)',
                        }}>
                          {city}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--cust-primary)',
                        }}>
                          <span className="material-symbols-outlined fill" style={{ fontSize: '15px', color: '#d97706' }}>star</span>
                          <span>{rating}</span>
                          <span style={{ color: 'var(--cust-outline)', fontWeight: 400 }}>({visits})</span>
                        </span>
                      </div>

                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.4 }}>
                        {highlight}
                      </p>

                      {h.address_en && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--cust-outline)', marginTop: '0.25rem' }}>
                          {h.address_en}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    style={{
                      width: '1.65rem',
                      height: '1.65rem',
                      borderRadius: '9999px',
                      border: isSel
                        ? '2px solid var(--cust-primary, #004349)'
                        : '2px solid var(--cust-outline, #6f797a)',
                      backgroundColor: isSel ? 'var(--cust-primary, #004349)' : 'transparent',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSel && (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', fontWeight: 700 }}>
                        check
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions Bar */}
      <div className="rc-step-actions-bar" style={{ marginTop: '1.75rem' }}>
        <button type="button" onClick={onBack} className="cust-btn-secondary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          <span>Back to Services</span>
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="rc-btn-continue"
          style={{
            opacity: canContinue ? 1 : 0.5,
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          <span>Continue to Schedule</span>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
