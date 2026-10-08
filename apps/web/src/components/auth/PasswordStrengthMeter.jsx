import React from 'react';

export function PasswordStrengthMeter({ password = '' }) {
  const hasLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasLength) score++;
  if (hasNumber) score++;
  if (hasUpper) score++;
  if (hasSpecial) score++;

  let label = 'Enter password';
  let labelColor = 'var(--ay-auth-on-surface-variant)';
  let barClass = '';

  if (password.length > 0) {
    if (score === 1) {
      label = 'Weak';
      labelColor = 'var(--ay-auth-error)';
      barClass = 'active-weak';
    } else if (score === 2) {
      label = 'Moderate';
      labelColor = 'var(--ay-auth-tertiary-container)';
      barClass = 'active-moderate';
    } else if (score === 3) {
      label = 'Good';
      labelColor = 'var(--ay-auth-primary-container)';
      barClass = 'active-good';
    } else if (score >= 4) {
      label = 'Strong Password';
      labelColor = 'var(--ay-auth-primary)';
      barClass = 'active-strong';
    }
  }

  return (
    <div className="ay-pwd-strength-box" aria-live="polite">
      <div className="ay-pwd-strength-header">
        <span style={{ color: 'var(--ay-auth-on-surface-variant)' }}>Security Evaluation:</span>
        <span style={{ fontWeight: 600, color: labelColor }}>{label}</span>
      </div>

      <div className="ay-pwd-meter-bars">
        <div className={`ay-pwd-meter-bar ${score >= 1 ? barClass : ''}`} />
        <div className={`ay-pwd-meter-bar ${score >= 2 ? barClass : ''}`} />
        <div className={`ay-pwd-meter-bar ${score >= 3 ? barClass : ''}`} />
        <div className={`ay-pwd-meter-bar ${score >= 4 ? barClass : ''}`} />
      </div>

      <div className="ay-pwd-reqs">
        <div className={`ay-pwd-req-item ${hasLength ? 'met' : ''}`}>
          <span className="material-symbols-outlined text-[14px]">
            {hasLength ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          <span>8+ Chars</span>
        </div>
        <div className={`ay-pwd-req-item ${hasNumber ? 'met' : ''}`}>
          <span className="material-symbols-outlined text-[14px]">
            {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          <span>1+ Number</span>
        </div>
        <div className={`ay-pwd-req-item ${hasUpper ? 'met' : ''}`}>
          <span className="material-symbols-outlined text-[14px]">
            {hasUpper ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          <span>1+ Uppercase</span>
        </div>
      </div>
    </div>
  );
}
