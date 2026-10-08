import React from 'react';

const DEFAULT_STEPS = [
  { id: 1, label: 'Recipient', fullLabel: 'Recipient Selection' },
  { id: 2, label: 'Service', fullLabel: 'Service Selection' },
  { id: 3, label: 'Hospital', fullLabel: 'Hospital & Doctor' },
  { id: 4, label: 'Schedule', fullLabel: 'Date & Schedule' },
  { id: 5, label: 'Directives', fullLabel: 'Care Directives' },
  { id: 6, label: 'Match', fullLabel: 'Companion Match' },
  { id: 7, label: 'Review', fullLabel: 'Review & Confirm' },
];

export function RequestCareStepper({
  currentStep = 1,
  steps = DEFAULT_STEPS,
  isDraftSaved = true,
  onStepClick,
}) {
  const currentStepObj = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className="rc-stepper-bar">
      <div className="rc-stepper-inner">
        <div className="rc-stepper-status-row">
          <div className="rc-step-badge">
            <span className="rc-step-number-circle">{currentStep}</span>
            <span style={{ fontWeight: 700, color: 'var(--cust-primary)' }}>
              {currentStepObj.fullLabel || currentStepObj.label}
            </span>
            <span style={{ color: 'var(--cust-outline-variant)' }}>/</span>
            <span style={{ color: 'var(--cust-outline)' }}>
              {steps.length} Steps Total
            </span>
          </div>

          {isDraftSaved && (
            <span className="rc-auto-saved-pill">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
                cloud_done
              </span>
              <span>Auto-saved to draft</span>
            </span>
          )}
        </div>

        {/* 7-Step Tracker Component */}
        <ol className="rc-stepper-grid" aria-label="Request Care Steps">
          {steps.map((st) => {
            const isActive = st.id === currentStep;
            const isDone = st.id < currentStep;

            return (
              <li
                key={st.id}
                className={`rc-step-item ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => {
                  if (isDone && onStepClick) onStepClick(st.id);
                }}
                style={{ cursor: isDone ? 'pointer' : 'default' }}
                title={isDone ? `Jump back to Step ${st.id}: ${st.label}` : undefined}
              >
                <div className="rc-step-bar-line" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="rc-step-label">
                    {st.id}. {st.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
