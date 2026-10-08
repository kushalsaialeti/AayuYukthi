import React from 'react';

export function DateQuestion({
  title,
  description,
  dateValue,
  onDateChange,
  timeSlotValue,
  onTimeSlotChange,
  cmsConfig = {},
  error,
}) {
  const eyebrow = cmsConfig.eyebrow || 'Step 5 • Schedule & Timing';
  const effectiveTitle = cmsConfig.title || title || 'When do you need companion accompaniment?';
  const effectiveDesc = cmsConfig.desc || description || 'Select your scheduled consultation or hospital admission date and arrival slot.';

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const timeSlots = [
    { id: 'morning', label: 'Morning Slot', hours: '08:00 AM – 12:00 PM', icon: 'wb_sunny' },
    { id: 'afternoon', label: 'Afternoon Slot', hours: '12:00 PM – 04:00 PM', icon: 'light_mode' },
    { id: 'evening', label: 'Evening Slot', hours: '04:00 PM – 08:00 PM', icon: 'nights_stay' },
  ];

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{effectiveTitle}</h2>
        {effectiveDesc && <p className="rq-description">{effectiveDesc}</p>}
      </div>

      <div className="rq-form-group">
        <label className="rq-label" htmlFor="rq-date-input">Appointment Date *</label>
        <input
          id="rq-date-input"
          type="date"
          className="rq-input"
          min={today}
          max={maxDate}
          value={dateValue || ''}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <div style={{ fontSize: '13px', color: 'var(--rq-text-muted)', marginTop: '4px' }}>
          Advance bookings are accepted up to 90 days in advance.
        </div>
      </div>

      <div className="rq-form-group" style={{ marginTop: '24px' }}>
        <label className="rq-label">Preferred Arrival / Consultation Time Window</label>
        <div className="rq-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {timeSlots.map((slot) => {
            const isSelected = timeSlotValue === slot.hours;
            return (
              <button
                key={slot.id}
                type="button"
                className={`rq-option-card ${isSelected ? 'selected' : ''}`}
                style={{ padding: '12px' }}
                onClick={() => onTimeSlotChange(slot.hours)}
              >
                <div className="rq-option-radio" aria-hidden="true" />
                <div className="rq-option-content">
                  <div className="rq-option-title" style={{ fontSize: '14px' }}>{slot.label}</div>
                  <div className="rq-option-desc" style={{ fontSize: '12px' }}>{slot.hours}</div>
                </div>
              </button>
            );
          })}
        </div>
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
