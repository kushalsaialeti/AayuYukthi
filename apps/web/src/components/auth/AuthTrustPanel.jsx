import React from 'react';

export function AuthTrustPanel({
  badgeText = 'AayuYukthi Family Access • Secure Care Portal',
  badgeIcon = 'verified_user',
  heading = 'Your family’s trusted companion through every hospital visit.',
  description = 'Access your active care requests, review hospital visit milestones in real time, and coordinate dedicated support for your parents or loved ones.',
  features = [],
  testimonial = null,
  socialProof = null,
  urgentHelp = null,
  theme = 'teal', // 'teal' | 'light' | 'white'
}) {
  const panelClass = theme === 'light'
    ? 'ay-auth-story-panel ay-auth-panel-light'
    : theme === 'white'
      ? 'ay-auth-story-panel ay-auth-panel-white'
      : 'ay-auth-story-panel';

  return (
    <section className={panelClass} aria-label="Brand and care trust story">
      {/* Decorative ambient glowing circles */}
      <div className="ay-glow-blob-1" aria-hidden="true" />
      <div className="ay-glow-blob-2" aria-hidden="true" />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Trust Badge */}
        {badgeText && (
          <div className="ay-auth-trust-badge">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {badgeIcon}
            </span>
            <span>{badgeText}</span>
          </div>
        )}

        {/* Narrative Headline & Body */}
        <h1 className="ay-auth-story-heading">{heading}</h1>
        {description && <p className="ay-auth-story-sub">{description}</p>}

        {/* Feature Value Props */}
        {features.length > 0 && (
          <div className="ay-auth-features">
            {features.map((f, i) => (
              <div key={i} className="ay-auth-feature-item">
                <div className="ay-auth-feature-icon">
                  <span className="material-symbols-outlined text-[22px]">{f.icon || 'check_circle'}</span>
                </div>
                <div>
                  <div className="ay-auth-feature-title">{f.title}</div>
                  <div className="ay-auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Urgent Helpline Box (e.g. for OTP mode) */}
        {urgentHelp && (
          <div className="ay-auth-urgent-box">
            <div className="ay-auth-urgent-icon">
              <span className="material-symbols-outlined text-[20px]">{urgentHelp.icon || 'emergency'}</span>
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ay-auth-on-secondary-fixed)' }}>
                {urgentHelp.title || 'Need Urgent Transit Assistance?'}
              </div>
              <a href={urgentHelp.tel || 'tel:180022982273'} className="ay-auth-urgent-link">
                <span>{urgentHelp.action || 'Call 1800-AAYU-CARE'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Editorial Testimonial Card */}
      {testimonial && (
        <div className="ay-auth-testimonial-box">
          <div className="ay-auth-stars" aria-label={`${testimonial.rating || 5} out of 5 stars`}>
            {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
              <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            ))}
          </div>
          <p className="ay-auth-quote">{testimonial.quote}</p>
          <div className="ay-auth-quote-meta">
            <span className="ay-auth-quote-author">{testimonial.author}</span>
            {testimonial.detail && <span>{testimonial.detail}</span>}
          </div>
        </div>
      )}

      {/* Social Proof Metric Card */}
      {socialProof && (
        <div className="ay-auth-social-proof">
          <div className="ay-auth-avatar-stack">
            <div className="ay-auth-avatars">
              <div className="ay-auth-avatar-chip ay-chip-1">AM</div>
              <div className="ay-auth-avatar-chip ay-chip-2">SK</div>
              <div className="ay-auth-avatar-chip ay-chip-3">RP</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>
                {socialProof.title || 'Trusted by 4,000+ Families'}
              </div>
              <div style={{ fontSize: '11.5px', opacity: 0.85, marginTop: '2px' }}>
                {socialProof.cities || 'Bengaluru • Hyderabad • Delhi NCR • Mumbai'}
              </div>
            </div>
          </div>
          {socialProof.quote && (
            <p style={{ fontSize: '12.5px', fontStyle: 'italic', opacity: 0.9, marginTop: '10px', lineHeight: 1.5, marginBottom: 0 }}>
              {socialProof.quote}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
