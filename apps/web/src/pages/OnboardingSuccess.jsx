import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta } from '../components/layout.jsx';
import './onboarding-success.css';

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Number.isNaN(age) || age < 0 ? null : age;
}

const AVATAR_PRESETS = {
  mother:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6sp8k8cmMPBfnukguURh_AJz3i-Jj4AofgyvjIq-150i_A3cmZEAYN-swTi7neusLr-UlQ90wYc4BwJ0OEroAntufio4sd00_thLCM5q3H7GhBBppmIpJgZ9QPGMAvBlSENCaKULBhlBjrj0y8Wql2WMu0I0xGpNpvWm22fERVLAGxpBz_H8tEj8Kni4Kxuuu5Rb23U-I_u38rfEBBIL-Kt0OLxIQPTy_R7_0iWXVsrKyk2DlIN8',
  father:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDvnlgvnxSkTutuNQtR3vVmKoUTF12qZglQXpaQxySjfCAaa7sedcTcwJRQqIn-5X-r2JVQCKt_SAo2gRfKSn7RfOhFkbYnObN9jE1z3U2AkF2GxT8bIUre-r-PIt2GYF8VRO50keZ2fYR1dRkj6TMWk9E-64cwUM76tubF0BTeAG9Nxd6N-PEv9EHtBUqWWQm3mkvtemTjsHSkPftOBHiFVybP2sEGH3WJ_ms8T275bc6l1D8lk4g',
  female:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDiqqIFmNiXAWNFjnw9vaupT5yyikS7P6IttIlqfc8z92pULyZGxTmK7V8f8zkTXVOTRbOb-fnW-u-J_3UY1ZIfqlIifVxTLLVsGXAcJ2J6foyODjkdKZ1EwH3nqXU52ja6xwWz9e-CePkyZCHWnYz6ey9shgZ-DgFcTf7_wZZcTV0fGZkaaBJMADVjsLzdnTdZsuPQkZ8w2lSqDATmcjFT4HNbV7948MZdNqAPPudCAPrc7PHLpCM',
  default:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
};

function getRecipientAvatar(recipient) {
  if (recipient?.image_url) return recipient.image_url;
  const rel = (recipient?.relationship || '').toLowerCase();
  const gen = (recipient?.gender || '').toLowerCase();
  if (rel.includes('mother') || rel.includes('mom')) return AVATAR_PRESETS.mother;
  if (rel.includes('father') || rel.includes('dad')) return AVATAR_PRESETS.father;
  if (gen === 'female' || rel.includes('wife') || rel.includes('sister')) return AVATAR_PRESETS.female;
  if (gen === 'male' || rel.includes('husband') || rel.includes('brother')) return AVATAR_PRESETS.father;
  return AVATAR_PRESETS.default;
}

