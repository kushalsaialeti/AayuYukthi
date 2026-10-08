import React, { useState } from 'react';
import { api } from '../../api.js';
import { track } from '../../analytics.js';
import { validateContact } from '../../pages/Contact.jsx';

const CHANNEL_OPTIONS = [
  'Phone Call (Morning)',
  'Phone Call (Evening)',
  'WhatsApp Message',
  'Email'
];

export function ContactIntakeForm() {
  const [values, setValues] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    reason: '',
    hospital: '',
    message: '',
    channel: 'Phone Call (Morning)'
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [serverError, setServerError] = useState(null);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChannelSelect = (channel) => {
    setValues((prev) => ({ ...prev, channel }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare E.164 phone string if raw 10 digits provided
    let cleanPhone = values.phone.trim();
    if (cleanPhone && !cleanPhone.startsWith('+')) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length === 10) {
        cleanPhone = `+91${digits}`;
      }
    }

    const payloadToValidate = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: cleanPhone,
      subject: `[${values.city || 'Care Inquiry'}] ${values.reason || 'General Request'}`,
      message: values.message.trim() || `Care requirement: ${values.reason || 'Hospital consultation'}. Preferred channel: ${values.channel}.`
    };

    const validationErrors = validateContact(payloadToValidate);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('submitting');
    setServerError(null);

    // Build comprehensive message for backend triage
    const triageMessage = [
      values.message.trim(),
      values.reason ? `Reason: ${values.reason}` : '',
      values.city ? `Target City: ${values.city}` : '',
      values.hospital ? `Hospital: ${values.hospital}` : '',
      `Preferred Contact: ${values.channel}`
    ].filter(Boolean).join('\n\n');

    try {
      await api.submitContact({
        name: values.name.trim(),
        email: values.email.trim() || null,
        phone_e164: cleanPhone || null,
        subject: payloadToValidate.subject,
        message: triageMessage,
      });

      setStatus('success');
      track('CONTACT_INITIATED', {
        city: values.city,
        reason: values.reason,
        channel: values.channel
      });

      // Reset fields
      setValues({
        name: '',
        phone: '',
        email: '',
        city: '',
        reason: '',
        hospital: '',
        message: '',
        channel: 'Phone Call (Morning)'
      });
    } catch (err) {
      setStatus('error');
      setServerError(
        err.fieldErrors
          ? Object.values(err.fieldErrors).join(' ')
          : (err.message || 'Unable to submit your message. Please try again.')
      );
    }
  };

  return (
    <div className="contact-form-card">
      <div className="contact-form-header">
        <span className="contact-channel-eyebrow" style={{ color: 'var(--pub-primary)' }}>
          Inquiry &amp; Scheduling Desk
        </span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0', color: 'var(--pub-on-surface)' }}>
          Send a Care Coordination Request
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--pub-on-variant)', lineHeight: 1.5 }}>
          Fill out the details below. Our senior care counselor will evaluate your visit requirements and get back to you with confirmed companion availability.
        </p>
      </div>

      {serverError && (
        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.625rem',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '0.875rem',
          marginBottom: '1.25rem'
        }} role="alert">
          {serverError}
        </div>
      )}

      {status === 'success' && (
        <div className="contact-success-banner" role="status">
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#059669', flexShrink: 0 }}>
            task_alt
          </span>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
              Request Received
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
              A senior care counselor has received your information and is reviewing companion availability in your city. We will connect with you shortly.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: status === 'success' ? '1.5rem' : 0 }}>
        {/* Row 1: Name & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="contact-form-field">
            <label className="contact-form-label" htmlFor="contactFullName">
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="contactFullName"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Anand Murthy"
              value={values.name}
              onChange={handleChange('name')}
              className="contact-input"
            />
            {errors.name && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.name}</span>}
          </div>

          <div className="contact-form-field">
            <label className="contact-form-label" htmlFor="contactPhoneNumber">
              Phone Number <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="contact-phone-wrapper">
              <span className="contact-phone-prefix">+91</span>
              <input
                id="contactPhoneNumber"
                type="tel"
                required
                autoComplete="tel"
                placeholder="98765 43210"
                value={values.phone}
                onChange={handleChange('phone')}
                className="contact-input contact-phone-input"
              />
            </div>
            {errors.phone && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.phone}</span>}
          </div>
        </div>

        {/* Row 2: Email & Target City */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="contact-form-field">
            <label className="contact-form-label" htmlFor="contactEmail">
              Email Address <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              required
              autoComplete="email"
              placeholder="anand@example.com"
              value={values.email}
              onChange={handleChange('email')}
              className="contact-input"
            />
            {errors.email && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.email}</span>}
          </div>

          <div className="contact-form-field">
            <label className="contact-form-label" htmlFor="contactTargetCity">
              Target City / Metro <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="contactTargetCity"
              required
              value={values.city}
              onChange={handleChange('city')}
              className="contact-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>Select location</option>
              <option value="Bhimavaram">Bhimavaram (Active Service Hub)</option>
              <option value="Surrounding West Godavari">Surrounding West Godavari</option>
              <option value="Other">Other nearby area</option>
            </select>
          </div>
        </div>

        {/* Row 3: Reason for Contacting & Hospital Name */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="contact-form-field">
            <label className="contact-form-label" htmlFor="contactReason">
              Reason for Contacting <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="contactReason"
              required
              value={values.reason}
              onChange={handleChange('reason')}
              className="contact-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>Choose care requirement</option>
              <option value="Book Hospital Accompaniment">Book Hospital Accompaniment</option>
              <option value="Elderly Parent Doctor Visit">Elderly Parent Doctor Visit</option>
              <option value="Custom Recurring Care Coordination">Custom Recurring Care Coordination</option>
              <option value="Hospital Process &amp; TPA Billing Inquiry">Hospital Process &amp; TPA Billing Inquiry</option>
              <option value="General Question / Feedback">General Question / Feedback</option>
            </select>
          </div>

          <div className="contact-form-field">
            <label className="contact-form-label" htmlFor="contactHospital">
              Hospital / Medical Center Name <span style={{ fontSize: '0.75rem', color: 'var(--pub-on-variant)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="contactHospital"
              type="text"
              placeholder="e.g. Apollo Health City, Manipal Hospital"
              value={values.hospital}
              onChange={handleChange('hospital')}
              className="contact-input"
            />
          </div>
        </div>

        {/* Row 4: Care Message */}
        <div className="contact-form-field">
          <label className="contact-form-label" htmlFor="contactMessage">
            Message / Specific Care Needs <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="contactMessage"
            required
            rows={4}
            placeholder="Tell us about the patient's mobility, appointment schedule, or preferred language..."
            value={values.message}
            onChange={handleChange('message')}
            className="contact-textarea"
          />
          {errors.message && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.message}</span>}
        </div>

        {/* Row 5: Preferred Channel Selection Pills */}
        <div className="contact-form-field" style={{ marginTop: '0.25rem' }}>
          <span className="contact-form-label">
            Preferred Communication Channel
          </span>
          <div className="contact-channel-pills">
            {CHANNEL_OPTIONS.map((channel) => {
              const isSelected = values.channel === channel;
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => handleChannelSelect(channel)}
                  className={`contact-pill-btn ${isSelected ? 'active' : 'inactive'}`}
                >
                  {channel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 6: Submit Button */}
        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="contact-submit-btn"
          >
            {status === 'submitting' ? (
              <>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                  progress_activity
                </span>
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <span>Send Care Message</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
              </>
            )}
          </button>
          <p style={{ margin: '0.5rem 0 0 0', textAlign: 'center', fontSize: '0.75rem', color: 'var(--pub-on-variant)' }}>
            Our senior coordinator will respond within <strong>15 minutes</strong> during operating hours.
          </p>
        </div>

        {/* Privacy Note */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem', color: 'var(--pub-on-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--pub-primary)', marginTop: '1px' }}>
            lock
          </span>
          <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.45 }}>
            Your personal and medical scheduling details are kept strictly confidential under Indian healthcare data standards.
          </p>
        </div>
      </form>
    </div>
  );
}
