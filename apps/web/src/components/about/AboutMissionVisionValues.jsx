import React from 'react';

export function AboutMissionVisionValues({ cms = {} }) {
  const missionBadge = cms['about.mission.badge'] || 'OUR MISSION';
  const missionTitle =
    cms['about.mission.title'] ||
    'To eliminate logistical fear and bureaucratic anxiety from healthcare visits.';
  const missionBody =
    cms['about.mission.body'] ||
    'We ensure every patient, regardless of physical frailty or digital familiarity, has a dedicated, compassionate advocate standing by their side from the moment they step into a hospital until they are safe at home.';

  const visionBadge = cms['about.vision.badge'] || 'OUR VISION';
  const visionTitle =
    cms['about.vision.title'] ||
    'A healthcare ecosystem where no patient walks a corridor lonely or confused.';
  const visionBody =
    cms['about.vision.body'] ||
    'We are shaping a nationwide standard where non-clinical patient navigation is recognized as an indispensable layer of humane healing—creating peace of mind for families across India and the global diaspora.';

  const valuesBadge = cms['about.values.badge'] || 'Our Guiding Ethos';
  const valuesTitle = cms['about.values.title'] || 'Six Foundational Values';
  const valuesSub =
    cms['about.values.sub'] ||
    'The rigorous ethical benchmarks that direct how our companions represent and safeguard your loved ones.';

  const valuesList = [
    {
      num: '1',
      icon: cms['about.val1.icon'] || 'favorite',
      title: cms['about.val1.title'] || '1. Unconditional Care',
      desc:
        cms['about.val1.body'] ||
        'Empathy is present in every touchpoint—holding hands through noisy corridors, offering calm words during test delays, and treating seniors with familial reverence.',
    },
    {
      num: '2',
      icon: cms['about.val2.icon'] || 'verified_user',
      title: cms['about.val2.title'] || '2. Absolute Trust',
      desc:
        cms['about.val2.body'] ||
        '100% background-verified, non-commissioned advocates. Our loyalties remain exclusively with the patient, never swayed by third-party agendas.',
    },
    {
      num: '3',
      icon: cms['about.val3.icon'] || 'alarm_on',
      title: cms['about.val3.title'] || '3. Punctual Reliability',
      desc:
        cms['about.val3.body'] ||
        'Strict 15-minute lobby arrival guarantee before appointment slots. We value the physical energy of tired patients and never let them wait unattended.',
    },
    {
      num: '4',
      icon: cms['about.val4.icon'] || 'accessibility_new',
      title: cms['about.val4.title'] || '4. Dignified Respect',
      desc:
        cms['about.val4.body'] ||
        'Empowering patient autonomy, preserving personal privacy during doctor examinations, and never treating elderly individuals like helpless dependents.',
    },
    {
      num: '5',
      icon: cms['about.val5.icon'] || 'translate',
      title: cms['about.val5.title'] || '5. Universal Accessibility',
      desc:
        cms['about.val5.body'] ||
        'Native multilingual companion matching across English, Telugu, Hindi, Kannada, and Tamil to ensure total comfort without communication gaps.',
    },
    {
      num: '6',
      icon: cms['about.val6.icon'] || 'receipt_long',
      title: cms['about.val6.title'] || '6. Strict Responsibility',
      desc:
        cms['about.val6.body'] ||
        'Clear, transparent hourly pricing. Absolute zero kickbacks or referral fees from laboratories, diagnostic centres, or pharmaceutical shops.',
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
              <span>Dignified care for every family</span>
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
              <span>Building nationwide healthcare dignity</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </div>
          </div>
        </div>

        {/* 6 Foundational Values Header */}
        <div className="ay-about-values-header">
          <span className="ay-about-section-badge">{valuesBadge}</span>
          <h2 className="ay-about-section-h2">{valuesTitle}</h2>
          <p className="ay-about-paragraph" style={{ marginTop: '0.5rem' }}>{valuesSub}</p>
        </div>

        {/* 6 Foundational Values Grid */}
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
