import React from 'react';
import { Link } from 'react-router-dom';

export function AboutCta({ cms = {} }) {
  const badge = cms['about.cta.badge'] || 'WE ARE STANDING BY 7 DAYS A WEEK';
  const title = cms['about.cta.title'] || 'Experience peaceful healthcare accompaniment.';
  const body =
    cms['about.cta.body'] ||
    'Book a dedicated care companion for your parents or loved ones. Same-day urgent and scheduled outpatient slots available across all partner hubs.';

  const primaryLabel = cms['about.cta.primary_label'] || 'Request Care Now';
  const primaryUrl = cms['about.cta.primary_url'] || '/request-care';
  const secondaryLabel = cms['about.cta.secondary_label'] || 'Speak with a Counselor';
  const secondaryUrl = cms['about.cta.secondary_url'] || 'tel:180022982273';

  const disclaimer =
    cms['about.cta.disclaimer'] ||
    'Mandatory Non-Clinical Notice: AayuYukthi provides care coordination, logistical assistance, and patient advocacy. We are not a hospital, clinical medical provider, or emergency service. All medical choices, diagnosis, and treatment protocols remain strictly between licensed doctors and the patient.';

  return (
    <section className="ay-about-cta-section">
      <div className="pub-container">
        {/* High Impact Conversion Strip */}
        <div className="ay-about-cta-banner">
          <div className="ay-about-cta-content">
            <div className="ay-about-cta-text">
              <div className="ay-about-cta-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>support_agent</span>
                <span>{badge}</span>
              </div>
              <h3 className="ay-about-cta-h3">{title}</h3>
              <p className="ay-about-cta-sub">{body}</p>
            </div>

            <div className="ay-about-cta-buttons">
              <Link to={primaryUrl} className="ay-about-cta-btn-white">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment</span>
                <span>{primaryLabel}</span>
              </Link>
              <a href={secondaryUrl} className="ay-about-cta-btn-outline">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>headset_mic</span>
                <span>{secondaryLabel}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mandatory Non-Clinical Notice */}
        <div className="ay-about-disclaimer-box">
          <span className="material-symbols-outlined">info</span>
          <span>
            <strong style={{ color: 'var(--pub-on-surface, #191c1c)' }}>Mandatory Non-Clinical Notice: </strong>
            {disclaimer.replace(/^Mandatory Non-Clinical Notice:\s*/i, '')}
          </span>
        </div>
      </div>
    </section>
  );
}
