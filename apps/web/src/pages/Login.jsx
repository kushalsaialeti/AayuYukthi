import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { useCustomerAuth } from '../auth.jsx';
import { AuthLayout, useAuthCms } from '../components/auth/AuthLayout.jsx';
import { AuthTrustPanel } from '../components/auth/AuthTrustPanel.jsx';
import { AuthComplianceBadges } from '../components/auth/AuthComplianceBadges.jsx';
import { VerifyOtpPage } from './VerifyOtp.jsx';

export function Login() {
  const { persist } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === '1';
  const redirectPath = searchParams.get('redirect') || '/app';
  const cms = useAuthCms();

  const [mode, setMode] = useState('password'); // 'password' | 'otp' | 'recovery'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [otpChannel, setOtpChannel] = useState(null);
  const [recovered, setRecovered] = useState(false);

  const done = (data) => {
    persist(data, rememberMe);
    navigate(redirectPath, { replace: true });
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    track('LOGIN_STARTED');
    try {
      const res = await api.login({ identifier: identifier.trim(), password });
      done(res);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please verify and try again.');
    } finally {
      setBusy(false);
    }
  };

  const startOtp = async (purpose, e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ch = { email: identifier.trim() };
      await api.otpRequest({ purpose, ...ch });
      setOtpChannel(ch);
    } catch (err) {
      setError(err.message || 'Unable to dispatch OTP. Please check your email or sign up.');
    } finally {
      setBusy(false);
    }
  };

  const confirmRecovery = async (code) => {
    setBusy(true);
    setError(null);
    try {
      await api.recoveryConfirm({ ...otpChannel, code, newPassword });
      setRecovered(true);
      setMode('password');
      setOtpChannel(null);
      setPassword(newPassword);
    } catch (err) {
      setError(err.message || 'Invalid recovery code.');
    } finally {
      setBusy(false);
    }
  };

  // If in OTP mode and code was dispatched, render VerifyOtpPage inline
  if (otpChannel) {
    return (
      <AuthLayout subtitle="Care Portal" returnTo="/">
        <VerifyOtpPage
          channel={otpChannel}
          purpose={mode === 'recovery' ? 'recovery' : 'login'}
          onVerified={done}
          onVerifyCode={mode === 'recovery' ? confirmRecovery : undefined}
          onBack={() => setOtpChannel(null)}
          isEmbedded={true}
        />
      </AuthLayout>
    );
  }

  // Content from CMS
  const trustBadge = cms['auth.login.badge']?.body_en || 'AayuYukthi Family Access • Secure Care Portal';
  const trustTitle = cms['auth.login.title']?.body_en || 'Your family’s trusted companion through every hospital visit.';
  const trustDesc = cms['auth.login.description']?.body_en || 'Access your active care requests, review hospital visit milestones in real time, and coordinate dedicated support for your parents or loved ones.';

  const features = [
    {
      icon: cms['auth.login.feature_1']?.icon || 'timeline',
      title: cms['auth.login.feature_1']?.title_en || 'Live Milestone Tracking',
      desc: cms['auth.login.feature_1']?.body_en || 'Real-time updates during doctor consults, diagnostic scans, and medication dispensing.',
    },
    {
      icon: cms['auth.login.feature_2']?.icon || 'badge',
      title: cms['auth.login.feature_2']?.title_en || 'Verified Dedicated Companions',
      desc: cms['auth.login.feature_2']?.body_en || 'Police-vetted, empathetic coordinators offering bedside presence, wheelchair navigation, and patient advocacy.',
    },
    {
      icon: cms['auth.login.feature_3']?.icon || 'folder_special',
      title: cms['auth.login.feature_3']?.title_en || 'Encrypted Health Dossiers',
      desc: cms['auth.login.feature_3']?.body_en || 'Instant digital access to clean discharge summaries, itemized bills, doctor prescriptions, and laboratory slips.',
    },
  ];

  const testimonial = {
    rating: 5,
    quote: cms['auth.login.testimonial_quote']?.body_en || '“Having AayuYukthi by my mother’s side at Varma Hospitals in Bhimavaram while I was away gave our family complete peace of mind. Every prescription note was shared within minutes.”',
    author: cms['auth.login.testimonial_author']?.body_en || '— Ramesh V., Bhimavaram',
    detail: cms['auth.login.testimonial_detail']?.body_en || 'Elder Care Service • 2025',
  };

  const sslText = cms['auth.compliance.ssl']?.body_en || '256-bit SSL Protected';
  const privacyText = cms['auth.compliance.privacy']?.body_en || 'ISO 27001 Certified Indian Health Data Privacy';

  return (
    <AuthLayout subtitle="Care Portal" returnTo="/">
      <div className="ay-auth-grid">
        {/* Left Side: Brand Story & Trust Panel */}
        <AuthTrustPanel
          theme="teal"
          badgeIcon="verified_user"
          badgeText={trustBadge}
          heading={trustTitle}
          description={trustDesc}
          features={features}
          testimonial={testimonial}
        />

        {/* Right Side: Customer Authentication Card */}
        <section className="ay-auth-card" aria-label="Customer sign in">
          {/* Header Area */}
          <div className="ay-auth-card-header">
            <div className="ay-auth-badge-row">
              <span className="ay-auth-eyebrow">Care Journey Access</span>
              <span className="ay-auth-live-pill">
                <span className="ay-live-dot" />
                <span>Live System</span>
              </span>
            </div>
            <h2 className="ay-auth-card-title">Welcome back</h2>
            <p className="ay-auth-card-desc">
              Sign in to coordinate upcoming hospital visits and monitor care status.
            </p>
          </div>

          {/* Segmented Auth Mode Tabs */}
          <div className="ay-auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'password'}
              className={`ay-auth-tab-btn ${mode === 'password' ? 'active' : ''}`}
              onClick={() => {
                setMode('password');
                setError(null);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>Password</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'otp'}
              className={`ay-auth-tab-btn ${mode === 'otp' ? 'active' : ''}`}
              onClick={() => {
                setMode('otp');
                setError(null);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Instant OTP via Email</span>
            </button>
          </div>

          {sessionExpired && !error && (
            <div className="ay-auth-alert" role="status" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Your session has expired. Please sign in to continue.</span>
            </div>
          )}

          {error && (
            <div className="ay-auth-alert ay-auth-alert-error" role="alert">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {recovered && (
            <div className="ay-auth-alert ay-auth-alert-success" role="status">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Your password has been updated. Please sign in with your new password.</span>
            </div>
          )}

          {/* PASSWORD MODE */}
          {mode === 'password' && (
            <form onSubmit={submitPassword} className="ay-auth-form">
              <div className="ay-form-group">
                <label className="ay-form-label" htmlFor="user-identity">
                  <span>Email Address</span>
                  <span className="ay-form-hint">Registered with patient ID</span>
                </label>
                <div className="ay-input-wrapper">
                  <div className="ay-input-icon">
                    <span className="material-symbols-outlined text-[20px]">person_outline</span>
                  </div>
                  <input
                    id="user-identity"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="e.g. anand@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="ay-auth-input"
                  />
                </div>
              </div>

              <div className="ay-form-group">
                <div className="ay-form-label">
                  <label htmlFor="user-password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery');
                      setError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ay-auth-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="ay-input-wrapper">
                  <div className="ay-input-icon">
                    <span className="material-symbols-outlined text-[20px]">lock_open</span>
                  </div>
                  <input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your confidential password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ay-auth-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="ay-input-toggle-btn"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember me row */}
              <div className="ay-auth-extra-row">
                <label className="ay-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="ay-checkbox"
                  />
                  <span>Remember this device for 30 days</span>
                </label>
                <div className="ay-safe-badge" title="Encrypted device session identifier">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Safe Session</span>
                </div>
              </div>

              {/* Primary CTA */}
              <button type="submit" disabled={busy} className="ay-auth-btn-primary">
                <span>{busy ? 'Authenticating Session…' : 'Sign In to Care Portal'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          )}

          {/* OTP REQUEST MODE */}
          {mode === 'otp' && (
            <form onSubmit={(e) => startOtp('login', e)} className="ay-auth-form">
              <div className="ay-form-group">
                <label className="ay-form-label" htmlFor="otp-email">
                  <span>Registered Email Address</span>
                  <span className="ay-form-hint">Real 6-digit code via Resend</span>
                </label>
                <div className="ay-input-wrapper">
                  <div className="ay-input-icon">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    id="otp-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="e.g. anand@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="ay-auth-input"
                  />
                </div>
              </div>

              <button type="submit" disabled={busy} className="ay-auth-btn-primary">
                <span>{busy ? 'Dispatching Passcode…' : 'Send Real Email Passcode'}</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          )}

          {/* RECOVERY MODE */}
          {mode === 'recovery' && (
            <form onSubmit={(e) => startOtp('recovery', e)} className="ay-auth-form">
              <div className="ay-form-group">
                <label className="ay-form-label" htmlFor="rec-email">
                  <span>Account Email</span>
                </label>
                <div className="ay-input-wrapper">
                  <div className="ay-input-icon">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    id="rec-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your registered email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="ay-auth-input"
                  />
                </div>
              </div>

              <div className="ay-form-group">
                <label className="ay-form-label" htmlFor="rec-new-password">
                  <span>New Password (Min. 8 characters)</span>
                </label>
                <div className="ay-input-wrapper">
                  <div className="ay-input-icon">
                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                  </div>
                  <input
                    id="rec-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Enter your new secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="ay-auth-input"
                  />
                </div>
              </div>

              <button type="submit" disabled={busy} className="ay-auth-btn-primary">
                <span>{busy ? 'Sending Reset Code…' : 'Send Reset Code to Email'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setError(null);
                }}
                className="ay-auth-btn-secondary"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="ay-auth-divider">
            <span className="ay-auth-divider-text">or continue with</span>
          </div>

          {/* Quick OTP Alternative CTA */}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'otp' ? 'password' : 'otp');
              setError(null);
            }}
            className="ay-auth-btn-secondary"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--ay-auth-secondary)' }}>
              {mode === 'otp' ? 'key' : 'phonelink_ring'}
            </span>
            <span>{mode === 'otp' ? 'Sign in with Password' : 'Sign in with One-Time Password (OTP)'}</span>
          </button>

          {/* Registration Link Footer */}
          <div className="ay-auth-register-callout">
            <div className="ay-auth-register-text">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--ay-auth-tertiary-container)' }}>
                family_restroom
              </span>
              <span>New to AayuYukthi family care?</span>
            </div>
            <Link to="/signup" className="ay-auth-register-link">
              <span>Create a family account</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          {/* Compliance & Security Assurance Badge */}
          <AuthComplianceBadges sslText={sslText} privacyText={privacyText} />
        </section>
      </div>
    </AuthLayout>
  );
}
