import React from 'react';
import { Link } from 'react-router-dom';

export function ContactHero({ blocks, contact }) {
  const safeBlocks = blocks || {};
  const eyebrow = safeBlocks['contact.hero.eyebrow']?.body_en ||
    'WE ARE HERE FOR YOUR FAMILY • CARE COORDINATION HELPLINE';
  const title = safeBlocks['contact.hero.title']?.body_en ||
    'How can we help your family today?';
  const subtitle = safeBlocks['contact.hero.subtitle']?.body_en ||
    'Whether you have an upcoming hospital consultation, need urgent next-day accompaniment, or wish to plan custom recurring elder care, our dedicated care counseling desk is ready to support you.';
  const waitTime = safeBlocks['contact.live.wait_time']?.body_en || '38 seconds';

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="contact-breadcrumb-wrap">
        <nav className="contact-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', opacity: 0.6 }}>chevron_right</span>
          <span className="current">Contact Us</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="contact-hero-section">
        <div className="contact-hero-content">
          <div className="contact-pulse-badge">
            <span className="contact-pulse-dot" />
            <span>{eyebrow}</span>
          </div>

          <h1 className="contact-hero-title">{title}</h1>
          <p className="contact-hero-sub">{subtitle}</p>

          <div className="contact-live-pill">
            <div className="contact-live-pill-status">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
              <span>Care Desk Live Now</span>
            </div>
            <span className="contact-live-pill-dot">•</span>
            <span>Average telephone wait: <strong>{waitTime}</strong></span>
          </div>
        </div>
      </section>
    </>
  );
}
