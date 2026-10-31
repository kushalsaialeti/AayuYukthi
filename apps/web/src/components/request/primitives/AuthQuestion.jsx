import React, { useState, useEffect, useRef } from 'react';
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
  const autoSubmittingRef = useRef(false);

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
    if (e) e.preventDefault();
    setLocalError('');
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    track('AUTH_STARTED', { method: 'email_host' });
    try {
      await api.otpRequest({ email: email.trim(), purpose: 'login' }).catch(async () => {
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
    if (e) e.preventDefault();
    setLocalError('');
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    track('AUTH_STARTED', { method: 'email_self' });
    try {
      const effectiveName = recipientName.trim() || 'Patient Self';
      if (password && password.length >= 8) {
        await api.signup({ full_name: effectiveName, email: email.trim(), password });
      } else {
        await api.signup({ full_name: effectiveName, email: email.trim() });
      }
      setOtpSent(true);
      startCooldown();
    } catch (err) {
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

  // 3. Caregiver signup form (with buttons toggle)
  const handleCaregiverSignup = async (e) => {
    if (e) e.preventDefault();
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

  // Caregiver login
  const handleCaregiverLogin = async (e) => {
    if (e) e.preventDefault();
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

  // Verify Email OTP (supports auto-submit)
  const executeVerifyEmailOtp = async (inputCode) => {
    if (busy || autoSubmittingRef.current) return;
    const cleanCode = (inputCode || code).trim();
    if (cleanCode.length !== 6) return;

    autoSubmittingRef.current = true;
    setBusy(true);
    setLocalError('');
    try {
      let data;
      try {
        data = await api.otpVerify({ email: email.trim(), purpose: 'signup', code: cleanCode });
      } catch {
        data = await api.otpVerify({ email: email.trim(), purpose: 'login', code: cleanCode });
      }
      persist(data, true);
      track('AUTH_COMPLETED', { method: 'email_otp' });
      if (onAuthSuccess) onAuthSuccess(data.user);
    } catch (err) {
      setLocalError(err.message || 'Invalid or expired code. Please check code or request new one.');
    } finally {
      setBusy(false);
      autoSubmittingRef.current = false;
    }
  };

  const handleVerifyEmailOtp = (e) => {
    if (e) e.preventDefault();
    executeVerifyEmailOtp(code);
  };

  // Phone OTP Flow
  const handleSendPhoneOtp = async (e) => {
    if (e) e.preventDefault();
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

  const executeVerifyPhoneOtp = async (inputCode) => {
    if (busy || autoSubmittingRef.current) return;
    const cleanCode = (inputCode || code).trim();
    if (cleanCode.length !== 6) return;

    autoSubmittingRef.current = true;
    setBusy(true);
    setLocalError('');
    try {
      const data = await api.otpVerify({ phone_e164: phone, code: cleanCode });
      persist(data, true);
      track('AUTH_COMPLETED', { method: 'phone_otp' });
      if (onAuthSuccess) onAuthSuccess(data.user);
    } catch (err) {
      setLocalError(err.message || 'Invalid phone verification code.');
    } finally {
      setBusy(false);
      autoSubmittingRef.current = false;
    }
  };

  const handleVerifyPhoneOtp = (e) => {
    if (e) e.preventDefault();
    executeVerifyPhoneOtp(code);
  };

  // If already logged in, show verified status
  if (user) {
    return (
      <div className="rq-question-container">
        <div className="rq-question-header">
          <span className="rq-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
            Step 6 of 6 • Account Verified
          </span>
          <h2 className="rq-title" tabIndex="-1">Logged in as {user.full_name || 'Caregiver'}</h2>
          <p className="rq-description">
            Your care request and hospital escort coordination will be linked directly to your active account.
          </p>
        </div>

        <div style={{ background: 'var(--rq-primary-tint, #ecfdf5)', border: '1.5px solid var(--rq-primary, #059669)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--rq-primary, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>check</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rq-text, #0f172a)' }}>{user.full_name}</div>
            <div style={{ fontSize: '14px', color: 'var(--rq-text-muted, #64748b)' }}>{user.email || user.phone_e164}</div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
              ✓ Authenticated &amp; Ready for Final Submission
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = cmsConfig.title || 'Verify your account to confirm request';
  const desc = cmsConfig.desc || 'Create or sign in to your caregiver account to receive doctor dossiers, receipts, and live escort updates.';

  return (
    <div className="rq-question-container">
      <div className="rq-question-header">
        <span className="rq-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
          Step 6 of 6 • Identity Verification
        </span>
        <h2 className="rq-title" tabIndex="-1">{title}</h2>
        <p className="rq-description">{desc}</p>
      </div>

      {/* Method Switcher Tabs when both Email and Phone are enabled in CMS */}
      {emailEnabled && phoneEnabled && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--rq-border, #e2e8f0)', paddingBottom: '8px' }}>
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
            /* OTP Verification Screen with AUTO-SUBMIT */
            <form onSubmit={handleVerifyEmailOtp} style={{ background: 'var(--rq-surface-alt, #f8fafc)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border, #e2e8f0)' }}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--rq-text, #0f172a)' }}>
                Verification passcode sent to <strong>{email}</strong>.{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--rq-primary, #004349)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  onClick={() => { setOtpSent(false); setCode(''); }}
                >
                  Change Email
                </button>
              </div>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-email-otp">
                  Enter 6-Digit Verification Code *
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginLeft: '8px' }}>
                    (Auto-submits on 6th digit)
                  </span>
                </label>
                <input
                  id="rq-email-otp"
                  type="text"
                  maxLength={6}
                  className="rq-input"
                  style={{ letterSpacing: '0.35em', fontSize: '22px', textAlign: 'center', fontWeight: 700 }}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(clean);
                    if (clean.length === 6) {
                      executeVerifyEmailOtp(clean);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && code.length === 6) {
                      e.preventDefault();
                      handleVerifyEmailOtp(e);
                    }
                  }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="rq-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={busy || code.length !== 6}
                >
                  {busy ? 'Verifying Code...' : 'Verify Code & Proceed'}
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
            /* 1. Host Role */
            <form onSubmit={handleHostEmailOtpRequest} style={{ background: 'var(--rq-surface-alt, #f8fafc)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--rq-primary, #004349)', fontWeight: 600 }}>
                <span className="material-symbols-outlined">badge</span>
                <span>Host / Care Coordinator Access</span>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--rq-text-muted, #64748b)' }}>
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
            /* 2. Self Role */
            <form onSubmit={handleSelfEmailOtpRequest} style={{ background: 'var(--rq-surface-alt, #f8fafc)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--rq-primary, #004349)', fontWeight: 600 }}>
                <span className="material-symbols-outlined">person</span>
                <span>Self Booking: Account for {recipientName || 'You'}</span>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--rq-text-muted, #64748b)' }}>
                Your account will be created under patient name <strong>{recipientName || 'Self'}</strong>. Enter your email to verify and receive visit coordinates.
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
            /* 3. Non-logged-in User Form: Sign Up vs Sign In in clear Buttons */
            <div style={{ background: 'var(--rq-surface-alt, #f8fafc)', padding: '24px', borderRadius: '14px', border: '1px solid var(--rq-border, #e2e8f0)' }}>
              {/* Segmented Buttons for Sign Up vs Sign In */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    background: '#e2e8f0',
                    borderRadius: '10px',
                    padding: '3px',
                    gap: '4px',
                  }}
                  role="tablist"
                  aria-label="Caregiver authentication mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'signup'}
                    onClick={() => {
                      setAuthMode('signup');
                      setLocalError('');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: authMode === 'signup' ? 'var(--rq-primary, #004349)' : 'transparent',
                      color: authMode === 'signup' ? '#ffffff' : '#475569',
                      boxShadow: authMode === 'signup' ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                    <span>Sign Up (New Caregiver)</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'login'}
                    onClick={() => {
                      setAuthMode('login');
                      setLocalError('');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: authMode === 'login' ? 'var(--rq-primary, #004349)' : 'transparent',
                      color: authMode === 'login' ? '#ffffff' : '#475569',
                      boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                    <span>Sign In (Existing Account)</span>
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--rq-text-muted, #64748b)' }}>
                {authMode === 'signup'
                  ? `Booking for ${recipientName || 'your family member'}. Create your account below to track the companion and live updates.`
                  : 'Log in with your existing caregiver credentials to link this hospital visit.'}
              </p>

              {authMode === 'signup' ? (
                /* Caregiver Sign Up Form */
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
                      autoComplete="name"
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
                      autoComplete="email"
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
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Single CTA button for Sign Up */}
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
                /* Caregiver Log In Form */
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
                      autoComplete="email"
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
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Single CTA button for Log In */}
                  <button
                    type="submit"
                    className="rq-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={busy || !email.trim()}
                  >
                    {busy ? 'Authenticating...' : (password ? 'Sign In with Password' : 'Send Login OTP Code')}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {/* PHONE AUTHENTICATION (Available only when turned on in CMS) */}
      {activeMethod === 'phone' && phoneEnabled && (
        <div style={{ background: 'var(--rq-surface-alt, #f8fafc)', padding: '24px', borderRadius: '12px', border: '1px solid var(--rq-border, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--rq-primary, #004349)', fontWeight: 600 }}>
            <span className="material-symbols-outlined">phone_iphone</span>
            <span>Phone OTP Verification</span>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendPhoneOtp}>
              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-phone-input">Mobile Phone Number *</label>
                <input
                  id="rq-phone-input"
                  type="tel"
                  className="rq-input"
                  placeholder="+91 98765 43210"
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
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--rq-text, #0f172a)' }}>
                Code sent to <strong>{phone}</strong>.{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--rq-primary, #004349)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  onClick={() => { setOtpSent(false); setCode(''); }}
                >
                  Change
                </button>
              </div>

              <div className="rq-form-group">
                <label className="rq-label" htmlFor="rq-phone-code">
                  Enter 6-Digit Code *
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginLeft: '8px' }}>
                    (Auto-submits on 6th digit)
                  </span>
                </label>
                <input
                  id="rq-phone-code"
                  type="text"
                  maxLength={6}
                  className="rq-input"
                  style={{ letterSpacing: '0.35em', fontSize: '22px', textAlign: 'center', fontWeight: 700 }}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(clean);
                    if (clean.length === 6) {
                      executeVerifyPhoneOtp(clean);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && code.length === 6) {
                      e.preventDefault();
                      handleVerifyPhoneOtp(e);
                    }
                  }}
                  autoFocus
                  required
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
