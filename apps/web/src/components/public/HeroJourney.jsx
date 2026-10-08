import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../../analytics.js';
import { ResponsiveImage } from '../../media.jsx';
import { Icon } from './Icon.jsx';

// Journey hero: CMS copy (blocks) + CMS stages (hero_slides, max 5 visible).
// Pills, counter, arrows, and autoplay all follow the slide list — add a
// sixth slide in CMS and the UI grows with it. Missing images fall back to
// the themed gradient stage (never a broken tile).
export function HeroJourney({ copy, slides, t, tx }) {
  const visible = (slides ?? []).slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % visible.length), 6000);
    return () => clearInterval(id);
  }, [visible.length]);

  const go = (i) => setIndex((i + visible.length) % visible.length);
  const slide = visible[index];

  return (
    <section className="pub-hero">
      <div className="pub-container">
        {copy.disclaimer && (
          <div className="pub-ribbon">
            <Icon name="info" size={18} />
            <span>{copy.disclaimer}</span>
          </div>
        )}
        <div className="pub-hero-grid">
          <div className="pub-hero-copy">
            {copy.eyebrow && (
              <div className="pub-pill-eyebrow">
                <span className="dot" aria-hidden="true" />
                {copy.eyebrow}
              </div>
            )}
            <h1>{copy.title ?? t.tagline}</h1>
            {copy.description && <p>{copy.description}</p>}
            <div className="pub-hero-ctas">
              <Link
                className="pub-btn"
                to={copy.primaryUrl ?? '/request-care'}
                onClick={() => track('CTA_CLICKED', { cta: 'hero_primary' })}
              >
                {copy.primaryLabel ?? t.requestCare}
                <Icon name="arrow_forward" size={20} />
              </Link>
              {(copy.secondaryLabel || copy.secondaryUrl) && (
                <Link
                  className="pub-btn secondary"
                  to={copy.secondaryUrl ?? '/services'}
                  onClick={() => track('CTA_CLICKED', { cta: 'hero_secondary' })}
                >
                  {copy.secondaryLabel ?? t.learnMore}
                </Link>
              )}
            </div>
            {visible.length > 0 && (
              <div className="pub-journey-box">
                <div className="pub-journey-head">
                  <strong>{copy.journeyLabel ?? 'Journey Steps'}</strong>
                  <span>Stage {index + 1} of {visible.length}</span>
                </div>
                <div className="pub-journey-tabs" role="tablist" aria-label="Journey stages">
                  {visible.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      className={i === index ? 'active' : ''}
                      onClick={() => go(i)}
                    >
                      {i + 1}. {s.short_label_en || s.title_en}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="pub-hero-stage">
            <div className="pub-stage" aria-roledescription="carousel" aria-label="Care journey stages">
              {visible.map((s, i) => (
                <div key={s.id} className={`pub-slide${i === index ? '' : ' hidden'}`} aria-hidden={i !== index}>
                  {s.image_media_id ? (
                    <ResponsiveImage
                      mediaId={s.image_media_id}
                      fallbackSrc={s.image_url}
                      alt=""
                      eager={i === 0}
                      widths={[768, 1200, 1600]}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    s.image_url && <div className="pub-slide-bg" style={{ backgroundImage: `url('${s.image_url}')` }} />
                  )}
                  <div className="pub-slide-shade" />
                  <div className="pub-slide-body">
                    <span className="pub-slide-tag">Stage {String(i + 1).padStart(2, '0')}</span>
                    <h3>{tx('hero_slides', s.id, 'title_en', s.title_en)}</h3>
                    {s.description_en && <p>{tx('hero_slides', s.id, 'description_en', s.description_en)}</p>}
                  </div>
                </div>
              ))}
              {visible.length > 1 && (
                <div className="pub-stage-controls">
                  <button type="button" aria-label="Previous stage" onClick={() => go(index - 1)}>
                    <Icon name="chevron_left" size={20} />
                  </button>
                  <button type="button" aria-label="Next stage" onClick={() => go(index + 1)}>
                    <Icon name="chevron_right" size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
