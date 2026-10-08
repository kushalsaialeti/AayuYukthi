import React from 'react';

const STEPS = [
  { num: 1, label: 'Step 1', title: 'Account Basics' },
  { num: 2, label: 'Step 2', title: 'Verification' },
  { num: 3, label: 'Step 3', title: 'Profile Details' },
  { num: 4, label: 'Step 4', title: 'Care Onboarding' },
];

export function StepTracker({ currentStep = 1 }) {
  const progressPercent = Math.min(100, Math.max(25, (currentStep / 4) * 100));

  return (
    <div className="ay-step-tracker-card" aria-label="Registration Progress">
      <div className="ay-step-grid">
        {STEPS.map((step) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;
          const itemClass = isActive
            ? 'ay-step-item active'
            : isCompleted
              ? 'ay-step-item completed'
              : 'ay-step-item';

          return (
            <div key={step.num} className={itemClass}>
              <div className="ay-step-circle">
                {isCompleted ? (
                  <span className="material-symbols-outlined text-[20px]">check</span>
                ) : (
                  step.num
                )}
              </div>
              <div className="ay-step-info">
                <span className="ay-step-label">{step.label}</span>
                <span className="ay-step-title">{step.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ay-step-progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
        <div className="ay-step-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
