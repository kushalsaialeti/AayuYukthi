import { Icon } from '../public/Icon.jsx';

export function ServiceHero({ heroBlocks = {}, contactInfo = null, hospitalCount = '16+' }) {
  const eyebrow = heroBlocks['services.hero.eyebrow']?.body_en || heroBlocks['services.hero.eyebrow']?.title_en || 'Our Care Offerings';
  const badge = heroBlocks['services.hero.badge']?.body_en || heroBlocks['services.hero.badge']?.title_en || '100% Verified Companions across Bhimavaram & Surrounding Hospitals';
  const title = heroBlocks['services.hero.title']?.body_en || heroBlocks['services.hero.title']?.title_en || 'Support designed around your hospital journey.';
  const body = heroBlocks['services.hero.body']?.body_en || heroBlocks['services.hero.body']?.title_en || 'Thoughtfully coordinated on-ground assistance, logistics, and compassionate accompaniment across every stage of outpatient and hospital care.';

  const bentoTitle = heroBlocks['services.hero.bento_title']?.title_en || 'Zero Wait In Lobby';
  const bentoDesc = heroBlocks['services.hero.bento_title']?.body_en || 'Coordinators arrive 20 mins early';
  const bentoCoverageLabel = heroBlocks['services.hero.bento_coverage']?.title_en || 'Active Coverage';
  const bentoCoverageVal = heroBlocks['services.hero.bento_coverage']?.body_en || `${hospitalCount} Hospitals`;

  const phone = contactInfo?.phone || '+91 8816 223344';
  const telHref = `tel:${phone.replace(/[^0-9+]/g, '')}`;

  // Break title into main and accent if possible
  const renderTitle = () => {
    if (title.includes('hospital journey')) {
      const parts = title.split('hospital journey');
      return (
        <h1 className="svc-hero-title">
          {parts[0]}
          <span className="svc-wavy-accent">hospital journey</span>
          {parts[1]}
        </h1>
      );
    }
    return <h1 className="svc-hero-title">{title}</h1>;
  };

  return (
    <section className="svc-hero">
      <div className="svc-glow-1" aria-hidden="true" />
      <div className="svc-glow-2" aria-hidden="true" />
      <div className="pub-container svc-hero-container">
        {/* Eyebrow & Status Pill */}
        <div className="svc-eyebrow-row">
          <span className="svc-pill-badge">
            <span className="svc-pulse-dot" />
            {eyebrow}
          </span>
          <span className="svc-verified-badge">
            <Icon name="verified" size={16} className="text-primary" />
            {badge}
          </span>
        </div>

        {/* Main Grid: Headline & Bento Card */}
        <div className="svc-hero-grid">
          <div>
            {renderTitle()}
            <p className="svc-hero-desc">{body}</p>
          </div>

          {/* Quick Summary Micro-Bento Card */}
          <aside className="svc-bento-card" aria-label="Care Summary">
            <div className="svc-bento-top">
              <span className="svc-bento-tag">{bentoCoverageLabel}</span>
              <span className="svc-bento-pill">{bentoCoverageVal}</span>
            </div>
            <div className="svc-bento-middle">
              <div className="svc-bento-icon-box">
                <Icon name="health_and_safety" size={22} />
              </div>
              <div>
                <p className="svc-bento-title">{bentoTitle}</p>
                <p className="svc-bento-sub">{bentoDesc}</p>
              </div>
            </div>
            <div className="svc-bento-footer">
              <span>Need emergency triage?</span>
              <a href={telHref}>
                <Icon name="call" size={16} /> Direct Helpline
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
