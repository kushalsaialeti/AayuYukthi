import { useState } from 'react';
import { api } from '../../api.js';
import { Icon } from '../public/Icon.jsx';

export function ServiceAssessmentCard({ services = [], inquiryBlocks = {} }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bhimavaram');
  const [serviceSlug, setServiceSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const title =
    inquiryBlocks['services.inquiry.title']?.body_en ||
    inquiryBlocks['services.inquiry.title']?.title_en ||
    'Have unique requirements or hospital scheduling questions?';

  const body =
    inquiryBlocks['services.inquiry.body']?.body_en ||
    inquiryBlocks['services.inquiry.body']?.title_en ||
    'Speak directly with an AayuYukthi care counselor. We customize schedules, wheelchair logistics, multiday packages, and multilingual coordinator pairings in minutes.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const selectedService = services.find((s) => s.slug === serviceSlug)?.title_en || serviceSlug;
      await api.submitContact({
        name: name.trim(),
        phone: phone.trim(),
        city,
        service: selectedService || 'Assessment Call',
        message: `Assessment request from Services Page. City: ${city}. Preferred service: ${selectedService || 'General Inquiry'}.`,
      });
      setSubmitted(true);
      setName('');
      setPhone('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err?.message || 'Failed to submit request. Please try again or call our helpline.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="svc-assessment-section" id="request-care">
      <div className="pub-container">
        <div className="svc-assessment-banner">
          <div className="svc-assessment-glow" aria-hidden="true" />

          <div className="svc-assessment-grid">
            {/* Left Column: Descriptive Care Counselor Info */}
            <div className="svc-assessment-info">
              <span className="svc-assessment-tag">
                <Icon name="support_agent" size={16} /> Dedicated Care Desk
              </span>
              <h2 className="svc-assessment-h2">{title}</h2>
              <p className="svc-assessment-p">{body}</p>

              <div className="svc-assessment-trust">
                <div className="svc-trust-item">
                  <Icon name="check" size={18} className="svc-benefit-icon" />
                  <span>No cancellation penalty up to 4 hrs</span>
                </div>
                <div className="svc-trust-item">
                  <Icon name="check" size={18} className="svc-benefit-icon" />
                  <span>Transparent hourly overage terms</span>
                </div>
              </div>
            </div>

            {/* Right Column: Callback Request Form */}
            <aside className="svc-form-box" aria-label="Book Assessment">
              <h3 className="svc-form-title">Book an Assessment Call</h3>
              <p className="svc-form-sub">Our senior coordinator will call within 15 minutes.</p>

              {submitted && (
                <div className="svc-alert-box" role="status">
                  Request received! A care coordinator is reviewing your details now.
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '0.65rem',
                    borderRadius: '0.5rem',
                    fontSize: '13px',
                    background: '#fee2e2',
                    color: '#991b1b',
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="svc-form-field">
                  <label className="svc-form-label" htmlFor="svc-input-name">
                    Your Full Name
                  </label>
                  <input
                    id="svc-input-name"
                    className="svc-form-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                  <div className="svc-form-field">
                    <label className="svc-form-label" htmlFor="svc-input-phone">
                      Phone Number
                    </label>
                    <input
                      id="svc-input-phone"
                      className="svc-form-input"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 8816 223344"
                    />
                  </div>

                  <div className="svc-form-field">
                    <label className="svc-form-label" htmlFor="svc-select-city">
                      City / Area
                    </label>
                    <select
                      id="svc-select-city"
                      className="svc-form-select"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="Bhimavaram">Bhimavaram</option>
                      <option value="Palakollu">Palakollu</option>
                      <option value="Tanuku">Tanuku</option>
                      <option value="Tadepalligudem">Tadepalligudem</option>
                      <option value="Narsapur">Narsapur</option>
                      <option value="Surrounding Towns">Surrounding Towns</option>
                    </select>
                  </div>
                </div>

                <div className="svc-form-field">
                  <label className="svc-form-label" htmlFor="svc-select-service">
                    Select Service Needed
                  </label>
                  <select
                    id="svc-select-service"
                    className="svc-form-select"
                    value={serviceSlug}
                    onChange={(e) => setServiceSlug(e.target.value)}
                  >
                    <option value="">General Care Inquiry</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.title_en}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="svc-form-btn" disabled={busy}>
                  <Icon name="calendar_add_on" size={20} />
                  <span>{busy ? 'Sending request…' : 'Request Immediate Callback'}</span>
                </button>
              </form>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
