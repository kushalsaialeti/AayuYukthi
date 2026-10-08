import React, { useState } from 'react';

const FALLBACK_FAQS = [
  {
    id: 'faq-1',
    question_en: 'How early should I book a care coordinator before a hospital visit?',
    answer_en: 'We recommend booking at least 24 hours in advance to guarantee optimal language and hospital-specific coordinator alignment. However, urgent bookings are accepted with as little as 3 hours notice across our active metro networks.'
  },
  {
    id: 'faq-2',
    question_en: 'What happens if my doctor appointment runs later than expected?',
    answer_en: 'Our care coordinators stay with you until you are safely through billing, medications, and exited back to transit. There are no sudden abandonments or stress; any unexpected consultation delays transition into an upfront, simple nominal hourly overage with complete transparency.'
  },
  {
    id: 'faq-3',
    question_en: 'Do you provide medical advice or administer treatments?',
    answer_en: 'No. AayuYukthi is strictly a non-clinical healthcare accompaniment and administrative logistics navigation service. Our companions assist with physical escorting, token queues, communication facilitation, discharge notes retrieval, and pharmacy collection. All clinical diagnosis and medical interventions remain exclusively with your licensed hospital doctors.'
  }
];

export function ContactFaqs({ faqs = [] }) {
  const [openIds, setOpenIds] = useState(new Set());

  const items = faqs.length > 0 ? faqs : FALLBACK_FAQS;

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
        {items.map((item) => {
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
