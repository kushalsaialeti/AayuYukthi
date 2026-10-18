import React from 'react';


export function AboutLeadership({ cms = {} }) {
  const badge = cms['about.leadership.badge'] || 'Companion Standards';
  const title = cms['about.leadership.title'] || 'How We Choose & Train Every Companion';
  const sub =
    cms['about.leadership.sub'] ||
    'Your family’s safety and comfort come first. Every person who wears an AayuYukthi badge goes through thorough verification and hands-on training before assisting you.';

  const standards = [
    {
      icon: 'verified_user',
      title: 'Police & Identity Verification',
      desc: 'Government photo ID, local address verification, and background checks are mandatory before any companion joins our team.',
    },
    {
      icon: 'accessible_forward',
      title: 'Elder Mobility & Wheelchair Care',
      desc: 'Trained to gently assist seniors with walking, using wheelchairs, navigating steep hospital ramps, and taking elevator rides safely.',
    },
    {
      icon: 'translate',
      title: 'Speaks Your Local Language',
      desc: 'Our companions speak your mother tongue fluently (Telugu, Hindi, Tamil, Kannada, English) so elders can communicate comfortably without fear.',
    },
    {
      icon: 'shield_locked',
      title: 'Zero Commissions, 100% Honest',
      desc: 'We never take cuts or commissions from doctors, labs, or pharmacies. Our only job is supporting and protecting your family.',
    },
  ];

  return (
    <section className="ay-about-leadership-section">
      <div className="pub-container">
        <div className="ay-about-leadership-header">
          <div>
            <span className="ay-about-section-badge">{badge}</span>
            <h2 className="ay-about-section-h2">{title}</h2>
          </div>
          <p className="ay-about-paragraph" style={{ maxWidth: '32rem', margin: 0 }}>
            {sub}
          </p>
        </div>

        <div className="ay-about-standards-grid">
          {standards.map((item, idx) => (
            <div key={idx} className="ay-about-standard-card">
              <div className="ay-about-standard-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  {item.icon}
                </span>
              </div>
              <h3 className="ay-about-standard-title">{item.title}</h3>
              <p className="ay-about-standard-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
