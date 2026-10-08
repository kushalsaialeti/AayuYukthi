import React from 'react';

export function SingleSelectQuestion({
  title,
  description,
  options = [],
  selectedValue,
  onSelect,
  error,
}) {
  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        {description && <p className="rq-description">{description}</p>}
      </div>

      <div className="rq-options-grid" role="radiogroup" aria-label={title}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`rq-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(opt.value)}
            >
              <div className="rq-option-radio" aria-hidden="true" />
              {opt.icon && (
                <div className="rq-option-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">{opt.icon}</span>
                </div>
              )}
              <div className="rq-option-content">
                <div className="rq-option-title">{opt.title || opt.label}</div>
                {opt.description && <div className="rq-option-desc">{opt.description}</div>}
                {opt.badge && <span className="rq-badge">{opt.badge}</span>}
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
