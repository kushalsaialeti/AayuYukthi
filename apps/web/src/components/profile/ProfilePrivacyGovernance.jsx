import React, { useState } from 'react';

export function ProfilePrivacyGovernance({
  privacySettings = null,
  onSavePrivacy,
}) {
  const [jitAccess, setJitAccess] = useState(privacySettings?.jit_access ?? true);
  const [prescriptionVault, setPrescriptionVault] = useState(privacySettings?.prescription_vault ?? true);
  const [liaisonToken, setLiaisonToken] = useState(privacySettings?.liaison_token ?? true);
  const [twoFaPrompt, setTwoFaPrompt] = useState(false);

  const toggleJit = () => {
    const next = !jitAccess;
    setJitAccess(next);
    if (onSavePrivacy) onSavePrivacy({ jit_access: next, prescription_vault: prescriptionVault, liaison_token: liaisonToken });
  };

  const toggleVault = () => {
    const next = !prescriptionVault;
    setPrescriptionVault(next);
    if (onSavePrivacy) onSavePrivacy({ jit_access: jitAccess, prescription_vault: next, liaison_token: liaisonToken });
  };

  const toggleLiaison = () => {
    const next = !liaisonToken;
    setLiaisonToken(next);
    if (onSavePrivacy) onSavePrivacy({ jit_access: jitAccess, prescription_vault: prescriptionVault, liaison_token: next });
  };

  return (
    <div className="profile-section-card" id="section-privacy">
      {/* Header */}
      <div className="profile-section-header">
        <div className="profile-section-title-group">
          <div className="profile-section-icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>privacy_tip</span>
          </div>
          <div>
            <h3 className="profile-section-title">Privacy & Medical Data Governance</h3>
            <p className="profile-section-desc">Aligned with India Digital Information Security in Healthcare Act (DISHA) & HIPAA.</p>
          </div>
        </div>

        <span className="profile-role-pill">
          AES-256 Vault Active
        </span>
      </div>

      {/* Toggles Strip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.25rem' }}>
        {/* Toggle 1 */}
        <div className="profile-toggle-row" onClick={toggleJit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              Just-in-Time Escort Access
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)', lineHeight: 1.4 }}>
              Share medical directives and UHID only with active assigned companions 12 hours prior to hospital visit.
            </span>
          </div>

          <label className="profile-switch-control" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={jitAccess}
              onChange={toggleJit}
            />
            <span className="profile-switch-slider" />
          </label>
        </div>

        {/* Toggle 2 */}
        <div className="profile-toggle-row" onClick={toggleVault}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              Encrypted Prescription Vault
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)', lineHeight: 1.4 }}>
              Store digital prescription summaries and outpatient discharge tokens in the zero-knowledge caregiver vault.
            </span>
          </div>

          <label className="profile-switch-control" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={prescriptionVault}
              onChange={toggleVault}
            />
            <span className="profile-switch-slider" />
          </label>
        </div>

        {/* Toggle 3 */}
        <div className="profile-toggle-row" onClick={toggleLiaison}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              Central Liaison Desk Token Pre-Registration
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)', lineHeight: 1.4 }}>
              Allow hospital desk coordinators to fast-track queue tokens and bypass physical reception line upon arrival.
            </span>
          </div>

          <label className="profile-switch-control" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={liaisonToken}
              onChange={toggleLiaison}
            />
            <span className="profile-switch-slider" />
          </label>
        </div>
      </div>

      {/* Security Audit Log Snippet & 2FA Action */}
      <div style={{
        marginTop: '0.5rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.75rem',
        backgroundColor: 'var(--cust-surface-container-high, #e6e9e8)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--cust-secondary)' }}>
            history
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              Security Audit Log
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
              Last login from Chrome on Windows • Active authenticated session token
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}>
          <button
            type="button"
            className="profile-btn-outline"
            onClick={() => setTwoFaPrompt(!twoFaPrompt)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem', color: 'var(--cust-primary)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>password</span>
            <span>Two-Factor Authentication Active</span>
          </button>
        </div>
      </div>

      {twoFaPrompt && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          backgroundColor: '#e6f7f2',
          color: 'var(--cust-surface-tint)',
          fontSize: '0.8125rem',
          lineHeight: 1.4,
        }}>
          Two-factor OTP authentication is strictly enforced for your account via verified email and phone number during every sign-in.
        </div>
      )}
    </div>
  );
}
