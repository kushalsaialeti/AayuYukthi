import React from 'react';

export function AboutContrast({ cms = {} }) {
  const badge = cms['about.contrast.badge'] || 'Transforming the Visit';
  const title = cms['about.contrast.title'] || 'A Clear Contrast in Patient Care';
  const sub =
    cms['about.contrast.sub'] ||
    'See the tangible operational shift between visiting high-volume hospital facilities alone versus having an AayuYukthi companion coordinator.';

  const traditionalPoints = [
    'Confusing multi-tower campus navigation leading to missed appointment slots and elevated heart rate.',
    'Exhausting 45-60 minute physical queue standing for registration tokens, billing, and lab paperwork.',
    'Distant family members waiting in dread across town or abroad with zero real-time visibility.',
    'Stressful insurance pre-authorization delays, misplaced diagnostic slips, and rushed discharge instructions.',
    'Heavy physical strain pushing wheelchairs over steep campus ramps and hailing cabs alone while unwell.',
  ];

  const supportedPoints = [
    'Dedicated companion meets you at the arrival porch with a pre-sanitized, smooth-rolling wheelchair.',
    'Physical queueing handled entirely by your companion while the patient rests comfortably in a quiet lounge.',
    'Live WhatsApp & SMS milestone broadcasts: ‘Consult In-Progress’, ‘Blood Drawn’, ‘Medicines Collected’.',
    'Coordinated TPA insurance desk submissions and neatly organized discharge dossier compilation.',
    'Safe door-to-door transit coordination and supportive escort straight into your designated vehicle.',
  ];

  return (
    <section className="ay-about-contrast-section">
      <div className="pub-container">
        <div className="ay-about-contrast-header">
          <span className="ay-about-section-badge">{badge}</span>
          <h2 className="ay-about-section-h2">{title}</h2>
          <p className="ay-about-paragraph" style={{ marginTop: '0.5rem' }}>{sub}</p>
        </div>

        <div className="ay-about-contrast-grid">
          {/* Column A: Traditional */}
          <div className="ay-about-contrast-card">
            <div>
              <div className="ay-about-contrast-card-head">
                <span className="ay-about-contrast-icon-wrap negative">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                </span>
                <div>
                  <h3 className="ay-about-contrast-title">Traditional Hospital Experience</h3>
                  <p className="ay-about-contrast-sub">The exhausting, unguided default</p>
                </div>
              </div>

              <ul className="ay-about-contrast-list">
                {traditionalPoints.map((pt, idx) => (
                  <li key={idx} className="ay-about-contrast-item negative">
                    <span className="material-symbols-outlined">remove_circle_outline</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ay-about-contrast-foot negative">
              Result: Physical exhaustion and emotional strain for both patient &amp; family.
            </div>
          </div>

          {/* Column B: Supported */}
          <div className="ay-about-contrast-card positive">
            <div>
              <div className="ay-about-contrast-card-head">
                <span className="ay-about-contrast-icon-wrap positive">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                </span>
                <div>
                  <h3 className="ay-about-contrast-title" style={{ color: 'var(--pub-primary, #004349)' }}>
                    Supported AayuYukthi Experience
                  </h3>
                  <p className="ay-about-contrast-sub">Continuous accompaniment &amp; systematic relief</p>
                </div>
              </div>

              <ul className="ay-about-contrast-list">
                {supportedPoints.map((pt, idx) => (
                  <li key={idx} className="ay-about-contrast-item positive">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ay-about-contrast-foot positive">
              Result: Dignified comfort, zero administrative burden, total family calm.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
