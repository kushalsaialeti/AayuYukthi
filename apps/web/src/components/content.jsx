import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../analytics.js';
import { ResponsiveImage } from '../media.jsx';

const raw = (_et, _id, _f, source) => source;

export function HeroCarousel({ slides, t, tx = raw }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Highlights">
      <div className="hero-media" aria-hidden="true">
        {slide.image_media_id ? (
          <ResponsiveImage mediaId={slide.image_media_id} fallbackSrc={slide.image_url} alt="" eager widths={[768, 1200, 1600]} />
        ) : (
          slide.image_url && <img src={slide.image_url} alt="" loading="eager" fetchpriority="high" />
        )}
        <div className="hero-overlay" />
      </div>
      <div className="container hero-content">
        <h1>{tx('hero_slides', slide.id, 'title_en', slide.title_en)}</h1>
        {slide.description_en && <p>{tx('hero_slides', slide.id, 'description_en', slide.description_en)}</p>}
        <div className="hero-actions">
          {slide.primary_cta_label_en && (
            <Link className="btn btn-primary" to={slide.primary_cta_url || '/request-care'}
              onClick={() => track('CTA_CLICKED', { cta: 'hero_primary' })}>{slide.primary_cta_label_en}</Link>
          )}
          {slide.secondary_cta_label_en && (
            <Link className="btn btn-secondary" to={slide.secondary_cta_url || '/how-it-works'}
              onClick={() => track('CTA_CLICKED', { cta: 'hero_secondary' })}>{slide.secondary_cta_label_en}</Link>
          )}
          {(!slide.primary_cta_label_en && !slide.secondary_cta_label_en) && (
            <Link className="btn btn-primary" to="/request-care" onClick={() => track('CTA_CLICKED', { cta: 'hero_default' })}>{t.requestCare}</Link>
          )}
        </div>
        {count > 1 && (
          <div className="hero-dots">
            {slides.map((s, i) => (
              <button key={s.id} type="button" onClick={() => setIndex(i)}
                className={i === index ? 'active' : ''} aria-label={`Slide ${i + 1}${s.title_en ? `: ${s.title_en}` : ''}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ServiceCard({ service, t, tx = raw }) {
  return (
    <article className="card service-card">
      {service.image_media_id ? (
        <ResponsiveImage mediaId={service.image_media_id} fallbackSrc={service.image_url} alt="" className="card-img" />
      ) : (
        service.image_url && <img className="card-img" src={service.image_url} alt="" loading="lazy" />
      )}
      <h3>{tx('services', service.id, 'title_en', service.title_en)}</h3>
      <p>{tx('services', service.id, 'description_en', service.description_en)}</p>
      <Link className="btn btn-secondary" to={`/services/${service.slug}`}>{t.learnMore}</Link>
    </article>
  );
}

export function HospitalCard({ hospital, t, tx = raw }) {
  return (
    <article className="card hospital-card">
      <h3>{tx('hospitals', hospital.id, 'name_en', hospital.name_en)}</h3>
      {[hospital.city, hospital.state].filter(Boolean).join(', ') && (
        <p className="muted">{[hospital.city, hospital.state].filter(Boolean).join(', ')}</p>
      )}
      {hospital.description_en && <p>{tx('hospitals', hospital.id, 'description_en', hospital.description_en).slice(0, 140)}{hospital.description_en.length > 140 ? '…' : ''}</p>}
      <Link className="btn btn-secondary" to={`/hospitals/${hospital.slug}`}>{t.viewDetails}</Link>
    </article>
  );
}

export function FaqList({ faqs, tx = raw }) {
  if (!faqs?.length) return null;
  return (
    <div className="faq-list">
      {faqs.map((f) => (
        <details key={f.id} className="card faq">
          <summary>{tx('faqs', f.id, 'question_en', f.question_en)}</summary>
          <p>{tx('faqs', f.id, 'answer_en', f.answer_en)}</p>
        </details>
      ))}
    </div>
  );
}

export function TestimonialList({ testimonials, tx = raw }) {
  if (!testimonials?.length) return null;
  return (
    <div className="grid-3">
      {testimonials.map((item) => (
        <figure key={item.id} className="card testimonial">
          <blockquote>“{tx('testimonials', item.id, 'quote_en', item.quote_en)}”</blockquote>
          <figcaption><strong>{item.author_name}</strong>{item.author_detail_en && <span> — {item.author_detail_en}</span>}</figcaption>
        </figure>
      ))}
    </div>
  );
}
