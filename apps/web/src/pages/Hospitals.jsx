import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { ResponsiveImage } from '../media.jsx';
import { useTranslatedText } from '../translate.jsx';
import { useDocumentMeta } from '../components/layout.jsx';
import { Icon } from '../components/public/Icon.jsx';

import '../components/hospitals/hospitals.css';
import { HospitalHero } from '../components/hospitals/HospitalHero.jsx';
import { HospitalFilterHub } from '../components/hospitals/HospitalFilterHub.jsx';
import { HospitalCard } from '../components/hospitals/HospitalCard.jsx';
import { HospitalStandards } from '../components/hospitals/HospitalStandards.jsx';
import { HospitalCustomBanner } from '../components/hospitals/HospitalCustomBanner.jsx';
import { HospitalCtaBanner } from '../components/hospitals/HospitalCtaBanner.jsx';

import { HospitalDetailHeader } from '../components/hospitals/HospitalDetailHeader.jsx';
import { HospitalCampusGuide } from '../components/hospitals/HospitalCampusGuide.jsx';
import { HospitalMeetingPoints } from '../components/hospitals/HospitalMeetingPoints.jsx';
import { HospitalSpecializedServices } from '../components/hospitals/HospitalSpecializedServices.jsx';
import { HospitalDepartments } from '../components/hospitals/HospitalDepartments.jsx';
import { HospitalVisitChecklist } from '../components/hospitals/HospitalVisitChecklist.jsx';
import { HospitalDetailFaqs } from '../components/hospitals/HospitalDetailFaqs.jsx';
import { HospitalBookingWidget } from '../components/hospitals/HospitalBookingWidget.jsx';
import { HospitalNearbyNetwork } from '../components/hospitals/HospitalNearbyNetwork.jsx';

const CMS_BLOCK_KEYS = [
  'hospitals.hero.eyebrow',
  'hospitals.hero.title',
  'hospitals.hero.body',
  'hospitals.hero.pill_1',
  'hospitals.hero.pill_2',
  'hospitals.standards.eyebrow',
  'hospitals.standards.title',
  'hospitals.standards.body',
  'hospitals.standard.1',
  'hospitals.standard.2',
  'hospitals.standard.3',
  'hospitals.custom.badge',
  'hospitals.custom.title',
  'hospitals.custom.body',
  'hospitals.cta.title',
  'hospitals.cta.body',
];

const PAGE_SIZE = 6;

