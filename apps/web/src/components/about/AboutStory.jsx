import React from 'react';

export function AboutStory({ cms = {} }) {
  const badge = cms['about.story.badge'] || 'Why We Started';
  const title = cms['about.story.title'] || 'No parent or elder should have to navigate a hospital alone.';
  const body1 =
    cms['about.story.body1'] ||
    'Large multi-specialty hospitals are built to heal illness, but navigating crowded corridors, elevator towers, and unpredictable doctor consult schedules is exhausting—especially for elderly patients and anyone dealing with health distress.';

  const body2 =
    cms['about.story.body2'] ||
    'When children live in other cities or are busy with work, knowing that an elderly parent is sitting in a crowded waiting lounge alone causes immense worry. A quick phone call can never replace having a polite, attentive person standing right beside them to hold their hand and guide them.';

  const quote =
    cms['about.story.quote'] ||
    '“We treat every patient like our own mother, father, or grandparent—with unhurried patience, warm dignity, and absolute honesty.”';

  const quoteAuthor = cms['about.story.quote_author'] || 'AayuYukthi Care Promise';
  const quoteRole = cms['about.story.quote_role'] || 'Our Core Guiding Principle';

  const body3 =
    cms['about.story.body3'] ||
    'AayuYukthi steps in as trusted, family-like support on the ground. We are not doctors or clinical nurses, but trained, background-verified care companions. We arrange a clean wheelchair, stand in token lines, stay beside your parent during doctor consults, collect medicines, and send clear updates back to you at home.';

  const steps = [
    { num: '01', title: 'Gate Meetup', desc: 'Doorstep greeting with a clean, smooth wheelchair ready.' },
    { num: '02', title: 'Token & OPD Lines', desc: 'Queueing for registration tokens while your elder rests in comfort.' },
    { num: '03', title: 'Doctor Consult', desc: 'Attentive bedside accompaniment and clear prescription notes.' },
    { num: '04', title: 'Meds & Safe Departure', desc: 'Pharmacy collection and gentle escort straight to home transport.' },
  ];

  return (
    <section className="ay-about-story-section">
      <div className="pub-container">
        <div className="ay-about-story-header">
          <span className="ay-about-section-badge">{badge}</span>
          <h2 className="ay-about-section-h2">{title}</h2>
        </div>

        <div className="ay-about-story-grid">
          {/* Left Narrative Column */}
          <div className="ay-about-story-left">
            <p className="ay-about-paragraph">{body1}</p>
            <p className="ay-about-paragraph">{body2}</p>

            <div className="ay-about-quote-box">
              <div className="ay-about-quote-inner">
                <span className="material-symbols-outlined ay-about-quote-icon">format_quote</span>
                <p className="ay-about-quote-text">{quote}</p>
              </div>
              <div className="ay-about-quote-credit">
                <span className="ay-about-quote-author">{quoteAuthor}</span>
                <span className="ay-about-quote-role"> — {quoteRole}</span>
              </div>
            </div>

            <p className="ay-about-paragraph">{body3}</p>
          </div>

          {/* Right Flowchart & Timeline Card */}
          <div className="ay-about-story-right">
            <div className="ay-about-flowchart-card">
              <h3 className="ay-about-flowchart-title">
                <span className="material-symbols-outlined">route</span>
                <span>The 4 Simple Stages of a Supported Hospital Visit</span>
              </h3>

              <div className="ay-about-simple-steps-grid">
                {steps.map((st) => (
                  <div key={st.num} className="ay-about-simple-step-card">
                    <span className="ay-about-step-badge">{st.num}</span>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--pub-on-surface)' }}>
                        {st.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pub-on-variant)', lineHeight: 1.45 }}>
                        {st.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ay-about-cert-list">
                <div className="ay-about-cert-item">
                  <span className="material-symbols-outlined">shield</span>
                  <span>100% background-verified &amp; identity vetted companions</span>
                </div>
                <div className="ay-about-cert-item">
                  <span className="material-symbols-outlined">elderly</span>
                  <span>Trained in gentle senior mobility &amp; clean wheelchair transit</span>
                </div>
                <div className="ay-about-cert-item">
                  <span className="material-symbols-outlined">translate</span>
                  <span>Fluent in local languages: Telugu, English &amp; Hindi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
