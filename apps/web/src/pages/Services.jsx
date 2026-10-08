import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { ResponsiveImage } from '../media.jsx';
import { useTranslatedText } from '../translate.jsx';
import { useDocumentMeta } from '../components/layout.jsx';
import { Icon } from '../components/public/Icon.jsx';

import '../components/services/services.css';
import { ServiceHero } from '../components/services/ServiceHero.jsx';
import { ServiceFilterBar } from '../components/services/ServiceFilterBar.jsx';
import { ServiceCard } from '../components/services/ServiceCard.jsx';
import { ServiceModal } from '../components/services/ServiceModal.jsx';
import { ServicePillars } from '../components/services/ServicePillars.jsx';
import { ServiceAssessmentCard } from '../components/services/ServiceAssessmentCard.jsx';

const CMS_BLOCK_KEYS = [
  'services.hero.eyebrow',
  'services.hero.badge',
  'services.hero.title',
  'services.hero.body',
  'services.hero.bento_title',
  'services.hero.bento_coverage',
  'services.pillar.1',
  'services.pillar.2',
  'services.pillar.3',
  'services.inquiry.title',
  'services.inquiry.body',
];

export function Services({ t, locale }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cmsBlocks, setCmsBlocks] = useState({});
  const [contactInfo, setContactInfo] = useState(null);
  const [hospitalCount, setHospitalCount] = useState('42+');

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalService, setModalService] = useState(null);

  useDocumentMeta('Care Offerings & Services', 'Compassionate on-ground hospital visit accompaniment and care coordination.');

  // Load all initial services, CMS blocks, and metadata
  useEffect(() => {
    let cancelled = false;

    const loadPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servicesRes, blocksRes, contactRes, hospitalsRes] = await Promise.allSettled([
          api.services({ limit: 50 }),
          api.blocks(CMS_BLOCK_KEYS),
          api.contactInfo(),
          api.hospitals({ limit: 1 }),
        ]);

        if (cancelled) return;

        if (servicesRes.status === 'fulfilled') {
          setData(servicesRes.value);
        } else {
          setError(servicesRes.reason);
        }

        if (blocksRes.status === 'fulfilled' && blocksRes.value) {
          setCmsBlocks(blocksRes.value);
        }

        if (contactRes.status === 'fulfilled' && contactRes.value) {
          setContactInfo(contactRes.value);
        }

        if (hospitalsRes.status === 'fulfilled' && hospitalsRes.value?.pagination?.total) {
          const total = hospitalsRes.value.pagination.total;
          setHospitalCount(total > 40 ? `${total}+` : `${total}`);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Multi-language translation setup
  const translationItems = useMemo(() => {
    return (data?.data ?? []).flatMap((s) => [
      { entity_type: 'services', entity_id: s.id, field: 'title_en' },
      { entity_type: 'services', entity_id: s.id, field: 'description_en' },
    ]);
  }, [data]);
  const tx = useTranslatedText(locale, translationItems);

  // Dynamic category counts
  const allServices = data?.data ?? [];
  const categoryCounts = useMemo(() => {
    const counts = { outpatient: 0, logistics: 0, administrative: 0, recurring: 0 };
    for (const s of allServices) {
      const cat = s.category || 'outpatient';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [allServices]);

  // Client-side filtering by category & search query
  const filteredServices = useMemo(() => {
    let list = allServices;
    if (activeCategory !== 'all') {
      list = list.filter((s) => (s.category || 'outpatient') === activeCategory);
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title_en?.toLowerCase().includes(term) ||
          s.description_en?.toLowerCase().includes(term) ||
          s.benefits_en?.some((b) => b.toLowerCase().includes(term)),
      );
    }
    return list;
  }, [allServices, activeCategory, searchQuery]);

  const handleSearchSubmit = (term) => {
    if (term) track('SEARCH_PERFORMED', { scope: 'services', query: term });
  };

  const handleOpenDetails = (service) => {
    setModalService(service);
    track('SERVICE_VIEWED', { service_slug: service.slug });
  };

  return (
    <div className="svc-page">
      {/* 1. Hero with Ambient Glow, Status Badge & Bento Card */}
      <ServiceHero
        heroBlocks={cmsBlocks}
        contactInfo={contactInfo}
        hospitalCount={hospitalCount}
        t={t}
      />

      {/* 2. Directory Section: Category Filter Bar + Cards Grid */}
      <section className="svc-directory-section">
        <div className="pub-container">
          <ServiceFilterBar
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            categoryCounts={categoryCounts}
            totalCount={allServices.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
          />

          {/* Directory Loading / Error States */}
          {error && (
            <div className="pub-empty" style={{ marginTop: '2rem' }}>
              <p>{t.loadError || 'Failed to load services.'}</p>
              <button
                type="button"
                className="pub-btn secondary"
                onClick={() => window.location.reload()}
                style={{ marginTop: 12 }}
              >
                {t.tryAgain || 'Try Again'}
              </button>
            </div>
          )}

          {loading && !error && (
            <div style={{ marginTop: '2.5rem' }} aria-busy="true" aria-live="polite">
              <div className="pub-skeleton" style={{ height: 28, width: '40%', marginBottom: 12 }} />
              <div className="pub-skeleton" style={{ height: 16, width: '70%', marginBottom: 24 }} />
              <div className="svc-grid">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="pub-skeleton" style={{ height: 380, borderRadius: 14 }} />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && filteredServices.length === 0 && (
            <div className="pub-empty" style={{ marginTop: '3rem', textAlign: 'center' }}>
              <p>{t.emptyServices || 'No services found matching your criteria.'}</p>
              <button
                type="button"
                className="pub-btn secondary"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                style={{ marginTop: 12 }}
              >
                View All Services
              </button>
            </div>
          )}

          {/* Service Cards Grid */}
          {!loading && !error && filteredServices.length > 0 && (
            <div className="svc-grid" style={{ marginTop: '2.5rem' }}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onOpenDetails={handleOpenDetails}
                  tx={tx}
                  isFeatured={service.slug === 'hospital-visit-accompaniment'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Guaranteed Standards: 3 Editorial Pillars */}
      <ServicePillars pillarBlocks={cmsBlocks} />

      {/* 4. Care Desk Assessment Inquiry Card & Direct Helpline */}
      <ServiceAssessmentCard
        services={allServices}
        inquiryBlocks={cmsBlocks}
      />

      {/* 5. Detail Modal Popup */}
      <ServiceModal
        service={modalService}
        onClose={() => setModalService(null)}
        tx={tx}
      />
    </div>
  );
}

export function ServiceDetail({ t, locale }) {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [error, setError] = useState(null);

  useDocumentMeta(service?.title_en ?? 'Service', service?.description_en?.slice(0, 150));

  const tx = useTranslatedText(
    locale,
    service
      ? [
          { entity_type: 'services', entity_id: service.id, field: 'title_en' },
          { entity_type: 'services', entity_id: service.id, field: 'description_en' },
        ]
      : [],
  );

  useEffect(() => {
    setService(null);
    setError(null);
    api
      .service(slug)
      .then((s) => {
        setService(s);
        track('SERVICE_VIEWED', { service_slug: slug });
      })
      .catch(setError);
  }, [slug]);

  if (error) {
    return (
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-empty">
            <p>{t.loadError || 'Failed to load service.'}</p>
            <p style={{ marginTop: 12 }}>
              <Link className="pub-link" to="/services">
                ← {t.ourServices || 'Back to Services'}
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-skeleton" style={{ height: 32, width: '50%', marginBottom: 12 }} />
          <div className="pub-skeleton" style={{ height: 16, width: '80%' }} />
        </div>
      </section>
    );
  }

  return (
    <section className="pub-section">
      <div className="pub-container" style={{ maxWidth: 760 }}>
        <p style={{ marginBottom: '1.25rem' }}>
          <Link className="pub-link" to="/services">
            ← {t.ourServices || 'All Services'}
          </Link>
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div
            className="pub-icon-tile"
            style={{
              background: 'rgba(0,67,73,.1)',
              color: 'var(--pub-primary)',
              margin: 0,
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={service.icon || 'calendar_month'} size={28} />
          </div>
          <div>
            <h1 className="pub-h2" style={{ margin: 0 }}>
              {tx('services', service.id, 'title_en', service.title_en)}
            </h1>
            {service.subtitle_en && (
              <p style={{ color: 'var(--pub-on-variant)', margin: '4px 0 0', fontWeight: 600 }}>
                {service.subtitle_en}
              </p>
            )}
          </div>
        </div>

        {service.image_url && (
          <div style={{ margin: '1.5rem 0' }}>
            {service.image_media_id ? (
              <ResponsiveImage
                mediaId={service.image_media_id}
                fallbackSrc={service.image_url}
                alt={service.title_en}
                style={{ width: '100%', borderRadius: 16 }}
              />
            ) : (
              <img
                src={service.image_url}
                alt={service.title_en}
                loading="lazy"
                style={{ width: '100%', borderRadius: 16 }}
              />
            )}
          </div>
        )}

        {service.description_en && (
          <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--pub-on-surface)' }}>
            {tx('services', service.id, 'description_en', service.description_en)}
          </p>
        )}

        {service.benefits_en?.length > 0 && (
          <div style={{ marginTop: 32, padding: '1.5rem', background: 'var(--pub-surface-low)', borderRadius: 12 }}>
            <h2 style={{ fontSize: 20, margin: '0 0 12px', fontWeight: 700 }}>Included In This Service</h2>
            <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {service.benefits_en.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                  <Icon name="check_circle" size={18} className="text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 36, display: 'flex', gap: 12 }}>
          <Link
            className="pub-btn"
            to={`/request-care?service=${encodeURIComponent(service.slug)}`}
            style={{ padding: '0.85rem 1.75rem', fontSize: 15 }}
          >
            {t.requestCare || 'Request Care'} <Icon name="arrow_forward" size={18} />
          </Link>
          <Link className="pub-btn secondary" to="/services">
            Back to Directory
          </Link>
        </div>
      </div>
    </section>
  );
}
