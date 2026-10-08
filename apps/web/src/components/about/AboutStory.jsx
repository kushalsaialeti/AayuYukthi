import React from 'react';

export function AboutStory({ cms = {} }) {
  const badge = cms['about.story.badge'] || 'Origin Narrative';
  const title = cms['about.story.title'] || 'The Unseen Burden of Hospital Corridors';
  const body1 =
    cms['about.story.body1'] ||
    'Modern quaternary hospital campuses across India are sprawling multi-tower complexes designed for clinical miracles, not necessarily logistical ease. Between busy registration counters, multi-wing elevators, insurance TPA desks, and unpredictable doctor consult schedules, patients and their anxious family members suffer immense physical and cognitive exhaustion.';

  const body2 =
    cms['about.story.body2'] ||
    'For working professionals juggling demanding careers, or non-resident Indians (NRIs) living thousands of miles away, the distress of having an elderly parent navigate evaluations alone is paralyzing. Phone calls from waiting lounges can never replace having a steady, compassionate human hand nearby.';

  const quote =
    cms['about.story.quote'] ||
    '“Hospitals heal illness, but navigating them should not create fresh illness. We envisioned an empathetic buffer—a calm, capable companion standing between vulnerable patients and operational friction.”';

  const quoteAuthor = cms['about.story.quote_author'] || 'Ananya V. Deshmukh';
  const quoteRole = cms['about.story.quote_role'] || 'Founder & Care Operations Director';

  const body3 =
    cms['about.story.body3'] ||
    'AayuYukthi steps in not as doctors or nurses, but as trustworthy, rigorously vetted care companions and patient navigators. We stand in token queues, coordinate clean wheelchairs, transcribe clinical instructions into plain-language summaries, collect prescribed medications, and broadcast live milestones back to distant families.';

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

          {/* Right Flowchart & Timeline Infographic */}
          <div className="ay-about-story-right">
            <div className="ay-about-flowchart-card">
              <h3 className="ay-about-flowchart-title">
                <span className="material-symbols-outlined">route</span>
                <span>Anatomy of a Typical 4.5h Hospital Visit</span>
              </h3>

              <div className="ay-about-flowchart-svg-box">
                <svg
                  className="w-full h-auto text-primary-container"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 400 220"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  {/* Step 1 */}
                  <circle cx="40" cy="40" fill="#e1e3e2" r="18" stroke="#0d5c63" strokeWidth="2" />
                  <text fill="#004349" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" textAnchor="middle" x="40" y="45">
                    01
                  </text>
                  <path d="M58 40 L130 40" stroke="#0d5c63" strokeDasharray="4 4" strokeWidth="2" />

                  {/* Step 2 */}
                  <circle cx="150" cy="40" fill="#e1e3e2" r="18" stroke="#0d5c63" strokeWidth="2" />
                  <text fill="#004349" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" textAnchor="middle" x="150" y="45">
                    02
                  </text>
                  <path d="M168 40 L240 40" stroke="#0d5c63" strokeDasharray="4 4" strokeWidth="2" />

                  {/* Step 3 */}
                  <circle cx="260" cy="40" fill="#e1e3e2" r="18" stroke="#0d5c63" strokeWidth="2" />
                  <text fill="#004349" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" textAnchor="middle" x="260" y="45">
                    03
                  </text>
                  <path d="M278 40 L350 40" stroke="#0d5c63" strokeDasharray="4 4" strokeWidth="2" />

                  {/* Step 4 */}
                  <circle cx="360" cy="40" fill="#0d5c63" r="18" stroke="#0d5c63" strokeWidth="2" />
                  <text fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" textAnchor="middle" x="360" y="45">
                    ✓
                  </text>

                  {/* Milestone Labels */}
                  <text fill="#191c1c" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" textAnchor="middle" x="40" y="75">
                    Porch Pickup
                  </text>
                  <text fill="#3f484a" fontFamily="Plus Jakarta Sans" fontSize="9" textAnchor="middle" x="40" y="90">
                    Sanitized Wheelchair
                  </text>

                  <text fill="#191c1c" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" textAnchor="middle" x="150" y="75">
                    Queue &amp; Token
                  </text>
                  <text fill="#3f484a" fontFamily="Plus Jakarta Sans" fontSize="9" textAnchor="middle" x="150" y="90">
                    OPD file opening
                  </text>

                  <text fill="#191c1c" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" textAnchor="middle" x="260" y="75">
                    Doctor Consult
                  </text>
                  <text fill="#3f484a" fontFamily="Plus Jakarta Sans" fontSize="9" textAnchor="middle" x="260" y="90">
                    Note transcribing
                  </text>

                  <text fill="#191c1c" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" textAnchor="middle" x="360" y="75">
                    Meds &amp; Drop
                  </text>
                  <text fill="#3f484a" fontFamily="Plus Jakarta Sans" fontSize="9" textAnchor="middle" x="360" y="90">
                    Safe departure
                  </text>

                  {/* Stress metric container */}
                  <rect fill="#ffffff" height="75" rx="8" width="360" x="20" y="125" stroke="#bfc8c9" strokeWidth="1" />
                  <text fill="#0d5c63" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" x="35" y="152">
                    Average Stress Reduction Impact
                  </text>
                  <text fill="#3f484a" fontFamily="Plus Jakarta Sans" fontSize="11" x="35" y="172">
                    Patient physical fatigue reduced by 68%
                  </text>
                  <text fill="#3f484a" fontFamily="Plus Jakarta Sans" fontSize="11" x="35" y="188">
                    Caregiver anxiety index lowered by 82% (Internal study)
                  </text>
                </svg>
              </div>

              <div className="ay-about-cert-list">
                <div className="ay-about-cert-item">
                  <span className="material-symbols-outlined">shield</span>
                  <span>All companions pass 7-tier police &amp; credential verification</span>
                </div>
                <div className="ay-about-cert-item">
                  <span className="material-symbols-outlined">elderly</span>
                  <span>Geriatric empathy &amp; basic vital observation certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
