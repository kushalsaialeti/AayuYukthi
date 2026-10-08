import React from 'react';

export function RecipientDirectives({ values, onChange, config }) {
  const languages = config?.languages || [];
  const selectedLanguages = values.languages || [];

  const handleToggleLanguage = (lang) => {
    let next;
    if (selectedLanguages.includes(lang)) {
      next = selectedLanguages.filter((l) => l !== lang);
    } else {
      next = [...selectedLanguages, lang];
    }
    onChange('languages', next);
  };

  return (
    <section className="rf-section-card">
      <div className="rf-section-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="rf-section-badge">04</span>
          <div className="rf-section-title-wrap">
            <h2 className="rf-section-title">Communication &amp; Directives</h2>
            <p className="rf-section-subtitle">Dialect fluency and personalized comforting protocols</p>
          </div>
        </div>
        <span className="rf-section-tag">Human Touch</span>
      </div>

      {/* Primary Spoken Languages */}
      <div className="rf-field" style={{ marginBottom: '1.5rem' }}>
        <label className="rf-label">
          <span>Primary Spoken Languages for Companion <span className="rf-req">*</span></span>
        </label>
        <p className="rf-helper" style={{ margin: '0.15rem 0 0.5rem' }}>
          We match a companion who speaks the recipient’s preferred mother tongue.
        </p>

        <div className="rf-chips-wrap" id="languageSelector">
          {languages.map((lang) => {
            const isSelected = selectedLanguages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                className={`rf-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleToggleLanguage(lang)}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    check
                  </span>
                )}
                <span>{lang}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Directives / Care Notes */}
      <div className="rf-field">
        <label className="rf-label" htmlFor="careDirectives">
          Special Directives &amp; Comfort Preferences
        </label>
        <textarea
          id="careDirectives"
          name="careDirectives"
          rows={3}
          className="rf-textarea"
          placeholder="e.g. Mild right knee arthritis, gets slightly overwhelmed in noisy crowded OPD lobbies. Prefers quiet corner seating while waiting for doctor consult. Remind her to take sips of warm water."
          value={values.careDirectives}
          onChange={(e) => onChange('careDirectives', e.target.value)}
        />
        <span className="rf-helper">
          Visible directly on the assigned companion's field itinerary briefing card.
        </span>
      </div>
    </section>
  );
}
