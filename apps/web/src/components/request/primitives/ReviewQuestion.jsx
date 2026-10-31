import React from 'react';

export function ReviewQuestion({
  draft,
  recipientName,
  serviceTitle,
  serviceTitles = [],
  hospitalName,
  cmsConfig = {},
  onEditStep,
}) {
  const displayServices = Array.isArray(serviceTitles) && serviceTitles.length > 0
    ? serviceTitles.join(', ')
    : (serviceTitle || 'Not selected');

  const eyebrow = cmsConfig.eyebrow || 'Step 6 of 6 • Review & Verification';
  const title = cmsConfig.title || 'Review your journey details';
  const desc = cmsConfig.desc ||
    'Please confirm all details before submitting. You can click Edit on any section to make changes.';

  const sections = [
    {
      step: 1,
      label: 'Care Recipient',
      value: recipientName || draft.newRecipient?.fullName || 'Not specified',
      sub: draft.newRecipient ? `Relationship / Role: ${draft.newRecipient.relationship}` : null,
      icon: 'person',
    },
    {
      step: 2,
      label: 'Care Services',
      value: displayServices,
      icon: 'medical_services',
    },
    {
      step: 3,
      label: 'Hospital & Campus',
      value: hospitalName || 'Not selected',
      icon: 'local_hospital',
    },
    {
      step: 4,
      label: 'Date & Schedule',
      value: draft.appointmentDate
        ? new Date(draft.appointmentDate).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }) + (draft.appointmentTime ? ` at ${draft.appointmentTime.slice(0, 5)}` : '')
        : 'Date pending',
      sub: draft.timeSlot || 'Standard Arrival Slot',
      icon: 'calendar_month',
    },
    {
      step: 5,
      label: 'Doorstep Pickup & Care Consent',
      value: 'Doorstep Pickup (20 mins prior to appointment)',
      sub: `${draft.pickupAddress ? draft.pickupAddress + ' • ' : ''}${draft.updatePhone ? 'WhatsApp: ' + draft.updatePhone + ' • ' : ''}Consent: Accepted`,
      icon: 'directions_car',
    },
  ];

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fact_check</span>
          {eyebrow}
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      <div className="rq-review-list">
        {sections.map((sec) => (
          <div key={sec.step} className="rq-review-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
              <div
                className="rq-option-icon"
                style={{ width: '36px', height: '36px', borderRadius: '8px' }}
                aria-hidden="true"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {sec.icon}
                </span>
              </div>
              <div className="rq-review-content">
                <div className="rq-review-label">{sec.label}</div>
                <div className="rq-review-value">{sec.value}</div>
                {sec.sub && <div className="rq-review-sub">{sec.sub}</div>}
              </div>
            </div>

            <button
              type="button"
              className="rq-review-edit-btn"
              onClick={() => onEditStep(sec.step)}
              aria-label={`Edit ${sec.label}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              <span>Edit</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
