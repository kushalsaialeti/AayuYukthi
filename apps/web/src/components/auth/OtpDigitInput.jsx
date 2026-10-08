import React, { useRef, useEffect } from 'react';

export function OtpDigitInput({ value = '', onChange, onComplete, disabled = false, autoFocus = true }) {
  const inputsRef = useRef([]);

  // Ensure value is padded/sliced to 6 chars
  const digits = Array.from({ length: 6 }).map((_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous and clear it
        inputsRef.current[index - 1]?.focus();
        const next = digits.slice();
        next[index - 1] = '';
        const newCode = next.join('');
        onChange(newCode);
      } else {
        const next = digits.slice();
        next[index] = '';
        const newCode = next.join('');
        onChange(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleChange = (index, e) => {
    if (disabled) return;
    const inputVal = e.target.value.replace(/\D/g, '');
    if (!inputVal) {
      const next = digits.slice();
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // Handle typing a single character
    const char = inputVal.slice(-1);
    const next = digits.slice();
    next[index] = char;
    const newCode = next.join('');
    onChange(newCode);

    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.length === 6 && !newCode.includes(' ') && onComplete) {
      onComplete(newCode);
    }
  };

  const handlePaste = (e) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextFocus = Math.min(5, pasted.length);
      inputsRef.current[nextFocus]?.focus();
      if (pasted.length === 6 && onComplete) {
        onComplete(pasted);
      }
    }
  };

  return (
    <div className="ay-otp-boxes-grid" onPaste={handlePaste} aria-label="6-digit verification passcode">
      {digits.map((digit, i) => {
        const isFilled = digit !== '';
        return (
          <div key={i} className="ay-otp-box-wrapper">
            <input
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`ay-otp-digit-input ${isFilled ? 'filled' : ''}`}
              aria-label={`Passcode digit ${i + 1}`}
            />
          </div>
        );
      })}
    </div>
  );
}
