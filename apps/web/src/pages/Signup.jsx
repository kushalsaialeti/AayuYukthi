import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { useCustomerAuth } from '../auth.jsx';
import { AuthLayout, useAuthCms } from '../components/auth/AuthLayout.jsx';
import { AuthTrustPanel } from '../components/auth/AuthTrustPanel.jsx';
import { StepTracker } from '../components/auth/StepTracker.jsx';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter.jsx';
import { VerifyOtpPage } from './VerifyOtp.jsx';

export function Signup() {
  const { persist } = useCustomerAuth();
  const navigate = useNavigate();
  const cms = useAuthCms();

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [signupChannel, setSignupChannel] = useState(null);

  const submitDetails = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!emailAddress.trim()) {
      setError('A valid email address is required for verification.');
      return;
    }

    setBusy(true);
    setError(null);
    track('SIGNUP_STARTED');

    const formattedPhone = mobileNumber.trim()
      ? (mobileNumber.startsWith('+') ? mobileNumber.trim() : `+91${mobileNumber.replace(/\D/g, '')}`)
      : null;

    try {
      await api.signup({
        full_name: fullName.trim(),
        email: emailAddress.trim().toLowerCase(),
        phone_e164: formattedPhone,
        password: password || null,
      });

      const channel = { email: emailAddress.trim().toLowerCase() };
      setSignupChannel(channel);
      setStep('otp');
    } catch (err) {
      const msg = err.fieldErrors
        ? Object.values(err.fieldErrors).join(' ')
        : err.message || 'Unable to register account. Please verify your details.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onVerified = (data) => {
    persist(data);
    navigate('/onboarding', { replace: true });
  };

  if (step === 'otp' && signupChannel) {
    return (
      <AuthLayout subtitle="Care Portal" returnTo="/">
        <VerifyOtpPage
          channel={signupChannel}
          purpose="signup"
          step={2}
          onVerified={onVerified}
          onBack={() => setStep('details')}
          isEmbedded={true}
        />
      </AuthLayout>
    );
  }

  // Content from CMS
  const trustBadge = cms['auth.signup.badge']?.body_en || 'Family Caregiver Network';
  const trustTitle = cms['auth.signup.title']?.body_en || 'You don\'t have to navigate hospital corridors alone.';
  const trustDesc = cms['auth.signup.description']?.body_en || 'Whether you are managing care from another city or balancing a demanding workday, AayuYukthi bridges the physical gap. We ensure your elderly parents are accompanied with dignity, gentleness, and clear real-time communication.';

  const features = [
    {
      icon: cms['auth.signup.feature_1']?.icon || 'handshake',
      title: cms['auth.signup.feature_1']?.title_en || 'Vetted Companions at Gate 1',
      desc: cms['auth.signup.feature_1']?.body_en || 'Trained care coordinators meet parents directly at entry points with pre-arranged wheelchair transit.',
    },
    {
      icon: cms['auth.signup.feature_2']?.icon || 'notifications_active',
      title: cms['auth.signup.feature_2']?.title_en || 'Live Consultation Telemetry',
      desc: cms['auth.signup.feature_2']?.body_en || 'Direct milestone updates as doctors prescribe medication, diagnostic tests commence, and vitals register.',
    },
    {
      icon: cms['auth.signup.feature_3']?.icon || 'family_restroom',
      title: cms['auth.signup.feature_3']?.title_en || 'Peace Across Distances',
      desc: cms['auth.signup.feature_3']?.body_en || 'Full digital summaries, prescription pickups, and secure escort back into safe home transportation.',
    },
  ];

  const socialProof = {
    title: cms['auth.signup.social_proof_title']?.body_en || 'Trusted by 4,000+ Families',
    cities: cms['auth.signup.social_proof_cities']?.body_en || 'Bhimavaram & Surrounding Regions',
    quote: cms['auth.signup.social_proof_quote']?.body_en || '“Being away while Dad had his cardiology workups in Bhimavaram was stressful until we set up AayuYukthi. The companion was attentive, punctual, and gentle.”',
  };

  return (
    <AuthLayout subtitle="Care Portal" returnTo="/">
      {/* 4-Step Progress Tracker */}
      <StepTracker currentStep={1} />

      <div className="ay-auth-grid">
        {/* Left Column: Empathetic Guidance & Trust Credentials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AuthTrustPanel
            theme="white"
            badgeIcon="verified_user"
            badgeText={trustBadge}
            heading={trustTitle}
            description={trustDesc}
            features={features}
            socialProof={socialProof}
          />

          {/* Trust Credentials List */}
          <div
            style={{
              background: 'var(--ay-auth-surface-low)',
              borderRadius: '12px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--ay-auth-on-surface-variant)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--ay-auth-primary)' }}>
                security
              </span>
              <span>HIPAA & DISHA Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--ay-auth-primary)' }}>
                verified
              </span>
              <span>Police Verified Companions</span>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form Card */}
        <section className="ay-auth-card" aria-label="Create your AayuYukthi account">
          <div className="ay-auth-card-header">
            <span className="ay-auth-eyebrow">New Care Account</span>
            <h2 className="ay-auth-card-title">Create your AayuYukthi account</h2>
            <p className="ay-auth-card-desc">
              Set up your family profile to book companions, coordinate appointments, and receive visit summaries.
            </p>
          </div>

          {error && (
            <div className="ay-auth-alert ay-auth-alert-error" role="alert">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submitDetails} className="ay-auth-form" id="registrationForm">
            {/* Full Name */}
            <div className="ay-form-group">
              <label className="ay-form-label" htmlFor="fullName">
                <span>Full Name</span>
                <span className="ay-form-hint">Primary Caregiver</span>
              </label>
              <div className="ay-input-wrapper">
                <div className="ay-input-icon">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Anand Murthy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="ay-auth-input"
                />
              </div>
            </div>

            {/* Email & Mobile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Email Address */}
              <div className="ay-form-group">
                <label className="ay-form-label" htmlFor="emailAddress">
                  <span>Email Address</span>
                </label>
                <div className="ay-input-wrapper">
                  <div className="ay-input-icon">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    id="emailAddress"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="anand@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="ay-auth-input"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="ay-form-group">
                <label className="ay-form-label" htmlFor="mobileNumber">
                  <span>Mobile Number</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div
                    style={{
                      background: 'var(--ay-auth-surface-low)',
                      border: '1px solid var(--ay-auth-outline-variant)',
                      borderRadius: '10px',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--ay-auth-on-surface)',
                      flexShrink: 0,
                    }}
                  >
                    🇮🇳 +91
                  </div>
                  <input
                    id="mobileNumber"
                    type="tel"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="ay-auth-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* City Dropdown */}
            <div className="ay-form-group">
              <label className="ay-form-label" htmlFor="citySelect">
                <span>City of Residence</span>
              </label>
              <div className="ay-input-wrapper">
                <div className="ay-input-icon">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <select
                  id="citySelect"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="ay-auth-input"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Select your operational city</option>
                  <option value="Bhimavaram">Bhimavaram (Andhra Pradesh)</option>
                  <option value="Surrounding West Godavari">Surrounding West Godavari</option>
                  <option value="Other">Other Region</option>
                </select>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--ay-auth-outline)' }}
                >
                  expand_more
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div className="ay-form-group">
              <div className="ay-form-label">
                <label htmlFor="signupPassword">Create Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ay-auth-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="ay-input-wrapper">
                <div className="ay-input-icon">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="signupPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ay-auth-input"
                />
              </div>

              {/* Password Strength Evaluation Module */}
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Agreement Checkbox */}
            <div style={{ paddingTop: '6px' }}>
              <label className="ay-checkbox-label" style={{ alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="ay-checkbox"
                  style={{ marginTop: '3px' }}
                />
                <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ay-auth-on-surface-variant)' }}>
                  I agree to the <Link to="/about" style={{ color: 'var(--ay-auth-primary)', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link>,{' '}
                  <Link to="/about" style={{ color: 'var(--ay-auth-primary)', fontWeight: 600, textDecoration: 'underline' }}>Patient Privacy Policy</Link>, and understand that AayuYukthi delivers non-clinical care accompaniment and transit assistance.
                </span>
              </label>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={busy}
              className="ay-auth-btn-primary"
              style={{ marginTop: '8px' }}
            >
              <span>{busy ? 'Creating Account…' : 'Continue to Email Verification'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>

            {/* Secondary Link */}
            <div style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--ay-auth-on-surface-variant)', paddingTop: '4px' }}>
              <span>Already have an account? </span>
              <Link to="/login" style={{ color: 'var(--ay-auth-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </form>
        </section>
      </div>
    </AuthLayout>
  );
}
