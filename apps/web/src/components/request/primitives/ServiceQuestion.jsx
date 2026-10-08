import React from 'react';

export function ServiceQuestion({
  services = [],
  selectedServiceIds = [],
  selectedServiceId,
  onToggleService,
  onSelectService,
  cmsConfig = {},
  error,
}) {
  const currentIds = Array.isArray(selectedServiceIds) && selectedServiceIds.length > 0
    ? selectedServiceIds
    : (selectedServiceId ? [selectedServiceId] : []);

  const handleToggle = (id) => {
    if (onToggleService) {
      onToggleService(id);
    } else if (onSelectService) {
      const next = currentIds.includes(id)
        ? currentIds.filter((x) => x !== id)
        : [...currentIds, id];
      onSelectService(next.length > 0 ? next[0] : null, next);
    }
  };

  const eyebrow = cmsConfig.eyebrow || 'Step 2 • Care Services';
  const title = cmsConfig.title || 'Which support services do you need?';
  const desc = cmsConfig.desc ||
    'Select one or more services. All options include an on-ground care companion to escort the patient from arrival to departure.';

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>medical_services</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
        {currentIds.length > 0 && (
          <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--rq-primary)' }}>
            ✓ {currentIds.length} service{currentIds.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      <div className="rq-options-grid" role="group" aria-label="Care Services (Multiple Options)">
        {services.map((svc) => {
          const isSelected = currentIds.includes(svc.id);
          return (
            <button
              key={svc.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              className={`rq-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggle(svc.id)}
            >
              <div
                className="rq-option-radio"
                style={{ borderRadius: '6px' }}
                aria-hidden="true"
              >
                {isSelected && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: '#ffffff' }}
                  >
                    check
                  </span>
                )}
              </div>
              <div className="rq-option-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{svc.icon || 'support_agent'}</span>
              </div>
              <div className="rq-option-content">
                <div className="rq-option-title">{svc.title_en}</div>
                {svc.description_en && (
                  <div className="rq-option-desc">{svc.description_en}</div>
                )}
                {svc.subtitle_en && (
                  <span className="rq-badge">{svc.subtitle_en}</span>
                )}
              </div>
            </button>
          );
        })}
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
