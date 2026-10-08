import { useState } from 'react';

// Testimonial cards with star ratings (rating from CMS, default 5).
export function TestimonialCards({ testimonials, tx = (_e, _i, _f, s) => s }) {
  const list = (testimonials ?? []).slice(0, 3);
  if (!list.length) return null;
  const tints = [
    'rgba(0,67,73,.1)',
    'var(--pub-secondary-fixed)',
    'var(--pub-tertiary-fixed)',
  ];
  const inks = ['var(--pub-primary)', 'var(--pub-on-secondary-fixed)', 'var(--pub-on-tertiary-fixed)'];
  return (
    <div className="pub-grid-3">
      {list.map((item, i) => (
        <figure key={item.id} className="pub-card" style={{ margin: 0 }}>
          <div>
            <div className="pub-stars" aria-label={`${item.rating ?? 5} out of 5 stars`}>
              {Array.from({ length: item.rating ?? 5 }).map((_, s) => (
                <span key={s} className="material-symbols-outlined fill" style={{ fontSize: 20 }} aria-hidden="true">star</span>
              ))}
            </div>
            <blockquote className="pub-quote" style={{ margin: '0 0 1rem' }}>
              “{tx('testimonials', item.id, 'quote_en', item.quote_en)}”
            </blockquote>
          </div>
          <figcaption className="pub-person">
            <div className="pub-initials" style={{ background: tints[i % 3], color: inks[i % 3] }} aria-hidden="true">
              {(item.author_name ?? 'A').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p>{item.author_name}</p>
              {item.author_detail_en && <small>{item.author_detail_en}</small>}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// Accessible FAQ accordion (CMS faqs, published only). One open at a time.
export function FaqAccordion({ faqs, tx = (_e, _i, _f, s) => s }) {
  const [open, setOpen] = useState(null);
  const list = (faqs ?? []).slice(0, 5);
  if (!list.length) return null;
  return (
    <div className="pub-faq-list">
      {list.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className={`pub-faq${isOpen ? ' open' : ''}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen}>
              <span>{tx('faqs', f.id, 'question_en', f.question_en)}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }} aria-hidden="true">expand_more</span>
            </button>
            {isOpen && <div className="pub-faq-answer">{tx('faqs', f.id, 'answer_en', f.answer_en)}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Final CTA banner (home.cta.* blocks). Renders only when a title exists.
export function FinalCta({ copy, requestLabel = 'Request Care', contactLabel = 'Contact Us' }) {
  if (!copy?.title) return null;
  return (
    <div className="pub-cta-band">
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '36rem' }}>
        {copy.eyebrow && <span className="pub-cta-tag">{copy.eyebrow}</span>}
        <h2>{copy.title}</h2>
        {copy.body && <p>{copy.body}</p>}
      </div>
      <div className="pub-cta-actions">
        <a className="pub-btn light" href={copy.primaryUrl ?? '/request-care'}>
          {copy.primaryLabel ?? requestLabel}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">arrow_forward</span>
        </a>
        <a className="pub-btn ghost" href={copy.secondaryUrl ?? '/contact'}>
          {copy.secondaryLabel ?? contactLabel}
        </a>
      </div>
    </div>
  );
}
