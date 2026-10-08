import React, { useState } from 'react';
import { api } from '../../../api.js';
import { useCustomerAuth } from '../../../auth.jsx';
import { track } from '../../../analytics.js';

export function AuthQuestion({
  role = 'other',
  recipientName = '',
  cmsConfig = {},
  onAuthSuccess,
  error,
}) {
  const { user, persist } = useCustomerAuth();

  // CMS controls: email is ON by default, phone is OFF by default unless enabled in CMS
  const emailEnabled = cmsConfig.authEmailEnabled !== false && cmsConfig.authEmailEnabled !== 'false';
  const phoneEnabled = cmsConfig.authPhoneEnabled === true || cmsConfig.authPhoneEnabled === 'true';

  // Active tab: 'email' (default) or 'phone'
  const [activeMethod, setActiveMethod] = useState(emailEnabled ? 'email' : 'phone');
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'

  // Form states
  const [caregiverName, setCaregiverName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(30);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) clearInterval(interval);
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  // 1. Host direct email verification
  const handleHostEmailOtpRequest = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    track('AUTH_STARTED', { method: 'email_host' });
    try {
      await api.otpRequest({ email: email.trim(), purpose: 'login' }).catch(async () => {
        // If not found in login, try signup
        return api.signup({ full_name: 'Host Coordinator', email: email.trim() });
      });
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      setLocalError(err.message || 'Failed to dispatch host passcode. Please check email address.');
    } finally {
      setBusy(false);
    }
  };

  // 2. Self booking email verification
  const handleSelfEmailOtpRequest = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    track('AUTH_STARTED', { method: 'email_self' });
    try {
      // Create user with recipientName as their account full name
      const effectiveName = recipientName.trim() || 'Patient Self';
      if (password && password.length >= 8) {
        await api.signup({ full_name: effectiveName, email: email.trim(), password });
      } else {
        await api.signup({ full_name: effectiveName, email: email.trim() });
      }
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      // If already registered, switch to login OTP
      if (err.code === 'EMAIL_IN_USE' || err.message?.includes('already')) {
        try {
          await api.otpRequest({ email: email.trim(), purpose: 'login' });
          setOtpSent(true);
          startCooldown();
        } catch (subErr) {
          setLocalError(subErr.message || 'Account already exists. Please log in.');
        }
      } else {
        setLocalError(err.message || 'Verification setup failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  // 3. Caregiver traditional signup form (for mother, father, spouse, child, other)
  const handleCaregiverSignup = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!caregiverName.trim()) {
      setLocalError('Please enter your full name as the family caregiver');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    track('AUTH_STARTED', { method: 'email_caregiver_signup' });
    try {
      const payload = {
        full_name: caregiverName.trim(),
        email: email.trim(),
      };
      if (password && password.length >= 8) {
        payload.password = password;
      }
      await api.signup(payload);
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      if (err.code === 'EMAIL_IN_USE' || err.message?.includes('already')) {
        setAuthMode('login');
        setLocalError('An account with this email already exists. Please enter your password or log in via OTP.');
      } else {
        setLocalError(err.message || 'Sign up failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Traditional caregiver login
  const handleCaregiverLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter your email address');
      return;
    }
    setBusy(true);
    try {
      if (password) {
        const data = await api.login({ identifier: email.trim(), password });
        persist(data, true);
        track('AUTH_COMPLETED', { method: 'email_login' });
        if (onAuthSuccess) onAuthSuccess(data.user);
      } else {
        await api.otpRequest({ email: email.trim(), purpose: 'login' });
        setOtpSent(true);
        startCooldown();
      }
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (code.trim().length !== 6) {
      setLocalError('Please enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      let data;
      try {
        data = await api.otpVerify({ email: email.trim(), purpose: 'signup', code: code.trim() });
      } catch {
        data = await api.otpVerify({ email: email.trim(), purpose: 'login', code: code.trim() });
      }
      persist(data, true);
      track('AUTH_COMPLETED', { method: 'email_otp' });
      if (onAuthSuccess) onAuthSuccess(data.user);
    } catch (err) {
      setLocalError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Phone OTP Flow (when enabled via CMS)
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    const raw = phone.trim();
    if (!raw) {
      setLocalError('Please enter your mobile phone number');
      return;
    }
    const e164 = raw.startsWith('+') ? raw : `+91${raw.replace(/\D/g, '').slice(-10)}`;
    setBusy(true);
    track('AUTH_STARTED', { method: 'phone' });
    try {
      await api.otpRequest({ phone_e164: e164 });
      setPhone(e164);
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      setLocalError(err.message || 'Failed to dispatch phone code.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (code.trim().length !== 6) {
      setLocalError('Please enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      const data = await api.otpVerify({ phone_e164: phone, code: code.trim() });
      persist(data, true);
      track('AUTH_COMPLETED', { method: 'phone_otp' });
      if (onAuthSuccess) onAuthSuccess(data.user);
    } catch (err) {
      setLocalError(err.message || 'Invalid verification code.');
    } finally {
      setBusy(false);
    }
  };

  // If already logged in, show verified status
  if (user) {
    return (
      <div className="rq-question-container">
        <div className="rq-question-header">
          <span className="rq-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
            Step 10 • Account Verified
          </span>
          <h2 className="rq-title" tabIndex="-1">Logged in as {user.full_name || 'Caregiver'}</h2>
          <p className="rq-description">
            Your care request and hospital escort coordination will be linked directly to your active account.
          </p>
        </div>

        <div style={{ background: 'var(--rq-primary-tint)', border: '1px solid var(--rq-primary)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--rq-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>check</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rq-text)' }}>{user.full_name}</div>
            <div style={{ fontSize: '14px', color: 'var(--rq-text-muted)' }}>{user.email || user.phone_e164}</div>
            <div style={{ fontSize: '12px', color: 'var(--rq-success)', fontWeight: 600, marginTop: '4px' }}>
              ✓ Authenticated & Ready for Submission
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = cmsConfig.title || 'Verify your account to confirm request';
  const desc = cmsConfig.desc || 'We create or verify your account so you receive doctor dossiers, receipts, and live escort updates.';

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
          Step 10 • Verification
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      {/* Method Switcher Tabs when both Email and Phone are enabled in CMS */}
      {emailEnabled && phoneEnabled && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--rq-border)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`rq-btn-secondary ${activeMethod === 'email' ? 'rq-btn-primary' : ''}`}
            style={{ padding: '8px 16px', minHeight: '36px', fontSize: '14px' }}
            onClick={() => { setActiveMethod('email'); setOtpSent(false); setCode(''); setLocalError(''); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
            <span>Email Authentication (Default)</span>
          </button>
          <button
            type="button"
            className={`rq-btn-secondary ${activeMethod === 'phone' ? 'rq-btn-primary' : ''}`}
            style={{ padding: '8px 16px', minHeight: '36px', fontSize: '14px' }}
            onClick={() => { setActiveMethod('phone'); setOtpSent(false); setCode(''); setLocalError(''); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>phone</span>
            <span>Phone OTP Authentication</span>
          </button>
        </div>
      )}

      {/* EMAIL AUTHENTICATION BRANCH (DEFAULT) */}
      {activeMethod === 'email' && (
        <>
          {otpSent ? (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyEmailOtp} style={{ background: 'var(--rq-surface-alt)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border)' }}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--rq-text)' }}>
                Verification passcode sent to <strong>{email}</strong>.{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--rq-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  onClick={() => { setOtpSent(false); setCode(''); }}
                >
                  Change Email
                </button>
              </div>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-email-otp">Enter 6-Digit Email Code *</label>
                <input
                  id="rq-email-otp"
                  type="text"
                  maxLength={6}
                  className="rq-input"
                  style={{ letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center' }}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="rq-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={busy || code.length !== 6}
                >
                  {busy ? 'Verifying...' : 'Verify Code & Proceed'}
                </button>
                <button
                  type="button"
                  className="rq-btn-secondary"
                  disabled={cooldown > 0 || busy}
                  onClick={(e) => {
                    if (role === 'host') handleHostEmailOtpRequest(e);
                    else if (role === 'self') handleSelfEmailOtpRequest(e);
                    else handleCaregiverSignup(e);
                  }}
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
                </button>
              </div>
            </form>
          ) : role === 'host' ? (
            /* 1. Host Role: Direct email collection & OTP verification */
            <form onSubmit={handleHostEmailOtpRequest} style={{ background: 'var(--rq-surface-alt)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--rq-primary)', fontWeight: 600 }}>
                <span className="material-symbols-outlined">badge</span>
                <span>Host / Care Coordinator Access</span>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--rq-text-muted)' }}>
                As a host, enter your organizational email to receive the direct login passcode and manage hospital visits.
              </p>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-host-email">Host Email Address *</label>
                <input
                  id="rq-host-email"
                  type="email"
                  className="rq-input"
                  placeholder="coordinator@hospital.com or name@organization.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="rq-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={busy || !email.trim()}
              >
                {busy ? 'Sending Passcode...' : 'Send Host Passcode via Email'}
              </button>
            </form>
          ) : role === 'self' ? (
            /* 2. Self Role: Account automatically created with user's name from step 1 */
            <form onSubmit={handleSelfEmailOtpRequest} style={{ background: 'var(--rq-surface-alt)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--rq-primary)', fontWeight: 600 }}>
                <span className="material-symbols-outlined">person</span>
                <span>Self Booking: Account for {recipientName || 'You'}</span>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--rq-text-muted)' }}>
                Your account will be created under the patient name <strong>{recipientName || 'Self'}</strong>. Enter your email to verify and receive visit coordinates.
              </p>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-self-email">Your Email Address *</label>
                <input
                  id="rq-self-email"
                  type="email"
                  className="rq-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-self-password">Create Account Password (Optional)</label>
                <input
                  id="rq-self-password"
                  type="password"
                  className="rq-input"
                  placeholder="Optional: minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="rq-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={busy || !email.trim()}
              >
                {busy ? 'Sending Code...' : 'Send Email Verification Code'}
              </button>
            </form>
          ) : (
            /* 3. Other Roles: Traditional signup form for the Caregiver */
            <div style={{ background: 'var(--rq-surface-alt)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rq-primary)', fontWeight: 600 }}>
                  <span className="material-symbols-outlined">supervisor_account</span>
                  <span>{authMode === 'signup' ? 'Caregiver Sign Up' : 'Caregiver Log In'}</span>
                </div>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--rq-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                    setLocalError('');
                  }}
                >
                  {authMode === 'signup' ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                </button>
              </div>

              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--rq-text-muted)' }}>
                {authMode === 'signup'
                  ? `You are booking for ${recipientName || 'your family member'}. Create your caregiver account below to track the visit.`
                  : 'Log in with your existing caregiver email to link this hospital visit.'}
              </p>

              {authMode === 'signup' ? (
                <form onSubmit={handleCaregiverSignup}>
                  <div className="rq-form-group">
                    <label className="rq-label" htmlFor="rq-cg-name">Caregiver Full Name *</label>
                    <input
                      id="rq-cg-name"
                      type="text"
                      className="rq-input"
                      placeholder="e.g. Ramesh Chandra (Son / Daughter / Spouse)"
                      value={caregiverName}
                      onChange={(e) => setCaregiverName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="rq-form-group">
                    <label className="rq-label" htmlFor="rq-cg-email">Caregiver Email Address *</label>
                    <input
                      id="rq-cg-email"
                      type="email"
                      className="rq-input"
                      placeholder="caregiver@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="rq-form-group">
                    <label className="rq-label" htmlFor="rq-cg-password">Create Password (Optional)</label>
                    <input
                      id="rq-cg-password"
                      type="password"
                      className="rq-input"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="rq-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={busy || !caregiverName.trim() || !email.trim()}
                  >
                    {busy ? 'Setting up account...' : 'Create Caregiver Account & Verify'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCaregiverLogin}>
                  <div className="rq-form-group">
                    <label className="rq-label" htmlFor="rq-login-email">Email Address *</label>
                    <input
                      id="rq-login-email"
                      type="email"
                      className="rq-input"
                      placeholder="caregiver@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="rq-form-group">
                    <label className="rq-label" htmlFor="rq-login-pw">Password (Leave empty to receive Email OTP)</label>
                    <input
                      id="rq-login-pw"
                      type="password"
                      className="rq-input"
                      placeholder="Enter password or leave blank for OTP"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="rq-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={busy || !email.trim()}
                  >
                    {busy ? 'Authenticating...' : (password ? 'Log In to Account' : 'Send Login OTP Code')}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {/* PHONE AUTHENTICATION (Available only when turned on in CMS) */}
      {activeMethod === 'phone' && phoneEnabled && (
        <div style={{ background: 'var(--rq-surface-alt)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--rq-primary)', fontWeight: 600 }}>
            <span className="material-symbols-outlined">phone_iphone</span>
            <span>Phone OTP Verification</span>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendPhoneOtp}>
              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-phone-input">Mobile Phone Number (India +91) *</label>
                <input
                  id="rq-phone-input"
                  type="tel"
                  className="rq-input"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="rq-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={busy || !phone.trim()}
              >
                {busy ? 'Sending Code...' : 'Send SMS / WhatsApp Passcode'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--rq-text)' }}>
                Code sent to <strong>{phone}</strong>.{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--rq-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  onClick={() => { setOtpSent(false); setCode(''); }}
                >
                  Change
                </button>
              </div>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-phone-code">Enter 6-Digit Code *</label>
                <input
                  id="rq-phone-code"
                  type="text"
                  maxLength={6}
                  className="rq-input"
                  style={{ letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center' }}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="rq-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={busy || code.length !== 6}
              >
                {busy ? 'Verifying...' : 'Verify Phone Code & Continue'}
              </button>
            </form>
          )}
        </div>
      )}

      {(localError || error) && (
        <div className="rq-error-msg" role="alert" style={{ marginTop: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span>{localError || error}</span>
        </div>
      )}
    </div>
  );
}
