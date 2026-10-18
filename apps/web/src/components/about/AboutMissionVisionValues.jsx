import React from 'react';

export function AboutMissionVisionValues({ cms = {} }) {
  const missionBadge = cms['about.mission.badge'] || 'OUR PROMISE';
  const missionTitle =
    cms['about.mission.title'] ||
    'Making sure no elder or patient has to face a hospital visit alone.';
  const missionBody =
    cms['about.mission.body'] ||
    'We ensure every person, especially elderly parents, has a caring, respectful companion standing beside them from the hospital entrance until they return home safely.';

  const visionBadge = cms['about.vision.badge'] || 'OUR GOAL';
  const visionTitle =
    cms['about.vision.title'] ||
    'A world where hospital visits are calm, respectful, and free of anxiety.';
  const visionBody =
    cms['about.vision.body'] ||
    'We want every family in India to have complete peace of mind, knowing their loved ones are accompanied with warmth, honesty, and continuous care.';

  const valuesBadge = cms['about.values.badge'] || 'How We Care';
  const valuesTitle = cms['about.values.title'] || 'Our Six Core Commitments';
  const valuesSub =
    cms['about.values.sub'] ||
    'The clear promises our care companions follow every single day for your family.';

  const valuesList = [
    {
      num: '1',
      icon: 'favorite',
      title: '1. Caring Like Family',
      desc: 'Treating your mother, father, or relatives with the same gentleness, patience, and warmth as our own family.',
    },
    {
      num: '2',
      icon: 'verified_user',
      title: '2. 100% Honest & Verified',
      desc: 'All companions undergo identity and police background checks. Our loyalty is strictly to you and your patient’s comfort.',
    },
    {
      num: '3',
      icon: 'alarm_on',
      title: '3. Always On Time',
      desc: 'We arrive at the hospital gate before you do, so you or your parents never have to wait unattended.',
    },
    {
      num: '4',
      icon: 'accessibility_new',
      title: '4. Deep Respect for Seniors',
      desc: 'We listen attentively, assist with clean wheelchairs, and never rush elderly patients through crowded corridors.',
    },
    {
      num: '5',
      icon: 'translate',
      title: '5. Speaking Your Language',
      desc: 'Comfortable communication in Telugu, English, or Hindi so there is never any hesitation or confusion.',
    },
    {
      num: '6',
      icon: 'receipt_long',
      title: '6. Zero Commissions',
      desc: 'Completely independent support. We never accept cuts or referral fees from doctors, clinics, or pharmacies.',
    },
  ];

  return (
    <section className="ay-about-values-section">
      <div className="pub-container">
        {/* Mission / Vision Row */}
        <div className="ay-about-mv-grid">
          {/* Mission Card */}
          <div className="ay-about-mission-card">
            <div>
              <div className="ay-about-card-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
                <span>{missionBadge}</span>
              </div>
              <h3 className="ay-about-mv-title">{missionTitle}</h3>
              <p className="ay-about-mv-desc">{missionBody}</p>
            </div>

            <div className="ay-about-card-footer">
              <span>Warm care for your family</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </div>
          </div>

          {/* Vision Card */}
          <div className="ay-about-vision-card">
            <div>
              <div className="ay-about-card-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                <span>{visionBadge}</span>
              </div>
              <h3 className="ay-about-mv-title">{visionTitle}</h3>
              <p className="ay-about-mv-desc">{visionBody}</p>
            </div>

            <div className="ay-about-card-footer">
              <span>Peace of mind across distances</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </div>
          </div>
        </div>

        {/* 6 Commitments Header */}
        <div className="ay-about-values-header">
          <span className="ay-about-section-badge">{valuesBadge}</span>
          <h2 className="ay-about-section-h2">{valuesTitle}</h2>
          <p className="ay-about-paragraph" style={{ marginTop: '0.5rem' }}>{valuesSub}</p>
        </div>

        {/* 6 Commitments Grid */}
        <div className="ay-about-values-grid">
          {valuesList.map((val, idx) => (
            <div key={idx} className="ay-about-value-card">
              <div className="ay-about-value-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>{val.icon}</span>
              </div>
              <h4 className="ay-about-value-title">{val.title}</h4>
              <p className="ay-about-value-desc">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
