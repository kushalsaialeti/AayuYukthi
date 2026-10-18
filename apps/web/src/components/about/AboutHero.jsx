import React from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_HERO_IMG =
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80';

export function AboutHero({ cms = {} }) {
  const eyebrow = cms['about.hero.badge'] || 'ABOUT AAYUYUKTHI • CARING FOR YOUR FAMILY';
  const title = cms['about.hero.title'] || 'Making hospital visits gentle, respectful, and stress-free.';
  const desc =
    cms['about.hero.description'] ||
    'Going to a crowded hospital alone can be overwhelming, especially for senior citizens. AayuYukthi provides friendly, trusted care companions to walk beside your parents or family members from the hospital entrance to the doctor’s room and safely back home.';

  const primaryLabel = cms['about.hero.primary_label'] || 'Book Care Companion';
  const primaryUrl = cms['about.hero.primary_url'] || '/request-care';
  const secondaryLabel = cms['about.hero.secondary_label'] || '1800-AAYU-CARE';
  const secondaryUrl = cms['about.hero.secondary_url'] || 'tel:180022982273';

  const heroImg = cms['about.hero.image_url'] || DEFAULT_HERO_IMG;
  const imageCaption = cms['about.hero.image_caption'] || 'Bhimavaram & Regional Network';
  const imageSub = cms['about.hero.image_sub'] || 'Partner hospitals active on-ground';
  const imageBadge = cms['about.hero.image_badge'] || 'Verified Team';

  const metrics = [
    {
      val: '100%',
      label: 'Background-Verified',
      sub: 'Police vetted, identity-checked companions',
    },
    {
      val: 'On-Time',
      label: 'Gate Arrival',
      sub: 'Companion waits at the entrance before you arrive',
    },
    {
      val: 'Zero Lines',
      label: 'Queue Relief',
      sub: 'Token registration & pharmacy lines handled for you',
    },
    {
      val: 'Phone Updates',
      label: 'Live Family Sharing',
      sub: 'Prescription photos & doctor notes sent to your phone',
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
                Making hospital visits{' '}
                <span className="ay-about-title-highlight">gentle, respectful,</span> and stress-free.
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

          {/* Impact Commitments Strip */}
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
