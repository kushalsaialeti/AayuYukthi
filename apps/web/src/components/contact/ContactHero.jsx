import React from 'react';
import { Link } from 'react-router-dom';

// Hero copy comes exclusively from CMS contact blocks — no invented fallback
// text and no live wait-time widget (wait times cannot be verified).
export function ContactHero({ blocks, contact }) {
  void contact;
  const safeBlocks = blocks || {};
  const eyebrow = safeBlocks['contact.hero.eyebrow']?.body_en || null;
  const title = safeBlocks['contact.hero.title']?.body_en || null;
  const subtitle = safeBlocks['contact.hero.subtitle']?.body_en || null;

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
          {eyebrow && (
            <div className="contact-pulse-badge">
              <span className="contact-pulse-dot" />
              <span>{eyebrow}</span>
            </div>
          )}

          {title && <h1 className="contact-hero-title">{title}</h1>}
          {subtitle && <p className="contact-hero-sub">{subtitle}</p>}
        </div>
      </section>
    </>
  );
}
