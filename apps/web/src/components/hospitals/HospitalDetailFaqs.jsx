import React from 'react';
import { Icon } from '../public/Icon.jsx';

export function HospitalDetailFaqs({ hospital }) {
  const faqs = Array.isArray(hospital?.faqs) && hospital.faqs.length > 0
    ? hospital.faqs
    : [];

  if (faqs.length === 0) return null;

  const displayName = hospital?.name_en || 'this hospital';

  return (
    <section className="hsp-detail-section hsp-faqs-card">
      <div className="hsp-section-title-wrap mb-space-sm">
        <div className="hsp-section-icon-badge">
          <Icon name="help_center" size={20} />
        </div>
        <h2 className="hsp-section-title">Frequently Asked Questions</h2>
      </div>

      <p className="hsp-section-desc mb-space-md">
        Specific details on visiting {displayName} with an AayuYukthi companion:
      </p>

      <div className="hsp-faq-accordion-list">
        {faqs.map((faq, idx) => (
          <details key={idx} className="hsp-faq-details" open={idx === 0}>
            <summary className="hsp-faq-summary">
              <span className="hsp-faq-question">{faq.question}</span>
              <Icon name="expand_more" size={20} className="hsp-faq-chevron" />
            </summary>
            <p className="hsp-faq-answer">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