export function OnboardingSuccess({ user: propUser, recipient: propRecipient }) {
  const { user: authUser } = useCustomerAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || authUser || null);
  const [recipient, setRecipient] = useState(propRecipient || null);
  const [contact, setContact] = useState(null);

  useDocumentMeta('Account Activated', 'Your AayuYukthi family care coordination is active.');

  useEffect(() => {
    // If not provided, fetch live user and recipient
    if (!user || !recipient) {
      Promise.all([
        api.me().catch(() => null),
        api.recipients({ limit: 1 }).catch(() => ({ data: [] })),
        api.contact().catch(() => null),
      ]).then(([meData, recData, contactData]) => {
        if (meData) setUser(meData);
        if (recData?.data?.[0]) setRecipient(recData.data[0]);
        if (contactData) setContact(contactData);
      });
    }
  }, []);

  const userName = user?.full_name ? user.full_name.split(' ')[0] : 'Family Member';
  const recipientName = recipient?.full_name || 'Care Recipient';
  const recipientAge = calculateAge(recipient?.date_of_birth);
  const recipientAgeText = recipientAge !== null ? `${recipientAge} yrs` : '';
  const avatarSrc = getRecipientAvatar(recipient);
  const helplinePhone = contact?.phone || '1800-AAYU-CARE';

  return (
    <main className="os-main">
      <div className="os-wrapper">
        <div className="os-container">
          {/* Top Celebration Badge */}
          <div className="os-badge">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            <span>Family Care Account Activated</span>
          </div>

          {/* Soft Animated Emblem Graphic */}
          <div className="os-emblem-wrap">
            <div className="os-emblem-glow" />
            <div className="os-emblem-circle">
              <svg
                style={{ width: '2.5rem', height: '2.5rem', color: 'var(--os-primary-fixed)' }}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>

          {/* Hero Titles & Empathy Narrative */}
          <div className="os-narrative">
            <h1 className="os-title">Account successfully created!</h1>
            <p className="os-subtitle">
              Welcome to AayuYukthi family care coordination,{' '}
              <strong style={{ color: 'var(--os-text)', fontWeight: 600 }}>{userName}</strong>.
              Your account and initial care recipient profile for{' '}
              <strong style={{ color: 'var(--os-primary)', fontWeight: 600 }}>
                {recipientName}
              </strong>{' '}
              are ready.
            </p>
          </div>

          {/* Active Profile Snapshot Pill */}
          <div className="os-profile-pill">
            <div className="os-profile-avatar-wrap">
              <div className="os-profile-avatar">
                <img src={avatarSrc} alt={recipientName} />
              </div>
              <div className="os-profile-info">
                <span className="os-profile-label">Primary Recipient</span>
                <span className="os-profile-name">
                  {recipientName} {recipientAgeText ? `(${recipientAgeText})` : ''}
                </span>
              </div>
            </div>
            <div className="os-status-chip">
              <span className="os-status-dot" />
              <span>Standard Support Active</span>
            </div>
          </div>

          {/* Next Steps Visual Card Mosaic */}
          <div style={{ width: '100%', marginBottom: '3rem' }}>
            <div className="os-journey-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--os-secondary)',
                  }}
                >
                  Recommended Journey
                </span>
                <span style={{ color: 'var(--os-outline-variant)' }}>/</span>
                <span style={{ fontSize: '14px', color: 'var(--os-text-variant)' }}>
                  3 quick steps ahead
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'var(--os-surface-container-high)',
                  color: 'var(--os-text-variant)',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '0.25rem',
                }}
              >
                2 min setup
              </span>
            </div>

            <div className="os-journey-cards">
              {/* Step 1 */}
              <Link to="/request-care" className="os-journey-card">
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span className="os-card-step-badge">01</span>
                    <span
                      className="material-symbols-outlined"
                      style={{ color: 'var(--os-primary-container)', fontSize: '24px' }}
                    >
                      local_hospital
                    </span>
                  </div>
                  <h2 className="os-card-title">Ready to visit a hospital?</h2>
                  <p className="os-card-desc">
                    Request care coordinator accompaniment in under 2 minutes. We arrange bedside
                    support and queue handling.
                  </p>
                </div>
                <div className="os-card-action" style={{ color: 'var(--os-primary-container)' }}>
                  <span>Book accompaniment</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Step 2 */}
              <Link to="/app/profile" className="os-journey-card">
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span className="os-card-step-badge">02</span>
                    <span
                      className="material-symbols-outlined"
                      style={{ color: 'var(--os-secondary)', fontSize: '24px' }}
                    >
                      notifications_active
                    </span>
                  </div>
                  <h2 className="os-card-title">Real-Time Updates</h2>
                  <p className="os-card-desc">
                    Receive live WhatsApp and SMS milestone pings from companion arrival to doctor
                    consultation and safe discharge.
                  </p>
                </div>
                <div className="os-card-action" style={{ color: 'var(--os-secondary)' }}>
                  <span>Notification rules</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    chevron_right
                  </span>
                </div>
              </Link>

              {/* Step 3 */}
              <Link to="/app/recipients/new" className="os-journey-card">
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span className="os-card-step-badge">03</span>
                    <span
                      className="material-symbols-outlined"
                      style={{ color: 'var(--os-tertiary)', fontSize: '24px' }}
                    >
                      group_add
                    </span>
                  </div>
                  <h2 className="os-card-title">Manage Family Members</h2>
                  <p className="os-card-desc">
                    Add more parents, in-laws, or relatives anytime directly from your Care Recipients
                    dashboard with one click.
                  </p>
                </div>
                <div className="os-card-action" style={{ color: 'var(--os-tertiary)' }}>
                  <span>Add another profile</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    chevron_right
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Editorial Story Preview / Trust Factor */}
          <div className="os-story-card">
            <div className="os-story-img-wrap">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3n6VuWzv1dfix_LXWb6Rwb9ZqRk-HTD5XowCwKJLXpOkDNvsUjXSEkPe-rY5olEPjWD4qrHyDIHsuS5vmhKt2rxAOcMWgFLu1lN55Di-pQADXo-Wkx6OAUaPiRS9qITHDo6PIP77FoDp9VdES5cUgJ0sdwoLeWqRVa1IWZ4C_90UHtQ480Zp2znGzviwJ0E7mM_vhrXCVHPa_9UFCsWZl50HqL1L_icr8OSAIXwEnUtGH9lQu9eg"
                alt="Certified Care Companion"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--os-primary-container)', fontSize: '18px' }}
                >
                  verified
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--os-primary)',
                    fontWeight: 600,
                  }}
                >
                  Certified Care Companions
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 0.25rem 0',
                  color: 'var(--os-text)',
                }}
              >
                Dignified, unhurried accompaniment.
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--os-text-variant)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Every coordinator is background-verified, CPR-trained, and skilled in navigating
                complex medical campus logistics so your family never feels alone.
              </p>
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="os-actions-row">
            <button
              type="button"
              className="os-btn-primary"
              onClick={() => navigate('/app')}
            >
              <span>Go to Customer Dashboard</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              className="os-btn-secondary"
              onClick={() => navigate('/request-care')}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--os-primary-container)', fontSize: '18px' }}
              >
                calendar_add_on
              </span>
              <span>Request Care Visit</span>
            </button>
          </div>

          {/* Bottom Reassurance & Toll-Free Section */}
          <div className="os-helpline-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--os-secondary-fixed)',
                  color: 'var(--os-on-secondary-fixed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  phone_in_talk
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-text)' }}>
                    {helplinePhone}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'var(--os-secondary-container)',
                      color: 'var(--os-on-secondary-container)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                    }}
                  >
                    Toll-Free
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--os-text-variant)' }}>
                  24/7 Human Helpline &amp; Dispatch Desk
                </span>
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
                borderLeft: '1px solid rgba(191, 200, 201, 0.3)',
                paddingLeft: '1rem',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--os-outline)',
                  display: 'block',
                }}
              >
                Safe Non-Clinical Healthcare
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--os-text-variant)',
                  fontWeight: 500,
                }}
              >
                Logistics &amp; Accompaniment
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
