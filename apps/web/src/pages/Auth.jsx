import React, { useState } from 'react';
import { api } from '../api.js';

export { Signup } from './Signup.jsx';
export { Login } from './Login.jsx';
export { VerifyOtpPage } from './VerifyOtp.jsx';

// Shared lightweight OtpStep preserved for backward compatibility and test runner
export function OtpStep({ channel, purpose, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api.otpVerify({ purpose, ...channel, code });
      onVerified(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await api.otpRequest({ purpose, ...channel });
      setCooldown(30);
      const id = setInterval(() => setCooldown((c) => {
        if (c <= 1) clearInterval(id);
        return Math.max(0, c - 1);
      }), 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={verify} className="card form-card">
      <h2 style={{ marginTop: 0 }}>Enter the 6-digit code</h2>
      <p className="muted">Sent to {channel.email ?? channel.phone_e164 ?? channel.identifier}.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>Code</span>
        <input
          className="input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={busy || code.length !== 6}>
          {busy ? 'Verifying…' : 'Verify'}
        </button>
        <button type="button" className="btn btn-secondary" disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        {onBack && <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>}
      </div>
    </form>
  );
}
