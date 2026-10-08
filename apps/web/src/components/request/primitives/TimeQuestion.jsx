import React from 'react';

export function TimeQuestion({
  title = 'Preferred Arrival Time Window',
  description = 'When should our care escort meet the patient?',
  value,
  onChange,
  error,
}) {
  const slots = [
    { id: 'morning', label: 'Morning Slot', hours: '08:00 AM – 12:00 PM', icon: 'wb_sunny' },
    { id: 'afternoon', label: 'Afternoon Slot', hours: '12:00 PM – 04:00 PM', icon: 'light_mode' },
    { id: 'evening', label: 'Evening Slot', hours: '04:00 PM – 08:00 PM', icon: 'nights_stay' },
  ];

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        {description && <p className="rq-description">{description}</p>}
      </div>

      <div className="rq-options-grid">
        {slots.map((s) => {
          const isSelected = value === s.hours;
          return (
            <button
              key={s.id}
              type="button"
              className={`rq-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange(s.hours)}
            >
              <div className="rq-option-radio" aria-hidden="true" />
              <div className="rq-option-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div className="rq-option-content">
                <div className="rq-option-title">{s.label}</div>
                <div className="rq-option-desc">{s.hours}</div>
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
