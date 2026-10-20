import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../../analytics.js';
import { ResponsiveImage } from '../../media.jsx';
import { FirstVisitScopeModal } from './FirstVisitScopeModal.jsx';

// 5 Stages with 2 simple, daily-usage workflows per step
export const DEFAULT_STAGES = [
  {
    step: 1,
    shortLabel: 'Book',
    simpleTitle: 'Step 1: Book Your Visit',
    point1Icon: 'event_available',
    point1Title: 'Book with or without appointment',
    point1Desc: 'Choose your date, time, and hospital in just a minute.',
    point2Icon: 'chat',
    point2Title: 'Instant WhatsApp confirmation',
    point2Desc: 'We review your request and confirm all details quickly on WhatsApp.',
    ctaText: 'Book Care Now',
    ctaUrl: '/request-care',
    secondaryCtaText: 'How It Works',
    secondaryCtaUrl: '/how-it-works',
    fallbackImage: '/hero/hero_stage_1.jpg',
  },
  {
    step: 2,
    shortLabel: 'Pickup',
    simpleTitle: 'Step 2: Caretaker & Doorstep Pickup',
    point1Icon: 'person_pin',
    point1Title: 'Caretaker assigned 1 hour before',
    point1Desc: "You get the caretaker's photo, name, and phone number in advance.",
    point2Icon: 'directions_car',
    point2Title: 'Doorstep pickup on time',
    point2Desc: 'A clean car arrives at your home to pick you up safely.',
    ctaText: 'Schedule Pickup',
    ctaUrl: '/request-care',
    secondaryCtaText: 'Our Services',
    secondaryCtaUrl: '/services',
    fallbackImage: '/hero/hero_stage_2.jpg',
  },
  {
    step: 3,
    shortLabel: 'Hospital',
    simpleTitle: 'Step 3: Hospital Care & Regular Updates',
    point1Icon: 'local_hospital',
    point1Title: 'Full help inside the hospital',
    point1Desc: 'Your caretaker stays by your side through lines, tests, and doctor visits.',
    point2Icon: 'schedule',
    point2Title: 'Updates every 30 minutes',
    point2Desc: 'Family gets peace of mind with live messages on WhatsApp every half hour.',
    ctaText: 'See Hospital Support',
    ctaUrl: '/services',
    secondaryCtaText: 'Partner Hospitals',
    secondaryCtaUrl: '/hospitals',
    fallbackImage: '/hero/hero_stage_3.jpg',
  },
  {
    step: 4,
    shortLabel: 'Return',
    simpleTitle: 'Step 4: Medicines & Safe Ride Home',
    point1Icon: 'medication',
    point1Title: 'Prescriptions & medicines collected',
    point1Desc: 'We collect doctor prescriptions, lab test reports, and pharmacy medicines.',
    point2Icon: 'home',
    point2Title: 'Safe drop right to your door',
    point2Desc: 'We drive you back home safely and assist you right inside your house.',
    ctaText: 'Book Safe Return',
    ctaUrl: '/how-it-works',
    secondaryCtaText: 'Help & Contact',
    secondaryCtaUrl: '/contact',
    fallbackImage: '/hero/hero_stage_4.jpg',
  },
  {
    step: 5,
    shortLabel: 'Pay',
    simpleTitle: 'Step 5: Simple Check & Easy Payment',
    point1Icon: 'payments',
    point1Title: 'Pay after service is done',
    point1Desc: 'Pay easily using UPI or cash only after you are safely back home.',
    point2Icon: 'check_circle',
    point2Title: 'Zero advance required',
    point2Desc: 'No advance deposit or hidden fees. Simple, caring, and trustworthy.',
    ctaText: 'Start Your First Visit',
    ctaUrl: '/request-care',
    secondaryCtaText: 'View Pricing',
    secondaryCtaUrl: '/services',
    fallbackImage: '/hero/hero_stage_5.jpg',
  },
];

const AUTOPLAY_INTERVAL = 3300; // 3.3 seconds continuous smooth transition

