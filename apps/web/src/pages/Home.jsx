import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { useTranslatedText } from '../translate.jsx';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import { HeroJourney } from '../components/public/HeroJourney.jsx';
import { NeedSelector } from '../components/public/NeedSelector.jsx';
import { TrustStrip } from '../components/public/TrustStrip.jsx';
import { SectionHead, SectionHeadCenter } from '../components/public/SectionHead.jsx';
import { StepsPreview, Pillars } from '../components/public/Steps.jsx';
import { ServicesGrid, HospitalsGrid } from '../components/public/Cards.jsx';
import { FamilyCommunication } from '../components/public/FamilyCommunication.jsx';
import { TestimonialCards, FaqAccordion, FinalCta } from '../components/public/Closing.jsx';

// CMS block keys fetched in ONE batch request
const BLOCK_KEYS = [
  'home.disclaimer',
  'home.eyebrow', 'home.hero.title', 'home.hero.description',
  'home.hero.primary_label', 'home.hero.primary_url',
  'home.hero.secondary_label', 'home.hero.secondary_url',
  'home.journey.label',
  'home.need.eyebrow', 'home.need.title', 'home.need.sub',
  'home.trust.1', 'home.trust.2', 'home.trust.3', 'home.trust.4',
  'home.how.eyebrow', 'home.how.title', 'home.how.sub',
  'home.how.1', 'home.how.2', 'home.how.3', 'home.how.4', 'home.how.5',
  'home.how.meta.1', 'home.how.meta.2', 'home.how.meta.3', 'home.how.meta.4', 'home.how.meta.5',
  'home.services.eyebrow', 'home.services.title', 'home.services.sub',
  'home.hospitals.eyebrow', 'home.hospitals.title', 'home.hospitals.sub',
  'home.pillars.eyebrow', 'home.pillars.title', 'home.pillars.sub',
  'home.pillars.1', 'home.pillars.2', 'home.pillars.3', 'home.pillars.4',
  'home.family.eyebrow', 'home.family.title', 'home.family.sub',
  'home.family.1', 'home.family.2', 'home.family.3',
  'home.testimonials.eyebrow', 'home.testimonials.title', 'home.testimonials.sub',
  'home.faq.eyebrow', 'home.faq.title', 'home.faq.sub',
  'home.cta.eyebrow', 'home.cta.title', 'home.cta.body',
  'home.cta.primary_label', 'home.cta.primary_url',
  'home.cta.secondary_label', 'home.cta.secondary_url',
];

const textOf = (blocks, key) => blocks?.[key]?.body_en ?? blocks?.[key]?.title_en ?? null;

