import React from 'react';

export function AboutContrast({ cms = {} }) {
  const badge = cms['about.contrast.badge'] || 'Transforming the Visit';
  const title = cms['about.contrast.title'] || 'A Clear Contrast in Patient Care';
  const sub =
    cms['about.contrast.sub'] ||
    'See the tangible operational shift between visiting high-volume hospital facilities alone versus having an AayuYukthi companion coordinator.';

  const traditionalPoints = [
    'Getting lost in big, crowded hospital buildings trying to find the right room or doctor.',
    'Standing in long, tiring lines for tokens, registration, billing, and lab tests while unwell.',
    'Family members far away worrying and having to call repeatedly to find out what is happening.',
    'Confusion over test papers, pharmacy counters, and complicated discharge instructions.',
    'Struggling alone to find a wheelchair, climb steep ramps, or get a cab when feeling sick.',
  ];

  const supportedPoints = [
    'A kind, verified companion meets you right at the hospital gate with a wheelchair if needed.',
    'Your companion stands in all the lines while you or your parents rest comfortably in a chair.',
    'Instant live updates sent to your phone: "Doctor meeting started", "Tests done", "Medicines collected".',
    'Help carrying all files, lab slips, bills, and collecting medicines from the pharmacy.',
    'Safe escort back to your car or cab, making sure you are safely on your way home.',
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
                  <h3 className="ay-about-contrast-title">Visiting Hospital Alone</h3>
                  <p className="ay-about-contrast-sub">The stressful and exhausting way</p>
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
              Outcome: Tiredness, confusion, and high stress for both patient and family.
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
                    With an AayuYukthi Companion
                  </h3>
                  <p className="ay-about-contrast-sub">Personal assistance, comfort &amp; peace of mind</p>
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
              Outcome: Dignity, rest, zero queue fatigue, and total peace of mind for loved ones.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
