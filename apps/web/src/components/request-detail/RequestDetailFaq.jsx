import React from 'react';

export function RequestDetailFaq({
  companionName = null,
  recipientName = null,
  stationManager = null,
  cmsFaqs = [],
}) {
  const safeCompanion = companionName || 'Care Companion';
  const companionFirstName = safeCompanion.split(' ')[0] || 'Companion';
  const safeRecipient = recipientName || 'your family member';
  const safeStationManager = stationManager || 'Hospital Station Desk';

  const defaultItems = [
    {
      id: 'faq-1',
      question: 'Why did the companion GPS signal drop?',
      answer:
        'Hospital radiology, cardiology, and sub-level diagnostic suites are heavily lead-shielded to protect imaging machines and patient privacy. Cellular data (4G/5G) often cuts out in these corridors. Our escort smart-badges switch to encrypted hospital mesh relays until returning to main floor atriums.',
      defaultOpen: false,
    },
    {
      id: 'faq-2',
      question: `Is ${safeRecipient} alone at any point during this blackout?`,
      answer: (
        <span>
          <strong>Never.</strong> AayuYukthi companions abide by our strict <strong>Zero-Separation Protocol</strong>. {safeCompanion} remains within arm's reach of {safeRecipient} throughout the entire doctor consultation, diagnostic tests, wheelchair transitions, and waiting periods. Ground coordinator {safeStationManager} provides active supervision from the hospital desk.
        </span>
      ),
      defaultOpen: true,
    },
    {
      id: 'faq-3',
      question: 'Will I still receive digital doctor notes and prescriptions?',
      answer:
        `Yes. ${companionFirstName} transcribes doctor instructions, diet directives, and follow-up slots directly on our offline-cached companion app. Prescription photos, billing receipts, and clinical summaries will sync to your family portal the instant the companion steps into the main pharmacy reception.`,
      defaultOpen: false,
    },
  ];

  const items = cmsFaqs.length > 0 ? cmsFaqs : defaultItems;

  return (
    <section className="rd-card">
      <div className="rd-card-header">
        <div className="rd-card-title-group">
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--cust-primary)' }}>
            help_center
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="rd-card-title">Telemetry &amp; Accompaniment Questions</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
              Immediate clarification for family members tracking remotely
            </span>
          </div>
        </div>
      </div>

      <div className="rd-faq-list">
        {items.map((it) => (
          <details
            key={it.id}
            className="rd-faq-item"
            open={it.defaultOpen}
          >
            <summary className="rd-faq-summary">
              <span>{it.question}</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--cust-secondary)', fontSize: '20px' }}>
                expand_more
              </span>
            </summary>
            <div className="rd-faq-body">
              {it.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