export function Hospitals({ t, locale }) {
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cmsBlocks, setCmsBlocks] = useState({});
  const [contactInfo, setContactInfo] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);

  useDocumentMeta('Hospitals & Medical Centers', 'Premier tertiary and specialty healthcare centers supported by AayuYukthi companions.');

  // Load all initial hospitals and CMS blocks
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [hospRes, blocksRes, contactRes] = await Promise.allSettled([
          api.hospitals({ limit: 100 }),
          api.blocks(CMS_BLOCK_KEYS),
          api.contactInfo(),
        ]);

        if (cancelled) return;

        if (hospRes.status === 'fulfilled' && hospRes.value?.data) {
          setHospitals(hospRes.value.data);
        } else if (hospRes.status === 'rejected') {
          setError(hospRes.reason);
        }

        if (blocksRes.status === 'fulfilled' && blocksRes.value) {
          setCmsBlocks(blocksRes.value);
        }

        if (contactRes.status === 'fulfilled' && contactRes.value) {
          setContactInfo(contactRes.value);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Multi-language translation setup
  const translationItems = useMemo(() => {
    return hospitals.flatMap((h) => [
      { entity_type: 'hospitals', entity_id: h.id, field: 'name_en' },
      { entity_type: 'hospitals', entity_id: h.id, field: 'description_en' },
    ]);
  }, [hospitals]);
  const tx = useTranslatedText(locale, translationItems);

  // Derive unique city list and city counts
  const { cityList, cityCounts } = useMemo(() => {
    const counts = {};
    for (const h of hospitals) {
      if (h.city) {
        counts[h.city] = (counts[h.city] || 0) + 1;
      }
    }
    const list = Object.keys(counts).sort();
    return { cityList: list, cityCounts: counts };
  }, [hospitals]);

  // Filtering
  const filteredHospitals = useMemo(() => {
    let list = hospitals;

    if (selectedCity !== 'all') {
      list = list.filter((h) => h.city?.toLowerCase() === selectedCity.toLowerCase());
    }

    if (selectedSpecialty !== 'all') {
      const spec = selectedSpecialty.toLowerCase();
      list = list.filter((h) => {
        const desc = (h.description_en || '').toLowerCase();
        const features = (h.features_en || []).map((f) => f.toLowerCase());
        return (
          desc.includes(spec) ||
          features.some((f) => f.includes(spec)) ||
          (spec === 'oncology' && (desc.includes('cancer') || desc.includes('chemo'))) ||
          (spec === 'cardiology' && (desc.includes('heart') || desc.includes('cardiac'))) ||
          (spec === 'orthopedics' && (desc.includes('bone') || desc.includes('joint') || desc.includes('ortho'))) ||
          (spec === 'nephrology' && (desc.includes('dialysis') || desc.includes('kidney')))
        );
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((h) => {
        return (
          h.name_en?.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q) ||
          h.state?.toLowerCase().includes(q) ||
          h.address_en?.toLowerCase().includes(q) ||
          h.description_en?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [hospitals, selectedCity, selectedSpecialty, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCity, selectedSpecialty, searchQuery]);

  // Pagination calculation
  const totalItems = filteredHospitals.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedHospitals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredHospitals.slice(start, start + PAGE_SIZE);
  }, [filteredHospitals, page]);

  const handleApplyFilters = () => {
    if (searchQuery || selectedCity !== 'all' || selectedSpecialty !== 'all') {
      track('SEARCH_PERFORMED', {
        scope: 'hospitals',
        city: selectedCity,
        specialty: selectedSpecialty,
        query: searchQuery,
      });
    }
  };

  return (
    <div className="hsp-page">
      {/* 1. Spatial Anchor Breadcrumbs & Editorial Hero Header */}
      <HospitalHero heroBlocks={cmsBlocks} t={t} />

      {/* 2. Search & Multi-Tier Filter Control Hub */}
      <HospitalFilterHub
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedSpecialty={selectedSpecialty}
        onSpecialtyChange={setSelectedSpecialty}
        onApplyFilters={handleApplyFilters}
        cityList={cityList}
        cityCounts={cityCounts}
        totalCount={hospitals.length}
        showingCount={paginatedHospitals.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 3. Hospital Directory Grid Section */}
      <section className="hsp-directory-section">
        <div className="pub-container">
          {error && (
            <div className="pub-empty" style={{ marginTop: '2rem' }}>
              <p>{t.loadError || 'Failed to load hospitals.'}</p>
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
            <div aria-busy="true" aria-live="polite">
              <div className="hsp-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="pub-skeleton" style={{ height: 380, borderRadius: 16 }} />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && filteredHospitals.length === 0 && (
            <div className="pub-empty" style={{ marginTop: '3rem', textAlign: 'center' }}>
              <p>{t.emptyHospitals || 'No partner hospitals found matching your criteria.'}</p>
              <button
                type="button"
                className="pub-btn secondary"
                onClick={() => {
                  setSelectedCity('all');
                  setSelectedSpecialty('all');
                  setSearchQuery('');
                }}
                style={{ marginTop: 12 }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {!loading && !error && paginatedHospitals.length > 0 && (
            <>
              <div className={`hsp-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                {paginatedHospitals.map((hospital) => (
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    tx={tx}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Clean Pagination Controls */}
              {totalPages > 1 && (
                <div className="hsp-pagination">
                  <span className="hsp-pagination-text">
                    Page <strong>{page}</strong> of {totalPages} ({totalItems} total institutions)
                  </span>

                  <div className="hsp-pagination-controls">
                    <button
                      type="button"
                      className="hsp-page-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <Icon name="chevron_left" size={18} />
                      <span>Previous</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                      // Show first, last, and window around current page
                      if (
                        num === 1 ||
                        num === totalPages ||
                        (num >= page - 1 && num <= page + 1)
                      ) {
                        return (
                          <button
                            key={num}
                            type="button"
                            className={`hsp-page-btn ${page === num ? 'active' : ''}`}
                            onClick={() => setPage(num)}
                          >
                            {num}
                          </button>
                        );
                      }
                      if (num === page - 2 || num === page + 2) {
                        return <span key={num} style={{ padding: '0 4px', color: '#6f797a' }}>...</span>;
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      className="hsp-page-btn"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <span>Next</span>
                      <Icon name="chevron_right" size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4. Hospital Coordination Operational Standards Strip */}
      <HospitalStandards standardsBlocks={cmsBlocks} />

      {/* 5. Can't Find Your Hospital? Custom Request Banner */}
      <HospitalCustomBanner customBlocks={cmsBlocks} />

      {/* 6. Reusable Bottom Action CTA Banner */}
      <HospitalCtaBanner ctaBlocks={cmsBlocks} contactInfo={contactInfo} />
    </div>
  );
}

export function HospitalDetail({ t, locale }) {
  const { slug } = useParams();
  const [hospital, setHospital] = useState(null);
  const [services, setServices] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [error, setError] = useState(null);

  useDocumentMeta(hospital?.name_en ?? 'Hospital', hospital?.description_en?.slice(0, 150));

  const linkedItems = useMemo(() => {
    const list = hospital
      ? [
          { entity_type: 'hospitals', entity_id: hospital.id, field: 'name_en' },
          { entity_type: 'hospitals', entity_id: hospital.id, field: 'description_en' },
        ]
      : [];
    for (const s of services) list.push({ entity_type: 'services', entity_id: s.id, field: 'title_en' });
    return list;
  }, [hospital, services]);
  const tx = useTranslatedText(locale, linkedItems);

  useEffect(() => {
    setHospital(null);
    setError(null);
    api
      .hospital(slug)
      .then(async (h) => {
        setHospital(h);
        track('HOSPITAL_VIEWED', { hospital_slug: slug });
        if (h.service_ids?.length) {
          const all = await api.services({ limit: 100 });
          setServices(all.data.filter((s) => h.service_ids.includes(s.id)));
        }
      })
      .catch(setError);

    // Fetch nearby partner hospitals for the network section
    api
      .hospitals({ limit: 4 })
      .then((res) => {
        setNearbyHospitals(res?.data || []);
      })
      .catch(() => {});
  }, [slug]);

  if (error) {
    return (
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-empty">
            <p>{t.loadError || 'Failed to load hospital campus guide.'}</p>
            <p style={{ marginTop: 12 }}>
              <Link className="pub-link" to="/hospitals">
                ← {t.ourHospitals || 'Back to Hospitals'}
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!hospital) {
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
    <div className="hsp-detail-wrap">
      {/* Ambient background glows */}
      <div className="hsp-detail-glow-1" />
      <div className="hsp-detail-glow-2" />

      {/* 1 & 2: Breadcrumbs, Status, Hero Card & Non-Affiliation Disclaimer */}
      <HospitalDetailHeader hospital={hospital} tx={tx} />

      {/* 3: Two-Column Main Content & Booking Layout */}
      <div className="hsp-detail-layout">
        {/* LEFT COLUMN: Campus Geography, Meeting Points, Services, Depts, Checklist, FAQs */}
        <div className="hsp-detail-main-col">
          <HospitalCampusGuide hospital={hospital} />

          <HospitalMeetingPoints hospital={hospital} />

          <HospitalSpecializedServices hospital={hospital} services={services} />

          <HospitalDepartments hospital={hospital} />

          <HospitalVisitChecklist hospital={hospital} />

          <HospitalDetailFaqs hospital={hospital} />
        </div>

        {/* RIGHT COLUMN: Sticky Booking Widget, Coordinator Lead, Urgent Desk, Campus Logistics */}
        <div className="hsp-detail-side-col">
          <HospitalBookingWidget hospital={hospital} />
        </div>
      </div>

      {/* 4: Other Supported Hospitals Nearby in Hub Network */}
      <HospitalNearbyNetwork currentHospital={hospital} nearbyList={nearbyHospitals} />
    </div>
  );
}