export function HeroJourney({ copy = {}, slides = [], t = {}, tx }) {
  // Use up to 5 slides from CMS, or fallback stages
  const rawSlides = (slides ?? []).slice(0, 5);
  const stages = DEFAULT_STAGES.map((def, i) => {
    const cms = rawSlides[i];
    return {
      ...def,
      cmsId: cms?.id,
      imageUrl: cms?.image_url || def.fallbackImage,
      imageMediaId: cms?.image_media_id,
      ctaText: cms?.primary_cta_label_en || def.ctaText,
      ctaUrl: cms?.primary_cta_url || def.ctaUrl,
      secondaryCtaText: cms?.secondary_cta_label_en || def.secondaryCtaText,
      secondaryCtaUrl: cms?.secondary_cta_url || def.secondaryCtaUrl,
    };
  });

  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const timerRef = useRef(null);

  const total = stages.length;
  const currentStage = stages[index] ?? stages[0];

  const goToSlide = useCallback((nextIdx) => {
    setIndex((nextIdx + total) % total);
    setProgressKey((k) => k + 1);
  }, [total]);

  // Autoplay timer runs continuously every 3.3s without pausing on hover
  useEffect(() => {
    timerRef.current = setInterval(() => {
      goToSlide(index + 1);
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, goToSlide]);

  return (
    <section className="pub-hero" aria-label="AayuYukthi Hospital Accompaniment Platform">
      <div className="pub-container">
        {/* Top Disclaimer Ribbon: Single-line pill on mobile, full disclaimer on desktop */}
        <div
          className="pub-ribbon"
          onClick={() => setShowScopeModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowScopeModal(true);
            }
          }}
          aria-label="Safety Scope & Eligibility Check"
        >
          <span className="material-symbols-outlined pub-ribbon-shield" aria-hidden="true">
            health_and_safety
          </span>

          {/* Compact single line on mobile with shield button — no bulged-out text */}
          <span className="pub-ribbon-mobile-text">
            <span>Safety Scope &amp; Eligibility Check</span>
            <span className="material-symbols-outlined pub-ribbon-mobile-chevron" aria-hidden="true">
              chevron_right
            </span>
          </span>

          {/* Full explanation and action button on desktop / tablet screens */}
          <span className="pub-ribbon-desktop-text">
            <strong>Non-Emergency Accompaniment:</strong> Compassionate outpatient care coordination &amp; hospital assistance.
          </span>
          <button
            type="button"
            className="pub-ribbon-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowScopeModal(true);
            }}
            aria-label="View safety scope & eligibility"
          >
            Safety Scope &amp; Eligibility
          </button>
        </div>

        {/* Hero Two-Column Grid: Clean Left Copy + Enlarged Right Picture Frame */}
        <div className="pub-hero-grid">
          {/* LEFT: Clean, spacious text in daily-usage language */}
          <div className="pub-hero-copy">
            {/* Eyebrow */}
            <div className="pub-pill-eyebrow">
              <span className="dot" aria-hidden="true" />
              <span>{copy.eyebrow || 'DOOR-TO-DOOR HOSPITAL CARE'}</span>
            </div>

            {/* Headline in 1-2 clean lines */}
            <h1 className="pub-hero-title">
              {copy.title || 'Stress-Free Hospital Visits for Your Loved Ones'}
            </h1>

            {/* Subtitle in simple, daily usage language */}
            <p className="pub-hero-subtitle">
              {copy.description ||
                'We pick up your parents from home, accompany them through doctor visits and hospital lines, and bring them back safely.'}
            </p>

            {/* Step Workflow Box: 2 simple points for the current step */}
            <div className="pub-step-workflow-card" aria-live="polite">
              <div className="pub-step-workflow-head">
                <span className="pub-step-tag">Step {index + 1} of {total}</span>
                <span className="pub-step-headline">{currentStage.simpleTitle}</span>
              </div>

              <div className="pub-step-items">
                <div className="pub-step-item">
                  <div className="pub-step-icon-wrap" aria-hidden="true">
                    <span className="material-symbols-outlined">{currentStage.point1Icon}</span>
                  </div>
                  <div className="pub-step-item-body">
                    <strong>{currentStage.point1Title}</strong>
                    <p>{currentStage.point1Desc}</p>
                  </div>
                </div>

                <div className="pub-step-item">
                  <div className="pub-step-icon-wrap" aria-hidden="true">
                    <span className="material-symbols-outlined">{currentStage.point2Icon}</span>
                  </div>
                  <div className="pub-step-item-body">
                    <strong>{currentStage.point2Title}</strong>
                    <p>{currentStage.point2Desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic CTAs: Text changes per stage with clear forward arrow */}
            <div className="pub-hero-ctas">
              <Link
                key={`cta-${index}`}
                to={currentStage.ctaUrl}
                className="pub-btn pub-btn-primary dynamic-hero-cta"
                onClick={() => track('CTA_CLICKED', { cta: `hero_step_${index + 1}`, label: currentStage.ctaText })}
              >
                <span>{currentStage.ctaText}</span>
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </Link>

              {currentStage.secondaryCtaText && (
                <Link
                  to={currentStage.secondaryCtaUrl}
                  className="pub-btn secondary"
                  onClick={() => track('CTA_CLICKED', { cta: 'hero_secondary' })}
                >
                  <span>{currentStage.secondaryCtaText}</span>
                </Link>
              )}
            </div>

            {/* Progressive Bar Buttons for Steps 1, 2, 3, 4, 5 (Entire button indicates progress) */}
            <div className="pub-progress-buttons-box">
              <div className="pub-progress-buttons-header">
                <span className="pub-progress-caption">Service Flow </span>
                <span className="pub-progress-indicator">{index + 1} / {total}</span>
              </div>

              <div className="pub-progress-buttons-grid" role="tablist" aria-label="Slideshow steps">
                {stages.map((stg, i) => {
                  const isCurrent = i === index;
                  const isPast = i < index;
                  return (
                    <button
                      key={stg.step}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      className={`pub-stage-prog-btn ${isCurrent ? 'active' : ''} ${isPast ? 'past' : ''}`}
                      onClick={() => goToSlide(i)}
                      title={stg.simpleTitle}
                    >
                      {/* Entire button progress fill background */}
                      <span
                        key={isCurrent ? `fill-${progressKey}` : `static-${i}`}
                        className={`pub-stage-prog-fill ${isCurrent ? 'animating' : ''} ${isPast ? 'filled' : ''}`}
                        style={isCurrent ? { animationDuration: `${AUTOPLAY_INTERVAL}ms` } : {}}
                      />

                      {/* Content on top */}
                      <span className="pub-stage-prog-inner">
                        <span className="pub-stage-prog-num">{i + 1}</span>
                        <span className="pub-stage-prog-text">{stg.shortLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Enlarged Picture Frame (Clean, high-res picture, no text on image) */}
          <div className="pub-hero-stage">
            <div
              className="pub-picture-frame"
              role="region"
              aria-roledescription="carousel"
              aria-label="Workflow Pictures Slideshow"
            >
              {stages.map((stg, i) => {
                const isCurrent = i === index;
                return (
                  <div
                    key={stg.step}
                    className={`pub-picture-slide ${isCurrent ? 'active' : 'inactive'}`}
                    aria-hidden={!isCurrent}
                  >
                    {stg.imageMediaId ? (
                      <ResponsiveImage
                        mediaId={stg.imageMediaId}
                        fallbackSrc={stg.imageUrl}
                        alt={`AayuYukthi ${stg.simpleTitle}`}
                        eager={i === 0}
                        widths={[768, 1200, 1600]}
                        className="pub-picture-img"
                      />
                    ) : (
                      <img
                        src={stg.imageUrl}
                        alt={`AayuYukthi ${stg.simpleTitle}`}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        className="pub-picture-img"
                      />
                    )}
                  </div>
                );
              })}

              {/* Picture Frame Navigation Buttons & Counter */}
              <div className="pub-picture-controls">
                <button
                  type="button"
                  className="pub-picture-nav-btn"
                  onClick={() => goToSlide(index - 1)}
                  aria-label="Previous image"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <div className="pub-picture-counter">
                  <span>{index + 1}</span>
                  <span className="pub-counter-sep">/</span>
                  <span>{total}</span>
                </div>

                <button
                  type="button"
                  className="pub-picture-nav-btn"
                  onClick={() => goToSlide(index + 1)}
                  aria-label="Next image"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opening Popup Layover Modal: First Visit or First Refresh */}
      <FirstVisitScopeModal
        forceOpen={showScopeModal}
        onClose={() => setShowScopeModal(false)}
      />
    </section>
  );
}
