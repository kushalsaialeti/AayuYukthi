import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalHero({ heroBlocks = {}, t = {} }) {
  const eyebrow = heroBlocks['hospitals.hero.eyebrow']?.body_en || heroBlocks['hospitals.hero.eyebrow']?.title_en || 'BHIMAVARAM NETWORK • ACCREDITED HOSPITALS';
  const title = heroBlocks['hospitals.hero.title']?.body_en || heroBlocks['hospitals.hero.title']?.title_en || 'Hospitals supported by AayuYukthi in Bhimavaram.';
  const body = heroBlocks['hospitals.hero.body']?.body_en || heroBlocks['hospitals.hero.body']?.title_en || 'Explore leading healthcare centers across Bhimavaram and surrounding areas where our verified companions provide on-ground coordination and navigational relief.';

  const pill1 = heroBlocks['hospitals.hero.pill_1']?.body_en || heroBlocks['hospitals.hero.pill_1']?.title_en || '100% Verified Multi-Wing Campus Coverage';
  const pill2 = heroBlocks['hospitals.hero.pill_2']?.body_en || heroBlocks['hospitals.hero.pill_2']?.title_en || 'Care coordination & logistics service — independent of hospital administration';

  const renderTitle = () => {
    if (title.includes('AayuYukthi')) {
      const parts = title.split('AayuYukthi');
      return (
        <h1 className="hsp-hero-title">
          {parts[0]}
          <span>AayuYukthi</span>
          {parts[1]}
        </h1>
      );
    }
    return <h1 className="hsp-hero-title">{title}</h1>;
  };

  return (
    <>
      {/* Top Spatial Anchor & Breadcrumb */}
      <div className="hsp-breadcrumb-bar">
        <div className="pub-container">
          <nav aria-label="Breadcrumb" className="hsp-breadcrumb">
            <Link to="/">
              <Icon name="home" size={16} /> {t.home || 'Home'}
            </Link>
            <span className="hsp-breadcrumb-sep">/</span>
            <span className="hsp-breadcrumb-active">{t.hospitals || 'Hospitals & Medical Centers'}</span>
          </nav>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="hsp-hero">
        <div className="pub-container">
          <div className="hsp-hero-banner">
            <div className="hsp-hero-glow-1" aria-hidden="true" />
            <div className="hsp-hero-glow-2" aria-hidden="true" />

            <div className="hsp-hero-content">
              <div className="hsp-hero-tag">
                <span className="hsp-hero-pulse" />
                {eyebrow}
              </div>

              {renderTitle()}

              <p className="hsp-hero-desc">{body}</p>

              <div className="hsp-hero-badges">
                <div className="hsp-trust-pill">
                  <Icon name="verified" size={18} className="text-secondary" />
                  <span>{pill1}</span>
                </div>
                <div className="hsp-trust-pill">
                  <Icon name="info" size={18} className="text-tertiary" />
                  <span>{pill2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