export function Home({ t, locale }) {
  const [data, setData] = useState(null);
  const [services, setServices] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [blocks, setBlocks] = useState(null);
  const [error, setError] = useState(null);

  useDocumentMeta('Hospital journey support', 'Coordination and accompaniment for hospital visits.');

  const load = async () => {
    setError(null);
    try {
      const [home, svc, hosp, blk] = await Promise.all([
        api.home(),
        api.services({ limit: 6 }),
        api.hospitals({ limit: 4 }),
        api.blocks(BLOCK_KEYS),
      ]);
      setData(home);
      setServices(svc.data);
      setHospitals(hosp.data);
      setBlocks(blk);
      track('HERO_VIEWED');
      track('NEED_SELECTOR_VIEWED');
    } catch (e) {
      setError(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => {
    const list = [];
    for (const s of data?.hero ?? []) {
      list.push({ entity_type: 'hero_slides', entity_id: s.id, field: 'title_en' });
      list.push({ entity_type: 'hero_slides', entity_id: s.id, field: 'description_en' });
    }
    for (const s of services ?? []) {
      list.push({ entity_type: 'services', entity_id: s.id, field: 'title_en' });
      list.push({ entity_type: 'services', entity_id: s.id, field: 'description_en' });
    }
    for (const h of hospitals ?? []) {
      list.push({ entity_type: 'hospitals', entity_id: h.id, field: 'name_en' });
      list.push({ entity_type: 'hospitals', entity_id: h.id, field: 'description_en' });
    }
    for (const f of data?.faqs ?? []) {
      list.push({ entity_type: 'faqs', entity_id: f.id, field: 'question_en' });
      list.push({ entity_type: 'faqs', entity_id: f.id, field: 'answer_en' });
    }
    for (const item of data?.testimonials ?? []) {
      list.push({ entity_type: 'testimonials', entity_id: item.id, field: 'quote_en' });
    }
    for (const [key, b] of Object.entries(blocks ?? {})) {
      if (b?.title_en) list.push({ entity_type: 'content_blocks', entity_id: key, field: 'title_en' });
      if (b?.body_en) list.push({ entity_type: 'content_blocks', entity_id: key, field: 'body_en' });
    }
    return list;
  }, [data, services, hospitals, blocks]);

  const tx = useTranslatedText(locale, items);
  const btx = (key, field = 'body_en') => {
    const b = blocks?.[key];
    if (!b) return null;
    return tx('content_blocks', key, field, b[field] ?? '');
  };

  if (error) return <LoadError t={t} onRetry={load} />;
  if (!data || !blocks) {
    return (
      <div className="pub-container" style={{ paddingTop: 48, paddingBottom: 56 }} aria-busy="true" aria-live="polite">
        <div className="pub-skeleton" style={{ height: 28, width: '40%', marginBottom: 12 }} />
        <div className="pub-skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
        <div className="pub-skeleton" style={{ height: 16, width: '55%' }} />
        <span className="sr-only">{t.loading}</span>
      </div>
    );
  }

  const steps = [1, 2, 3, 4, 5].map((n) => {
    const b = blocks[`home.how.${n}`];
    if (!b) return null;
    return { ...b, meta: textOf(blocks, `home.how.meta.${n}`) };
  }).filter(Boolean);

  const familyItems = [1, 2, 3].map((n) => {
    const b = blocks[`home.family.${n}`];
    if (!b) return null;
    return { title: b.title_en, desc: b.body_en, icon: b.icon };
  }).filter(Boolean);

  return (
    <>
      {/* 1. Hero */}
      <HeroJourney
        copy={{
          disclaimer: btx('home.disclaimer'),
          eyebrow: btx('home.eyebrow'),
          title: btx('home.hero.title'),
          description: btx('home.hero.description'),
          primaryLabel: btx('home.hero.primary_label'),
          primaryUrl: textOf(blocks, 'home.hero.primary_url'),
          secondaryLabel: btx('home.hero.secondary_label'),
          secondaryUrl: textOf(blocks, 'home.hero.secondary_url'),
          journeyLabel: btx('home.journey.label'),
        }}
        slides={data.hero}
        t={t}
        tx={tx}
      />

      {/* 2. Quick Need Selector */}
      <NeedSelector
        eyebrow={btx('home.need.eyebrow')}
        title={btx('home.need.title') ?? 'What do you need support with?'}
        sub={btx('home.need.sub')}
        services={services || []}
      />

      {/* 3. Supported Hospital Preview */}
      {hospitals && hospitals.length > 0 && (
        <section className="pub-section">
          <div className="pub-container">
            <SectionHead
              eyebrow={btx('home.hospitals.eyebrow')}
              title={btx('home.hospitals.title') ?? t.ourHospitals}
              sub={btx('home.hospitals.sub')}
              linkTo="/hospitals"
              linkLabel={t.learnMore}
            />
            <HospitalsGrid hospitals={hospitals} t={t} tx={tx} />
          </div>
        </section>
      )}

      {/* 4. How AayuYukthi Works */}
      {steps.length > 0 && (
        <section className="pub-section tint">
          <div className="pub-container">
            <SectionHead
              eyebrow={btx('home.how.eyebrow')}
              title={btx('home.how.title') ?? t.howTitle}
              sub={btx('home.how.sub')}
              linkTo="/how-it-works"
              linkLabel={t.learnMore}
            />
            <StepsPreview steps={steps} />
          </div>
        </section>
      )}

      {/* 5. Services */}
      {services && services.length > 0 && (
        <section className="pub-section">
          <div className="pub-container">
            <SectionHead
              eyebrow={btx('home.services.eyebrow')}
              title={btx('home.services.title') ?? t.ourServices}
              sub={btx('home.services.sub')}
              linkTo="/services"
              linkLabel={t.learnMore}
            />
            <ServicesGrid services={services} t={t} tx={tx} />
            <p style={{ marginTop: 24, textAlign: 'center' }}>
              <Link className="pub-btn" to="/services">{t.learnMore}</Link>
            </p>
          </div>
        </section>
      )}

      {/* 6. Trust / Value Section */}
      <TrustStrip items={[1, 2, 3, 4].map((n) => blocks[`home.trust.${n}`]).filter(Boolean)} />

      {(() => {
        const pillarList = [1, 2, 3, 4].map((n) => blocks[`home.pillars.${n}`]).filter(Boolean);
        if (pillarList.length === 0) return null;
        return (
          <section className="pub-section tint">
            <div className="pub-container">
              <SectionHeadCenter
                eyebrow={btx('home.pillars.eyebrow')}
                title={btx('home.pillars.title')}
                sub={btx('home.pillars.sub')}
              />
              <Pillars items={pillarList} />
            </div>
          </section>
        );
      })()}

      {/* 7. Family Communication */}
      <FamilyCommunication
        eyebrow={btx('home.family.eyebrow')}
        title={btx('home.family.title') ?? 'Complete Transparency for Family & Caregivers'}
        sub={btx('home.family.sub')}
        items={familyItems}
      />

      {/* Testimonials */}
      {data.testimonials.length > 0 && (
        <section className="pub-section tint">
          <div className="pub-container">
            <SectionHeadCenter
              eyebrow={btx('home.testimonials.eyebrow')}
              title={btx('home.testimonials.title') ?? t.testimonialsTitle}
              sub={btx('home.testimonials.sub')}
            />
            <TestimonialCards testimonials={data.testimonials} tx={tx} />
          </div>
        </section>
      )}

      {/* 8. FAQ */}
      {data.faqs.length > 0 && (
        <section className="pub-section">
          <div className="pub-container">
            <SectionHeadCenter
              eyebrow={btx('home.faq.eyebrow')}
              title={btx('home.faq.title') ?? t.faqsTitle}
              sub={btx('home.faq.sub')}
            />
            <FaqAccordion faqs={data.faqs} tx={tx} />
          </div>
        </section>
      )}

      {/* 9. Final CTA */}
      <section className="pub-section tint">
        <div className="pub-container">
          <FinalCta
            copy={{
              eyebrow: btx('home.cta.eyebrow'),
              title: btx('home.cta.title'),
              body: btx('home.cta.body'),
              primaryLabel: btx('home.cta.primary_label'),
              primaryUrl: textOf(blocks, 'home.cta.primary_url'),
              secondaryLabel: btx('home.cta.secondary_label'),
              secondaryUrl: textOf(blocks, 'home.cta.secondary_url'),
            }}
            requestLabel={t.requestCare}
          />
        </div>
      </section>
    </>
  );
}

export function HomeLoading({ t }) {
  return <Loading t={t} />;
}
