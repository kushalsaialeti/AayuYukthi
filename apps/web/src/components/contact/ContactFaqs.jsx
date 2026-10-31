import React, { useState } from 'react';

// FAQs fetched from CMS (api.faqs) — renders nothing when empty, no
// hardcoded fallback questions.
export function ContactFaqs({ faqs = [] }) {
  const [openIds, setOpenIds] = useState(new Set());

  if (!faqs || faqs.length === 0) return null;

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="contact-faqs-box">
      <div style={{ maxWidth: '640px', marginBottom: '1.75rem' }}>
        <span className="contact-channel-eyebrow" style={{ color: 'var(--pub-primary)' }}>
          Common Queries
        </span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0', color: 'var(--pub-on-surface)' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--pub-on-variant)' }}>
          Quick clarity on scheduling, duration flexibility, and care boundaries before you submit your request.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '860px' }}>
        {faqs.map((item) => {
          const isOpen = openIds.has(item.id);
          return (
            <div
              key={item.id}
              className="contact-faq-item"
              onClick={() => toggle(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item.id); } }}
              aria-expanded={isOpen}
            >
              <div className="contact-faq-q">
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--pub-on-surface)' }}>
                  {item.question_en}
                </h3>
                <span className={`material-symbols-outlined contact-faq-chevron ${isOpen ? 'expanded' : ''}`}>
                  expand_more
                </span>
              </div>
              {isOpen && (
                <div className="contact-faq-answer">
                  {item.answer_en}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
