import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalHero({ heroBlocks = {}, t = {} }) {
  // CMS blocks only — no hardcoded city/coverage/verification claims.
  const eyebrow =
    heroBlocks['hospitals.hero.eyebrow']?.body_en || heroBlocks['hospitals.hero.eyebrow']?.title_en || null;
  const title =
    heroBlocks['hospitals.hero.title']?.body_en || heroBlocks['hospitals.hero.title']?.title_en || null;
  const body =
    heroBlocks['hospitals.hero.body']?.body_en || heroBlocks['hospitals.hero.body']?.title_en || null;

  const pill1 =
    heroBlocks['hospitals.hero.pill_1']?.body_en || heroBlocks['hospitals.hero.pill_1']?.title_en || null;
  const pill2 =
    heroBlocks['hospitals.hero.pill_2']?.body_en || heroBlocks['hospitals.hero.pill_2']?.title_en || null;

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
              {eyebrow && (
                <div className="hsp-hero-tag">
                  <span className="hsp-hero-pulse" />
                  {eyebrow}
                </div>
              )}

              {title && renderTitle()}

              {body && <p className="hsp-hero-desc">{body}</p>}

              {(pill1 || pill2) && (
                <div className="hsp-hero-badges">
                  {pill1 && (
                    <div className="hsp-trust-pill">
                      <Icon name="verified" size={18} className="text-secondary" />
                      <span>{pill1}</span>
                    </div>
                  )}
                  {pill2 && (
                    <div className="hsp-trust-pill">
                      <Icon name="info" size={18} className="text-tertiary" />
                      <span>{pill2}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
