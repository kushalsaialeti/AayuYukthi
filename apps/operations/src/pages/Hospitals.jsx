import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Field, ErrorAlert, EmptyState, StatusBadge, useFormState } from '../components/ui.jsx';
import { ImageUploadField } from '../components/ImageUploadField.jsx';
import { useToast } from '../components/OpsToast.jsx';

const ENTITY = 'hospitals';

export function HospitalsList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      setData(await api.list(ENTITY, q ? { q, limit: 100 } : { limit: 100 }));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => { load(); }, []);

  const removeHospital = async (hospital) => {
    if (!window.confirm(`Are you sure you want to delete hospital "${hospital.name_en}"? This will permanently remove it from the database.`)) return;
    try {
      await api.delete(ENTITY, hospital.id);
      toast.success(`Hospital "${hospital.name_en}" deleted successfully`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete hospital');
    }
  };

  const items = data?.data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ops-primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
            <span>Bhimavaram &amp; Surrounding Hub Network</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--ops-on-surface)' }}>
            Partner Hospitals &amp; Clinics
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            Gate instructions, rendezvous points, and pre-scouted wheelchair logistics for hospital check-ins.
          </p>
        </div>

        <Link to="/hospitals/new" className="ops-btn ops-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          <span>Add Partner Hospital</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="ops-card" style={{ padding: '1rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '0.5rem', maxWidth: '32rem' }}>
          <input
            className="ops-input"
            placeholder="Search hospitals by name, area, or protocol…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: '0.5rem 0.75rem' }}
          />
          <button className="ops-btn ops-btn-secondary" type="submit">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            <span>Search</span>
          </button>
        </form>
      </div>

      <ErrorAlert error={error} onRetry={load} />

      {!data && !error && (
        <p style={{ textAlign: 'center', color: 'var(--ops-outline)', padding: '2rem' }}>
          Loading Bhimavaram partner hospitals…
        </p>
      )}

      {data && items.length === 0 && (
        <EmptyState
          title="No partner hospitals found"
          message={q ? "No hospitals matched your search query." : "No partner hospitals registered in the database."}
          action={
            <Link to="/hospitals/new" className="ops-btn ops-btn-primary">
              Register First Hospital
            </Link>
          }
        />
      )}

      {data && items.length > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: '3.5rem' }}>Logo</th>
                <th>Hospital &amp; Campus</th>
                <th>City &amp; Area</th>
                <th>Pre-scouted Gate Rendezvous</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id}>
                  <td>
                    {h.logo_url || h.image_url ? (
                      <img
                        src={h.logo_url || h.image_url}
                        alt={h.name_en}
                        style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--ops-surface-container-low)',
                        color: 'var(--ops-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>apartment</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ops-on-surface)', fontSize: '0.9375rem' }}>
                        {h.name_en}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
                        /{h.slug}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{h.city || 'Bhimavaram'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>{h.state || 'Andhra Pradesh'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ops-on-surface-variant)', maxWidth: '18rem', display: 'inline-block', lineHeight: 1.35 }}>
                      {h.campus_highlight_en || h.wait_info_en || 'Gate 1 Porch Wheelchair Rendezvous'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                    {h.contact_phone || '—'}
                  </td>
                  <td>
                    <StatusBadge value={h.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/hospitals/${h.id}`} className="ops-btn ops-btn-secondary ops-btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                        <span>Edit Protocol</span>
                      </Link>
                      <button
                        type="button"
                        className="ops-btn ops-btn-danger ops-btn-sm"
                        onClick={() => removeHospital(h)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EMPTY_HOSPITAL = {
  name_en: '',
  slug: '',
  description_en: '',
  city: 'Hyderabad',
  state: 'Telangana',
  address_en: '',
  pincode: '',
  contact_phone: '',
  contact_email: '',
  website: '',
  image_url: '',
  logo_url: '',
  wait_info_en: '',
  campus_highlight_en: '',
  features_en: '',
  tag_en: 'Premier Healthcare Hub',
  rating: 4.9,
  assisted_visits_count: '250+ assisted visits',
  campus_size_en: '',
  map_image_url: '',
  visiting_hours_en: '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM',
  parking_info_en: 'Valet & Visitor Parking Available at Main Gate',
  pharmacy_info_en: '24/7 Pharmacy on Ground Floor',
  disclaimer_en: '',
  campus_guide_en: '',
  zones: [],
  meeting_points: [],
  specialized_services: [],
  departments_en: '',
  checklist_en: '',
  faqs: [],
  station_lead: {
    name: '',
    role: '',
    avatar_url: '',
    rating: '4.98',
    visits: '400+ visits',
    languages: 'Fluent in Telugu, Hindi & English',
    certification: 'BLS (Basic Life Support) Certified',
  },
  status: 'published',
  is_visible: true,
};

export function HospitalForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [values, set, setValues] = useFormState(EMPTY_HOSPITAL);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api.get(ENTITY, id).then((d) => setValues({
      ...EMPTY_HOSPITAL,
      ...d,
      pincode: d.pincode ?? '',
      image_url: d.image_url ?? '',
      logo_url: d.logo_url ?? '',
      wait_info_en: d.wait_info_en ?? '',
      campus_highlight_en: d.campus_highlight_en ?? '',
      features_en: (d.features_en ?? []).join('\n'),
      tag_en: d.tag_en ?? 'Premier Healthcare Hub',
      rating: d.rating !== undefined ? d.rating : 4.9,
      assisted_visits_count: d.assisted_visits_count ?? '250+ assisted visits',
      campus_size_en: d.campus_size_en ?? '',
      map_image_url: d.map_image_url ?? '',
      visiting_hours_en: d.visiting_hours_en ?? '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM',
      parking_info_en: d.parking_info_en ?? 'Valet & Visitor Parking Available at Main Gate',
      pharmacy_info_en: d.pharmacy_info_en ?? '24/7 Pharmacy on Ground Floor',
      disclaimer_en: d.disclaimer_en ?? '',
      campus_guide_en: d.campus_guide_en ?? '',
      zones: Array.isArray(d.zones) ? d.zones : [],
      meeting_points: Array.isArray(d.meeting_points) ? d.meeting_points : [],
      specialized_services: Array.isArray(d.specialized_services) ? d.specialized_services : [],
      departments_en: Array.isArray(d.departments_en) ? d.departments_en.join('\n') : '',
      checklist_en: Array.isArray(d.checklist_en) ? d.checklist_en.join('\n') : '',
      faqs: Array.isArray(d.faqs) ? d.faqs : [],
      station_lead: typeof d.station_lead === 'object' && d.station_lead !== null
        ? { ...EMPTY_HOSPITAL.station_lead, ...d.station_lead }
        : EMPTY_HOSPITAL.station_lead,
    })).catch(setError);
  }, [id]);

  // Dynamic Array Handlers
  const handleZoneChange = (index, field, val) => {
    setValues((prev) => {
      const copy = [...prev.zones];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, zones: copy };
    });
  };

  const addZone = () => {
    setValues((prev) => ({
      ...prev,
      zones: [
        ...prev.zones,
        { code: `Block ${String.fromCharCode(65 + prev.zones.length)}`, title: '', description: '', location: '', icon: 'stairs' },
      ],
    }));
  };

  const removeZone = (index) => {
    setValues((prev) => ({
      ...prev,
      zones: prev.zones.filter((_, i) => i !== index),
    }));
  };

  const handleMeetingPointChange = (index, field, val) => {
    setValues((prev) => {
      const copy = [...prev.meeting_points];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, meeting_points: copy };
    });
  };

  const addMeetingPoint = () => {
    setValues((prev) => ({
      ...prev,
      meeting_points: [
        ...prev.meeting_points,
        { step: prev.meeting_points.length + 1, title: '', badge: 'Primary Pick-up', description: '', landmark: '' },
      ],
    }));
  };

  const removeMeetingPoint = (index) => {
    setValues((prev) => ({
      ...prev,
      meeting_points: prev.meeting_points.filter((_, i) => i !== index),
    }));
  };

  const handleSpecializedServiceChange = (index, field, val) => {
    setValues((prev) => {
      const copy = [...prev.specialized_services];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, specialized_services: copy };
    });
  };

  const addSpecializedService = () => {
    setValues((prev) => ({
      ...prev,
      specialized_services: [
        ...prev.specialized_services,
        { title: '', description: '', icon: 'timer', full_width: false },
      ],
    }));
  };

  const removeSpecializedService = (index) => {
    setValues((prev) => ({
      ...prev,
      specialized_services: prev.specialized_services.filter((_, i) => i !== index),
    }));
  };

  const handleFaqChange = (index, field, val) => {
    setValues((prev) => {
      const copy = [...prev.faqs];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, faqs: copy };
    });
  };

  const addFaq = () => {
    setValues((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
  };

  const removeFaq = (index) => {
    setValues((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleStationLeadChange = (field, val) => {
    setValues((prev) => ({
      ...prev,
      station_lead: { ...prev.station_lead, [field]: val },
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const nullIfEmpty = (v) => (v?.trim() ? v.trim() : null);

    const body = {
      name_en: values.name_en.trim(),
      slug: values.slug.trim() || undefined,
      description_en: values.description_en,
      city: values.city.trim(),
      state: values.state.trim(),
      address_en: nullIfEmpty(values.address_en),
      pincode: nullIfEmpty(values.pincode),
      contact_phone: nullIfEmpty(values.contact_phone),
      contact_email: nullIfEmpty(values.contact_email),
      website: nullIfEmpty(values.website),
      image_url: nullIfEmpty(values.image_url),
      logo_url: nullIfEmpty(values.logo_url),
      wait_info_en: nullIfEmpty(values.wait_info_en),
      campus_highlight_en: nullIfEmpty(values.campus_highlight_en),
      features_en: values.features_en.split('\n').map((f) => f.trim()).filter(Boolean),
      tag_en: values.tag_en.trim() || 'Premier Healthcare Hub',
      rating: Number(values.rating) || 4.9,
      assisted_visits_count: values.assisted_visits_count.trim() || '250+ assisted visits',
      campus_size_en: values.campus_size_en.trim(),
      map_image_url: nullIfEmpty(values.map_image_url),
      visiting_hours_en: values.visiting_hours_en.trim(),
      parking_info_en: values.parking_info_en.trim(),
      pharmacy_info_en: values.pharmacy_info_en.trim(),
      disclaimer_en: values.disclaimer_en.trim(),
      campus_guide_en: values.campus_guide_en.trim(),
      zones: values.zones.filter((z) => z.title?.trim() || z.code?.trim()),
      meeting_points: values.meeting_points.filter((m) => m.title?.trim()),
      specialized_services: values.specialized_services.filter((s) => s.title?.trim()),
      departments_en: values.departments_en.split('\n').map((d) => d.trim()).filter(Boolean),
      checklist_en: values.checklist_en.split('\n').map((c) => c.trim()).filter(Boolean),
      faqs: values.faqs.filter((f) => f.question?.trim()),
      station_lead: values.station_lead.name?.trim() ? values.station_lead : {},
      status: values.status,
      is_visible: values.is_visible,
    };

    try {
      if (isNew) {
        await api.create(ENTITY, body);
        toast.success(`Hospital "${values.name_en}" registered successfully!`);
      } else {
        await api.update(ENTITY, id, body);
        toast.success(`Hospital "${values.name_en}" campus guide updated!`);
      }
      navigate('/hospitals');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to save hospital details');
    } finally {
      setBusy(false);
    }
  };

  const removeCurrentHospital = async () => {
    if (!window.confirm(`Are you sure you want to delete hospital "${values.name_en}"? This will permanently remove it from the database.`)) return;
    try {
      await api.delete(ENTITY, id);
      toast.success(`Hospital "${values.name_en}" deleted successfully`);
      navigate('/hospitals');
    } catch (err) {
      toast.error(err.message || 'Failed to delete hospital');
    }
  };

  return (
    <div style={{ maxWidth: '1040px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/hospitals" className="ops-btn ops-btn-secondary ops-btn-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          <span>Back to Partner Hospitals</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isNew && (
            <button
              type="button"
              className="ops-btn ops-btn-danger ops-btn-sm"
              onClick={removeCurrentHospital}
              disabled={busy}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
              <span>Delete Hospital</span>
            </button>
          )}
          <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            {isNew ? 'New Partner Hospital' : `ID: ${id}`}
          </span>
        </div>
      </div>

      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              local_hospital
            </span>
            <span>{isNew ? 'Register Partner Hospital Campus' : `Edit Campus Guide: ${values.name_en}`}</span>
          </h2>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <ErrorAlert error={error} />

          {/* Section 1: Basic Identification & Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Basic Identification &amp; Location
            </span>

            <div className="ops-form-grid ops-form-grid-2">
              <Field label="Hospital Name" required error={error?.fieldErrors?.name_en}>
                <input
                  className="ops-input"
                  placeholder="e.g. Apollo Health City — Jubilee Hills"
                  value={values.name_en}
                  onChange={set('name_en')}
                  required
                />
              </Field>

              <Field label="URL Slug" hint="Auto-derived if left empty" error={error?.fieldErrors?.slug}>
                <input
                  className="ops-input"
                  placeholder="e.g. apollo-health-city-jubilee-hills"
                  value={values.slug}
                  onChange={set('slug')}
                />
              </Field>
            </div>

            <div className="ops-form-grid ops-form-grid-3">
              <Field label="City Hub">
                <input
                  className="ops-input"
                  value={values.city}
                  onChange={set('city')}
                  placeholder="Hyderabad"
                  required
                />
              </Field>

              <Field label="State">
                <input
                  className="ops-input"
                  value={values.state}
                  onChange={set('state')}
                  placeholder="Telangana"
                  required
                />
              </Field>

              <Field label="Pincode">
                <input
                  className="ops-input"
                  value={values.pincode}
                  onChange={set('pincode')}
                  placeholder="500033"
                />
              </Field>
            </div>

            <Field label="Full Campus Address / Landmark">
              <input
                className="ops-input"
                placeholder="Road No. 72, Opposite Bharatiya Vidya Bhavan, Film Nagar, Jubilee Hills, Hyderabad"
                value={values.address_en ?? ''}
                onChange={set('address_en')}
              />
            </Field>

            <Field label="Campus Overview Description">
              <textarea
                className="ops-textarea"
                rows={3}
                placeholder="High-level overview of the hospital institution, clinical faculties, and services available…"
                value={values.description_en}
                onChange={set('description_en')}
              />
            </Field>

            <div className="ops-form-grid ops-form-grid-2">
              <ImageUploadField
                label="Hospital Campus Exterior Photo"
                value={values.image_url || ''}
                onChange={(url) => setValues((v) => ({ ...v, image_url: url }))}
                hint="Exterior hospital building photography displayed on Landing Page and Campus Guide. If left empty, an architectural wireframe is displayed."
              />

              <ImageUploadField
                label="Hospital Logo / Brand Emblem"
                value={values.logo_url || ''}
                onChange={(url) => setValues((v) => ({ ...v, logo_url: url }))}
                hint="Official hospital logo or clinic insignia."
              />
            </div>
          </div>

          {/* Section 2: Recognition, Badges & Non-Affiliation Notice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Trust Badges, Telemetry &amp; Non-Affiliated Notice
            </span>

            <div className="ops-form-grid ops-form-grid-3">
              <Field label="Category Tag" hint="Top hero badge">
                <input
                  className="ops-input"
                  placeholder="e.g. Premier Healthcare Hub"
                  value={values.tag_en}
                  onChange={set('tag_en')}
                />
              </Field>

              <Field label="Campus Rating (0 - 5.0)">
                <input
                  className="ops-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={values.rating}
                  onChange={set('rating')}
                />
              </Field>

              <Field label="Assisted Visits Count">
                <input
                  className="ops-input"
                  placeholder="e.g. 3,400+ assisted visits"
                  value={values.assisted_visits_count}
                  onChange={set('assisted_visits_count')}
                />
              </Field>
            </div>

            <Field label="Non-Affiliation Notice / Care Coordination Disclaimer" hint="Crucial legal notice clarifying companion vs hospital role">
              <textarea
                className="ops-textarea"
                rows={2}
                placeholder="AayuYukthi is an independent companion and care coordination provider. We provide logistical, escort, and process advocacy for patients visiting this hospital; we do not provide medical treatment or represent hospital administration."
                value={values.disclaimer_en}
                onChange={set('disclaimer_en')}
              />
            </Field>
          </div>

          {/* Section 3: Campus Geography, Size & Zones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Campus Geography &amp; Zone Blocks ({values.zones.length})
              </span>
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={addZone}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                <span>Add Zone / Block</span>
              </button>
            </div>

            <div className="ops-form-grid ops-form-grid-2">
              <Field label="Campus Acreage / Size Pill">
                <input
                  className="ops-input"
                  placeholder="e.g. 35-Acre Facility, 12-Acre Campus"
                  value={values.campus_size_en}
                  onChange={set('campus_size_en')}
                />
              </Field>

              <Field label="Campus Geography Overview">
                <input
                  className="ops-input"
                  placeholder="Sprawling multi-acre campus summary and walking advice…"
                  value={values.campus_guide_en}
                  onChange={set('campus_guide_en')}
                />
              </Field>
            </div>

            {/* Zone Cards List */}
            {values.zones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {values.zones.map((zone, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--ops-radius-md)',
                      backgroundColor: 'var(--ops-surface-container-low)',
                      border: '1px solid var(--ops-outline-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ops-primary)' }}>
                        Zone #{idx + 1}
                      </span>
                      <button
                        type="button"
                        className="ops-btn ops-btn-danger ops-btn-sm"
                        onClick={() => removeZone(idx)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="ops-form-grid ops-form-grid-3">
                      <Field label="Code / Block Label">
                        <input
                          className="ops-input"
                          placeholder="e.g. Block A, Main Tower"
                          value={zone.code || ''}
                          onChange={(e) => handleZoneChange(idx, 'code', e.target.value)}
                        />
                      </Field>
                      <Field label="Zone Title">
                        <input
                          className="ops-input"
                          placeholder="e.g. OPD & Central Registrations"
                          value={zone.title || ''}
                          onChange={(e) => handleZoneChange(idx, 'title', e.target.value)}
                        />
                      </Field>
                      <Field label="Floor / Location & Icon">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            className="ops-input"
                            placeholder="e.g. Lobby & Level 1"
                            value={zone.location || ''}
                            onChange={(e) => handleZoneChange(idx, 'location', e.target.value)}
                          />
                          <input
                            className="ops-input"
                            style={{ width: '5.5rem' }}
                            placeholder="stairs"
                            value={zone.icon || 'stairs'}
                            title="Material Symbol icon name"
                            onChange={(e) => handleZoneChange(idx, 'icon', e.target.value)}
                          />
                        </div>
                      </Field>
                    </div>

                    <Field label="Zone Description">
                      <input
                        className="ops-input"
                        placeholder="e.g. Multi-specialty consultation chambers, token dispensers, and records archive."
                        value={zone.description || ''}
                        onChange={(e) => handleZoneChange(idx, 'description', e.target.value)}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Designated Meeting Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                4. Designated Coordination Meeting Points ({values.meeting_points.length})
              </span>
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={addMeetingPoint}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                <span>Add Meeting Point</span>
              </button>
            </div>

            {values.meeting_points.map((pt, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--ops-radius-md)',
                  backgroundColor: 'var(--ops-surface-container-low)',
                  border: '1px solid var(--ops-outline-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '9999px',
                      background: 'var(--ops-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.875rem' }}>Rendezvous Point #{idx + 1}</strong>
                  </div>
                  <button
                    type="button"
                    className="ops-btn ops-btn-danger ops-btn-sm"
                    onClick={() => removeMeetingPoint(idx)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                    <span>Remove</span>
                  </button>
                </div>

                <div className="ops-form-grid ops-form-grid-2">
                  <Field label="Point Name / Location">
                    <input
                      className="ops-input"
                      placeholder="e.g. Gate 1 Main Porch & Wheelchair Drop-off"
                      value={pt.title || ''}
                      onChange={(e) => handleMeetingPointChange(idx, 'title', e.target.value)}
                    />
                  </Field>
                  <Field label="Point Badge">
                    <input
                      className="ops-input"
                      placeholder="e.g. Primary Pick-up, Oncology Wing, Short-Stay Hub"
                      value={pt.badge || ''}
                      onChange={(e) => handleMeetingPointChange(idx, 'badge', e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Detailed Instructions & Arrival Advisory">
                  <textarea
                    className="ops-textarea"
                    rows={2}
                    placeholder="Located directly opposite the Valet Reception. Coordinator awaits with a pre-sanitized hospital wheelchair…"
                    value={pt.description || ''}
                    onChange={(e) => handleMeetingPointChange(idx, 'description', e.target.value)}
                  />
                </Field>

                <Field label="Physical Landmark Anchor">
                  <input
                    className="ops-input"
                    placeholder="e.g. Under the main portico canopy next to Pillar 4"
                    value={pt.landmark || ''}
                    onChange={(e) => handleMeetingPointChange(idx, 'landmark', e.target.value)}
                  />
                </Field>
              </div>
            ))}
          </div>

          {/* Section 5: Specialized On-Ground Coordination Services */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                5. Specialized Campus Services ({values.specialized_services.length})
              </span>
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={addSpecializedService}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                <span>Add Specialized Service</span>
              </button>
            </div>

            {values.specialized_services.map((srv, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--ops-radius-md)',
                  backgroundColor: 'var(--ops-surface-container-low)',
                  border: '1px solid var(--ops-outline-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ops-primary)' }}>
                    Specialized Service #{idx + 1}
                  </span>
                  <button
                    type="button"
                    className="ops-btn ops-btn-danger ops-btn-sm"
                    onClick={() => removeSpecializedService(idx)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                    <span>Remove</span>
                  </button>
                </div>

                <div className="ops-form-grid ops-form-grid-3">
                  <Field label="Service Title">
                    <input
                      className="ops-input"
                      placeholder="e.g. OPD Token Tracking & Wait Minimization"
                      value={srv.title || ''}
                      onChange={(e) => handleSpecializedServiceChange(idx, 'title', e.target.value)}
                    />
                  </Field>
                  <Field label="Icon Name">
                    <input
                      className="ops-input"
                      placeholder="timer, accessible_forward, medication"
                      value={srv.icon || 'timer'}
                      onChange={(e) => handleSpecializedServiceChange(idx, 'icon', e.target.value)}
                    />
                  </Field>
                  <div style={{ paddingTop: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={!!srv.full_width}
                        onChange={(e) => handleSpecializedServiceChange(idx, 'full_width', e.target.checked)}
                      />
                      <span>Full Width Card</span>
                    </label>
                  </div>
                </div>

                <Field label="Service Workflow Description">
                  <textarea
                    className="ops-textarea"
                    rows={2}
                    placeholder="We monitor real-time queue attendance, hold place in line, and guide patients to quiet waiting areas…"
                    value={srv.description || ''}
                    onChange={(e) => handleSpecializedServiceChange(idx, 'description', e.target.value)}
                  />
                </Field>
              </div>
            ))}
          </div>

          {/* Section 6: Frequently Assisted Clinical Departments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              6. Frequently Assisted Clinical Departments
            </span>

            <Field label="Clinical Specialties List" hint="Enter one department per line. Icons will automatically map.">
              <textarea
                className="ops-textarea"
                rows={4}
                placeholder="Cardiology & Cath Lab&#10;Neurology & Stroke Care&#10;Joint Replacement & Ortho&#10;Medical Oncology & Chemo&#10;Nephrology & Dialysis&#10;Geriatric Comprehensive"
                value={values.departments_en}
                onChange={set('departments_en')}
              />
            </Field>
          </div>

          {/* Section 7: Patient Preparation Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              7. Patient Visit Preparation Checklist
            </span>

            <Field label="Checklist Items" hint="Enter one item per line. Format: Title — Description">
              <textarea
                className="ops-textarea"
                rows={4}
                placeholder="Hospital UHID / Registration Card — If you have visited previously, bring the UHID number to skip duplicate registration fees.&#10;Recent Medical Prescriptions & Diagnostics File — Historical ECGs, blood chemistries, and discharge summaries from the last 12 months.&#10;Government Photo ID & Insurance Physical Card — Aadhaar Card or PAN Card for the patient, alongside original corporate/TPA health card."
                value={values.checklist_en}
                onChange={set('checklist_en')}
              />
            </Field>
          </div>

          {/* Section 8: Facility Station Lead Coordinator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              8. Facility Station Lead Coordinator
            </span>

            <div className="ops-form-grid ops-form-grid-2">
              <Field label="Lead Coordinator Name">
                <input
                  className="ops-input"
                  placeholder="e.g. Rajesh Varma"
                  value={values.station_lead.name || ''}
                  onChange={(e) => handleStationLeadChange('name', e.target.value)}
                />
              </Field>

              <Field label="Lead Coordinator Role">
                <input
                  className="ops-input"
                  placeholder="e.g. Senior Coordinator (Apollo Station)"
                  value={values.station_lead.role || ''}
                  onChange={(e) => handleStationLeadChange('role', e.target.value)}
                />
              </Field>
            </div>

            <div className="ops-form-grid ops-form-grid-2">
              <Field label="Rating">
                <input
                  className="ops-input"
                  placeholder="e.g. 4.98"
                  value={values.station_lead.rating || ''}
                  onChange={(e) => handleStationLeadChange('rating', e.target.value)}
                />
              </Field>

              <Field label="Visits Experience">
                <input
                  className="ops-input"
                  placeholder="e.g. 410+ visits"
                  value={values.station_lead.visits || ''}
                  onChange={(e) => handleStationLeadChange('visits', e.target.value)}
                />
              </Field>
            </div>

            <div className="ops-form-grid ops-form-grid-2">
              <Field label="Languages Fluent">
                <input
                  className="ops-input"
                  placeholder="e.g. Fluent in Telugu, Hindi & English"
                  value={values.station_lead.languages || ''}
                  onChange={(e) => handleStationLeadChange('languages', e.target.value)}
                />
              </Field>

              <Field label="Clinical Certification">
                <input
                  className="ops-input"
                  placeholder="e.g. BLS (Basic Life Support) Certified"
                  value={values.station_lead.certification || ''}
                  onChange={(e) => handleStationLeadChange('certification', e.target.value)}
                />
              </Field>
            </div>

            <ImageUploadField
              label="Station Lead Profile Photo"
              value={values.station_lead.avatar_url || ''}
              onChange={(url) => handleStationLeadChange('avatar_url', url)}
              hint="Headshot avatar displayed on hospital booking card."
            />
          </div>

          {/* Section 9: Practical Campus Logistics & Operations Desk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              9. Practical Campus Logistics &amp; Operational Desk
            </span>

            <div className="ops-form-grid ops-form-grid-3">
              <Field label="Visiting Hours">
                <input
                  className="ops-input"
                  placeholder="10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM"
                  value={values.visiting_hours_en}
                  onChange={set('visiting_hours_en')}
                />
              </Field>

              <Field label="Valet &amp; Parking Details">
                <input
                  className="ops-input"
                  placeholder="Available at Gate 1 & Gate 4 (₹50 first 2h)"
                  value={values.parking_info_en}
                  onChange={set('parking_info_en')}
                />
              </Field>

              <Field label="Central Pharmacy Hours">
                <input
                  className="ops-input"
                  placeholder="24/7 Service directly on Ground Floor, Block A"
                  value={values.pharmacy_info_en}
                  onChange={set('pharmacy_info_en')}
                />
              </Field>
            </div>

            <div className="ops-form-grid ops-form-grid-2">
              <Field label="Gate Rendezvous Protocol" hint="Displayed in patient dashboard">
                <input
                  className="ops-input"
                  placeholder="Rendezvous: Gate 1 Main Porch. Direct wheelchair ramp to OP Block."
                  value={values.campus_highlight_en ?? ''}
                  onChange={set('campus_highlight_en')}
                />
              </Field>

              <Field label="Token &amp; Queue Protocol" hint="Companion arrival briefing">
                <input
                  className="ops-input"
                  placeholder="OP token counter opens at 8:30 AM. Arrive 15 min prior."
                  value={values.wait_info_en ?? ''}
                  onChange={set('wait_info_en')}
                />
              </Field>
            </div>
          </div>

          {/* Section 10: Campus Visuals & Floor Plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              10. Campus Visuals, Floor Plan &amp; Logo
            </span>

            <ImageUploadField
              label="Interactive Campus Floor Plan / Map"
              value={values.map_image_url ?? ''}
              onChange={(url) => setValues((prev) => ({ ...prev, map_image_url: url }))}
              helper="High-res layout or floor plan preview. Opened in zoom lightbox by patients."
            />

            <ImageUploadField
              label="Campus Building / Exterior Photo"
              value={values.image_url ?? ''}
              onChange={(url) => setValues((prev) => ({ ...prev, image_url: url }))}
              helper="High-quality photo of hospital facade or exterior."
            />

            <ImageUploadField
              label="Hospital Emblem / Logo"
              value={values.logo_url ?? ''}
              onChange={(url) => setValues((prev) => ({ ...prev, logo_url: url }))}
              helper="Hospital brand logo or crest."
            />
          </div>

          {/* Section 11: Campus Specific FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                11. Frequently Asked Questions ({values.faqs.length})
              </span>
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={addFaq}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                <span>Add FAQ</span>
              </button>
            </div>

            {values.faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--ops-radius-md)',
                  backgroundColor: 'var(--ops-surface-container-low)',
                  border: '1px solid var(--ops-outline-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ops-primary)' }}>
                    FAQ #{idx + 1}
                  </span>
                  <button
                    type="button"
                    className="ops-btn ops-btn-danger ops-btn-sm"
                    onClick={() => removeFaq(idx)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                    <span>Remove</span>
                  </button>
                </div>

                <Field label="Question">
                  <input
                    className="ops-input"
                    placeholder="e.g. Where exactly does my companion meet me at this hospital?"
                    value={faq.question || ''}
                    onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                  />
                </Field>

                <Field label="Answer">
                  <textarea
                    className="ops-textarea"
                    rows={2}
                    placeholder="By default, your coordinator meets you at Gate 1 Main Porch 15 minutes prior to appointment time…"
                    value={faq.answer || ''}
                    onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                  />
                </Field>
              </div>
            ))}
          </div>

          {/* Section 12: Contact, Publication & Visibility */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              12. Contact, Publication &amp; Directory Visibility
            </span>

            <div className="ops-form-grid ops-form-grid-3">
              <Field label="Direct Hospital Phone">
                <input
                  className="ops-input"
                  placeholder="+91-40-XXXXXX"
                  value={values.contact_phone ?? ''}
                  onChange={set('contact_phone')}
                />
              </Field>

              <Field label="Contact Email">
                <input
                  className="ops-input"
                  type="email"
                  placeholder="contact@hospital.example"
                  value={values.contact_email ?? ''}
                  onChange={set('contact_email')}
                />
              </Field>

              <Field label="Website Link">
                <input
                  className="ops-input"
                  placeholder="https://hospital.example"
                  value={values.website ?? ''}
                  onChange={set('website')}
                />
              </Field>
            </div>

            <div className="ops-form-grid ops-form-grid-2" style={{ alignItems: 'center' }}>
              <Field label="Publication Status">
                <select className="ops-select" value={values.status} onChange={set('status')}>
                  <option value="published">Published (Active Campus)</option>
                  <option value="draft">Draft (Verification Pending)</option>
                  <option value="archived">Archived / Standby</option>
                </select>
              </Field>

              <div style={{ paddingTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={values.is_visible}
                    onChange={set('is_visible')}
                    style={{ width: '1.15rem', height: '1.15rem' }}
                  />
                  <span>Visible on Public Hospital Directory</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <button type="submit" className="ops-btn ops-btn-primary" disabled={busy}>
              {busy ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span>
                  <span>Saving Campus Guide…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  <span>Save Campus Details</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="ops-btn ops-btn-secondary"
              onClick={() => navigate('/hospitals')}
            >
              Cancel
            </button>
            {!isNew && (
              <button
                type="button"
                className="ops-btn ops-btn-danger"
                onClick={removeCurrentHospital}
                disabled={busy}
                style={{ marginLeft: 'auto' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                <span>Delete</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
