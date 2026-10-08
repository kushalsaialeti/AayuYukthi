import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useCustomerAuth } from '../auth.jsx';
import { AuthLayout, useAuthCms } from '../components/auth/AuthLayout.jsx';
import { AuthTrustPanel } from '../components/auth/AuthTrustPanel.jsx';
import { OtpDigitInput } from '../components/auth/OtpDigitInput.jsx';
import { StepTracker } from '../components/auth/StepTracker.jsx';

export function VerifyOtpPage({
  channel: initialChannel,
  purpose: initialPurpose,
  onVerified: customOnVerified,
  onVerifyCode,
  onBack: customOnBack,
  isEmbedded = false,
  step = 2,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { persist } = useCustomerAuth();
  const cms = useAuthCms();

  // Retrieve channel and purpose from props, navigation state, or fallback
  const stateChannel = location.state?.channel;
  const statePurpose = location.state?.purpose;

  const channel = initialChannel || stateChannel || { email: '' };
  const purpose = initialPurpose || statePurpose || 'signup';

  const emailDisplay = channel.email || channel.phone_e164 || channel.identifier || 'your registered email';

  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(45);
  const [resendStatus, setResendStatus] = useState(null);
  const [sessionId] = useState(() => `#AY-${Math.floor(1000 + Math.random() * 9000)}`);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verify = async (codeToVerify) => {
    const finalCode = (codeToVerify || code).trim();
    if (finalCode.length !== 6) {
      setError('Please enter the complete 6-digit passcode');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (onVerifyCode) {
        await onVerifyCode(finalCode);
      } else {
        const data = await api.otpVerify({
          purpose,
          ...channel,
          code: finalCode,
        });

        if (customOnVerified) {
          customOnVerified(data);
        } else {
          persist(data);
          if (purpose === 'signup') {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/app', { replace: true });
          }
        }
      }
    } catch (err) {
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
      setError(err.message || 'The passcode you entered is invalid or has expired.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setError(null);
    setResendStatus(null);
    setBusy(true);
    try {
      await api.otpRequest({ purpose, ...channel });
      setResendStatus('A fresh verification code has been dispatched to your email.');
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Unable to dispatch a new passcode. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (customOnBack) {
      customOnBack();
    } else if (purpose === 'signup') {
      navigate('/signup');
    } else {
      navigate('/login');
    }
  };

  // Content from CMS or defaults
  const trustBadge = cms['auth.otp.badge']?.body_en || 'Care Coordination';
  const trustTitle = cms['auth.otp.title']?.body_en || 'Safeguarding your family’s healthcare journey.';
  const trustDesc = cms['auth.otp.description']?.body_en || 'We use two-factor verification to ensure all medical schedules, care recipient details, and live hospital updates remain strictly confidential.';
  const tipText = cms['auth.otp.tip']?.body_en || 'Care coordinators will never ask for your 6-digit passcode over the phone, at hospital gates, or via unsecured links.';
  const coordinatorNote = cms['auth.otp.coordinator_note']?.body_en || 'Assigned Care Coordinator: Rajesh Kumar • Awaiting your authorization for transit check-in';

  const features = [
    {
      icon: cms['auth.otp.feature_1']?.icon || 'mail',
      title: cms['auth.otp.feature_1']?.title_en || 'Instant Real-Email Delivery',
      desc: cms['auth.otp.feature_1']?.body_en || 'Your passcode is dispatched directly to your inbox via Resend.',
    },
    {
      icon: cms['auth.otp.feature_2']?.icon || 'headset_mic',
      title: cms['auth.otp.feature_2']?.title_en || 'Dedicated Support Desk',
      desc: cms['auth.otp.feature_2']?.body_en || 'Live care navigators available 7:00 AM – 9:00 PM IST daily.',
    },
  ];

  const urgentHelp = {
    icon: 'emergency',
    title: 'Need Urgent Transit Assistance?',
    action: 'Call 1800-AAYU-CARE',
    tel: cms['auth.helpline.tel']?.body_en || 'tel:180022982273',
  };

  const content = (
    <>
      {purpose === 'signup' && <StepTracker currentStep={step} />}

      <div className="ay-auth-grid">
        {/* Left Side: Trust & Reassurance Panel */}
        <AuthTrustPanel
          theme="light"
          badgeIcon="shield_with_heart"
          badgeText={trustBadge}
          heading={trustTitle}
          description={trustDesc}
          features={features}
          urgentHelp={urgentHelp}
        />

        {/* Right Side: 6-Digit OTP Verification Card */}
        <section className="ay-auth-card" aria-label="OTP verification form">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ay-auth-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Change email address</span>
              </button>
              <span className="ay-auth-brand-pill" style={{ fontSize: '11px' }}>
                Session ID: {sessionId}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'var(--ay-auth-primary-fixed)',
                  color: 'var(--ay-auth-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  phonelink_lock
                </span>
              </div>
              <div>
                <h2 className="ay-auth-card-title">Verify Care Passcode</h2>
                <p className="ay-auth-card-desc" style={{ marginTop: '4px' }}>
                  Enter the 6-digit code sent to <strong style={{ color: 'var(--ay-auth-on-surface)' }}>{emailDisplay}</strong>.
                </p>
              </div>
            </div>

            {error && (
              <div className="ay-auth-alert ay-auth-alert-error" role="alert" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span style={{ fontWeight: 600 }}>{error}</span>
                </div>
                {remainingAttempts !== null && (
                  <div style={{ marginTop: '6px', fontSize: '12px', paddingLeft: '26px', opacity: 0.9 }}>
                    {remainingAttempts > 0
                      ? `${remainingAttempts} of 4 attempts remaining before passcode is invalidated.`
                      : 'All 4 attempts used. Please request a fresh code.'}
                  </div>
                )}
              </div>
            )}

            {resendStatus && (
              <div className="ay-auth-alert ay-auth-alert-success" role="status" style={{ marginBottom: '16px' }}>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{resendStatus}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
              className="ay-auth-form"
            >
              <div>
                <label className="ay-form-label" style={{ marginBottom: '6px' }}>
                  <span>Security Code (6 Digits)</span>
                </label>
                <OtpDigitInput
                  value={code}
                  onChange={(val) => {
                    setCode(val);
                    setError(null);
                  }}
                  onComplete={(completedCode) => verify(completedCode)}
                  disabled={busy}
                  autoFocus={true}
                />
              </div>

              {/* Countdown & Resend */}
              <div className="ay-otp-timer-box">
                <div className="ay-otp-timer-text">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--ay-auth-primary)' }}>
                    schedule
                  </span>
                  <span>
                    {cooldown > 0 ? (
                      <>
                        Resend code in{' '}
                        <span className="ay-otp-timer-val">
                          00:{cooldown < 10 ? `0${cooldown}` : cooldown}
                        </span>
                      </>
                    ) : (
                      'Didn\'t receive the email?'
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || busy}
                  className="ay-otp-resend-btn"
                >
                  Resend Email Passcode
                </button>
              </div>

              {/* Security Advisory Tip */}
              <div className="ay-otp-tip-box">
                <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--ay-auth-tertiary-container)', flexShrink: 0 }}>
                  info
                </span>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: 'var(--ay-auth-primary)' }}>Tip:</strong> {tipText}
                </p>
              </div>

              {/* Primary Verification CTA */}
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="ay-auth-btn-primary"
              >
                <span>{busy ? 'Verifying Session…' : 'Verify & Proceed to Care Portal'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', paddingTop: '8px' }}>
            <span style={{ fontSize: '13.5px', color: 'var(--ay-auth-on-surface-variant)' }}>
              Didn't receive the email code? Check your spam folder or{' '}
            </span>
            <Link to="/contact" style={{ color: 'var(--ay-auth-primary)', fontWeight: 600, fontSize: '13.5px' }}>
              Contact Care Support Desk
            </Link>
          </div>
        </section>
      </div>

      {/* Assigned Care Coordinator Standby Banner */}
      <div className="ay-coordinator-banner" style={{ marginTop: '32px' }}>
        <div className="ay-coordinator-left">
          <div className="ay-coordinator-avatar">RK</div>
          <div>
            <div className="ay-coordinator-title">Assigned Care Coordinator: Rajesh Kumar</div>
            <div className="ay-coordinator-sub">{coordinatorNote}</div>
          </div>
        </div>
        <div className="ay-coordinator-status-pill">
          <span className="ay-live-dot" style={{ background: '#059669' }} />
          <span>Coordinator On-Standby</span>
        </div>
      </div>
    </>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <AuthLayout subtitle="Care Portal" returnTo="/">
      {content}
    </AuthLayout>
  );
}
