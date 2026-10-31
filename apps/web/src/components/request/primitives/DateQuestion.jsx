import React from 'react';
import { DatePickerTime } from '../../ui/DatePickerTime.jsx';

export function DateQuestion({
  title,
  description,
  dateValue,
  onDateChange,
  timeSlotValue,
  onTimeSlotChange,
  timeValue,
  onTimeChange,
  cmsConfig = {},
  error,
}) {
  const eyebrow = cmsConfig.eyebrow || 'Step 4 of 6 • Schedule & Timing';
  const effectiveTitle = cmsConfig.title || title || 'When do you need companion accompaniment?';
  const effectiveDesc = cmsConfig.desc || description || 'Select your scheduled appointment date and time for doorstep pickup and hospital escort.';

  const timeSlots = [
    { id: 'morning', label: 'Morning Slot', hours: '08:00 AM – 12:00 PM', time: '09:00:00', icon: 'wb_sunny' },
    { id: 'afternoon', label: 'Afternoon Slot', hours: '12:00 PM – 04:00 PM', time: '13:00:00', icon: 'light_mode' },
    { id: 'evening', label: 'Evening Slot', hours: '04:00 PM – 08:00 PM', time: '17:00:00', icon: 'nights_stay' },
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

      {/* Date & Time Picker Group */}
      <div className="rq-form-group">
        <DatePickerTime
          date={dateValue}
          onDateChange={onDateChange}
          time={timeValue || (timeSlotValue?.includes('12:00 PM') ? '13:00:00' : '09:00:00')}
          onTimeChange={(val) => {
            if (onTimeChange) onTimeChange(val);
            if (onTimeSlotChange) {
              const hour = parseInt(val.slice(0, 2), 10);
              if (hour < 12) onTimeSlotChange('Morning (08:00 AM – 12:00 PM)');
              else if (hour < 16) onTimeSlotChange('Afternoon (12:00 PM – 04:00 PM)');
              else onTimeSlotChange('Evening (04:00 PM – 08:00 PM)');
            }
          }}
        />
        <div style={{ fontSize: '13px', color: 'var(--rq-text-muted)', marginTop: '8px' }}>
          Select the exact doctor or consultation time. We will pick you up 20 minutes prior.
        </div>
      </div>

      {/* Quick Time Window Presets */}
      <div className="rq-form-group" style={{ marginTop: '24px' }}>
        <label className="rq-label">Preferred Time Window</label>
        <div className="rq-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {timeSlots.map((slot) => {
            const isSelected = timeSlotValue?.includes(slot.label) || timeSlotValue === slot.hours;
            return (
              <button
                key={slot.id}
                type="button"
                className={`rq-option-card ${isSelected ? 'selected' : ''}`}
                style={{ padding: '12px' }}
                onClick={() => {
                  onTimeSlotChange(slot.hours);
                  if (onTimeChange) onTimeChange(slot.time);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTimeSlotChange(slot.hours);
                    if (onTimeChange) onTimeChange(slot.time);
                  }
                }}
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
        <div className="rq-error-msg" role="alert" style={{ marginTop: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
