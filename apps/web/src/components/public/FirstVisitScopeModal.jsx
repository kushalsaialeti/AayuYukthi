import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * FirstVisitScopeModal — Layover dialog displayed on the user's first visit or first refresh.
 * Explains clearly what AayuYukthi does NOT offer (non-emergency, no service for mentally disabled/unattended children),
 * and requires ticking a checkbox accepting privacy policy & terms before proceeding.
 * Persisted in localStorage so it only shows on first visit / refresh.
 */
export function FirstVisitScopeModal({ forceOpen = false, onClose }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    try {
      const accepted = localStorage.getItem('aayuyukthi_scope_v1_accepted');
      if (!accepted) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [forceOpen]);

  const handleAccept = () => {
    if (!agreed) return;
    try {
      localStorage.setItem('aayuyukthi_scope_v1_accepted', 'true');
      localStorage.setItem('aayuyukthi_scope_accepted_at', new Date().toISOString());
    } catch {}
    setOpen(false);
    if (onClose) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="pub-modal-backdrop first-visit-layover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scope-modal-title"
    >
      <div className="pub-modal-content first-visit-modal-content">
        {/* Header */}
        <div className="first-visit-modal-head">
          <div className="first-visit-badge">
            <span className="material-symbols-outlined icon-shield">health_and_safety</span>
            <span>MANDATORY SERVICE SCOPE DISCLOSURE</span>
          </div>
          <h2 id="scope-modal-title" className="first-visit-modal-title">
            Important Service Scope &amp; Eligibility Notice
          </h2>
          <p className="first-visit-modal-sub">
            Please review what AayuYukthi offers and <strong>does NOT offer</strong> before booking hospital accompaniment.
          </p>
        </div>

        {/* Scope Disclosures (What we do NOT offer) */}
        <div className="first-visit-modal-body">
          <div className="scope-callout-card alert">
            <div className="scope-icon-tile">
              <span className="material-symbols-outlined">emergency</span>
            </div>
            <div className="scope-text">
              <strong>Service is NOT an Emergency 24/7 Ambulance Service</strong>
              <p>
                AayuYukthi provides scheduled outpatient coordination and patient companion accompaniment. We are <strong>not an emergency response service (EMS), ICU transit, or 24/7 casualty provider</strong>. For life-threatening medical emergencies, dial <strong>108</strong> or <strong>112</strong> immediately.
              </p>
            </div>
          </div>

          <div className="scope-callout-card warning">
            <div className="scope-icon-tile">
              <span className="material-symbols-outlined">person_off</span>
            </div>
            <div className="scope-text">
              <strong>Service is NOT Allowed for Mentally Disabled Persons or Unattended Children</strong>
              <p>
                For clinical safety and patient advocacy ethics, our care companions are <strong>strictly not permitted to escort individuals with severe psychiatric or mental disabilities, or unattended children</strong> requiring clinical psychiatric supervision.
              </p>
            </div>
          </div>

          <div className="scope-callout-card info">
            <div className="scope-icon-tile">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div className="scope-text">
              <strong>Non-Clinical Companion &amp; Doorstep Logistics Only</strong>
              <p>
                Our companions assist with doorstep pickup, OPD navigation, wheelchair transit, prescription collection, and live family updates. All clinical diagnoses and treatment decisions remain exclusively between the doctor and patient.
              </p>
            </div>
          </div>
        </div>

        {/* Checkbox Agreement & Action */}
        <div className="first-visit-modal-footer">
          <label className="first-visit-agreement-label">
            <input
              type="checkbox"
              id="scope-agree-checkbox"
              className="first-visit-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="first-visit-checkbox-text">
              I have read, understand, and agree to the service restrictions above. I accept the{' '}
              <Link to="/contact" target="_blank" rel="noopener noreferrer" className="first-visit-link">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/how-it-works" target="_blank" rel="noopener noreferrer" className="first-visit-link">
                Terms of Service
              </Link>
              .
            </span>
          </label>

          <button
            type="button"
            disabled={!agreed}
            className={`first-visit-submit-btn ${agreed ? 'is-enabled' : 'is-disabled'}`}
            onClick={handleAccept}
          >
            <span>I Understand &amp; Accept — Continue</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
