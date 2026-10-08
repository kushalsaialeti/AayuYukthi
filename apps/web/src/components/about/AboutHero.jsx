import React from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_HERO_IMG =
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80';

export function AboutHero({ cms = {} }) {
  const eyebrow = cms['about.hero.badge'] || 'OUR FOUNDING PURPOSE • HUMAN-CENTERED ADVOCACY';
  const title = cms['about.hero.title'] || 'Making hospital journeys easier, dignified, and stress-free.';
  const desc =
    cms['about.hero.description'] ||
    'AayuYukthi was born from a fundamental realization: navigating premier hospitals when unwell or caring for elderly loved ones is emotionally exhausting. We bridge the gap between home doorstep and clinical care with dedicated, empathetic companions.';

  const primaryLabel = cms['about.hero.primary_label'] || 'Book Companion Escort';
  const primaryUrl = cms['about.hero.primary_url'] || '/request-care';
  const secondaryLabel = cms['about.hero.secondary_label'] || '1800-AAYU-CARE';
  const secondaryUrl = cms['about.hero.secondary_url'] || 'tel:180022982273';

  const heroImg = cms['about.hero.image_url'] || DEFAULT_HERO_IMG;
  const imageCaption = cms['about.hero.image_caption'] || 'Hyderabad, Bengaluru & Regional Corridors';
  const imageSub = cms['about.hero.image_sub'] || 'Active at partner hospital hubs';
  const imageBadge = cms['about.hero.image_badge'] || 'Verified Team';

  const metrics = [
    {
      val: cms['about.metric1.value'] || '35,000+',
      label: cms['about.metric1.label'] || 'Assisted Hours',
      sub: cms['about.metric1.sub'] || 'Uninterrupted bedside & corridor support',
    },
    {
      val: cms['about.metric2.value'] || '42+',
      label: cms['about.metric2.label'] || 'Partner Hospital Hubs',
      sub: cms['about.metric2.sub'] || 'Accredited private & tertiary campuses',
    },
    {
      val: cms['about.metric3.value'] || '99.2%',
      label: cms['about.metric3.label'] || 'Punctual Escort SLA',
      sub: cms['about.metric3.sub'] || '15-minute lobby check-in reliability',
    },
    {
      val: cms['about.metric4.value'] || '4.9/5',
      label: cms['about.metric4.label'] || 'Caregiver Satisfaction',
      sub: cms['about.metric4.sub'] || 'Verified post-consult family reviews',
    },
  ];

  return (
    <>
      {/* Breadcrumb Bar */}
      <section className="ay-about-breadcrumb-bar">
        <div className="pub-container">
          <nav className="ay-about-breadcrumb-nav" aria-label="Breadcrumb">
            <Link to="/" className="ay-about-breadcrumb-link">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>home</span>
              <span>Home</span>
            </Link>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--pub-on-variant)' }}>chevron_right</span>
            <span className="ay-about-breadcrumb-active">About Us</span>
          </nav>
        </div>
      </section>

      {/* Hero Section */}
      <section className="ay-about-hero-section">
        <div className="pub-container" style={{ paddingTop: '1.5rem' }}>
          <div className="ay-about-hero-grid">
            {/* Left Copy */}
            <div className="ay-about-hero-copy">
              <div className="ay-about-eyebrow-pill">
                <span className="ay-about-pulse-dot" />
                <span>{eyebrow}</span>
              </div>

              <h1 className="ay-about-hero-title">
                {title.includes('easier, dignified,') ? (
                  <>
                    Making hospital journeys{' '}
                    <span className="ay-about-title-highlight">easier, dignified,</span> and stress-free.
                  </>
                ) : (
                  title
                )}
              </h1>

              <p className="ay-about-hero-desc">{desc}</p>

              <div className="ay-about-hero-actions">
                <Link to={primaryUrl} className="ay-about-btn-primary">
                  <span>{primaryLabel}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </Link>

                <a href={secondaryUrl} className="ay-about-btn-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--pub-primary-container)' }}>call</span>
                  <span>{secondaryLabel}</span>
                </a>
              </div>
            </div>

            {/* Right Media Card */}
            <div className="ay-about-hero-media">
              <div className="ay-about-hero-media-wrap">
                <img
                  src={heroImg}
                  alt="AayuYukthi companion escorting patient with care"
                  className="ay-about-hero-img"
                  loading="eager"
                />

                <div className="ay-about-hero-badge-overlay">
                  <div className="ay-about-hero-badge-left">
                    <span className="ay-about-hero-badge-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>location_on</span>
                    </span>
                    <div>
                      <p className="ay-about-hero-badge-title">{imageCaption}</p>
                      <p className="ay-about-hero-badge-sub">{imageSub}</p>
                    </div>
                  </div>

                  <span className="ay-about-verified-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                    <span>{imageBadge}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Metrics Strip */}
          <div className="ay-about-metrics-strip">
            {metrics.map((m, idx) => (
              <div key={idx} className="ay-about-metric-card">
                <span className="ay-about-metric-val">{m.val}</span>
                <span className="ay-about-metric-label">{m.label}</span>
                <span className="ay-about-metric-sub">{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
