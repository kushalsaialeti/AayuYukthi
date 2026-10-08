import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Field, ErrorAlert, EmptyState, StatusBadge, useFormState } from '../components/ui.jsx';
import { ImageUploadField } from '../components/ImageUploadField.jsx';
import { useToast } from '../components/OpsToast.jsx';

const ENTITY = 'services';

export function ServicesList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      setData(await api.list(ENTITY, q ? { q } : {}));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => { load(); }, []);

  const removeService = async (service) => {
    if (!window.confirm(`Are you sure you want to delete service "${service.title_en}"? This will permanently remove it from the database.`)) return;
    try {
      await api.delete(ENTITY, service.id);
      toast.success(`Service "${service.title_en}" deleted successfully`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete service');
    }
  };

  const items = data?.data || [];
  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((s) => (s.category || 'outpatient') === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--ops-on-surface)' }}>
            Care Packages &amp; Services
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            Manage accompaniment packages displayed on the public website and customer portal.
          </p>
        </div>

        <Link to="/services/new" className="ops-btn ops-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          <span>New Care Package</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="ops-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '28rem' }}>
          <input
            className="ops-input"
            placeholder="Search services by title or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: '0.5rem 0.75rem' }}
          />
          <button className="ops-btn ops-btn-secondary" type="submit">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            <span>Search</span>
          </button>
        </form>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
          {['all', 'outpatient', 'logistics', 'administrative', 'recurring'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className="ops-btn ops-btn-sm"
              style={{
                backgroundColor: selectedCategory === cat ? 'var(--ops-primary-container)' : 'var(--ops-surface-container-low)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--ops-on-surface-variant)',
                textTransform: 'capitalize'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <ErrorAlert error={error} onRetry={load} />

      {!data && !error && (
        <p style={{ textAlign: 'center', color: 'var(--ops-outline)', padding: '2rem' }}>
          Loading services catalog…
        </p>
      )}

      {data && filteredItems.length === 0 && (
        <EmptyState
          title="No care services found"
          message={q ? "No services match your search query." : "No services created in this category yet."}
          action={
            <Link to="/services/new" className="ops-btn ops-btn-primary">
              Create First Service
            </Link>
          }
        />
      )}

      {data && filteredItems.length > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: '4rem' }}>Icon</th>
                <th>Package Title</th>
                <th>Category</th>
                <th>Fee Line</th>
                <th>Status</th>
                <th>Visibility</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: 'var(--ops-radius-md)',
                      backgroundColor: 'rgba(0, 67, 73, 0.08)',
                      color: 'var(--ops-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {s.icon || 'medical_services'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ops-on-surface)', fontSize: '0.9375rem' }}>
                        {s.title_en}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
                        /{s.slug}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--ops-radius-pill)',
                      backgroundColor: 'var(--ops-surface-container)',
                      color: 'var(--ops-on-surface-variant)',
                      textTransform: 'capitalize'
                    }}>
                      {s.category || 'outpatient'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)' }}>
                    {s.subtitle_en || '—'}
                  </td>
                  <td>
                    <StatusBadge value={s.status} />
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      color: s.is_visible ? 'var(--ops-success)' : 'var(--ops-outline)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        {s.is_visible ? 'visibility' : 'visibility_off'}
                      </span>
                      {s.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/services/${s.id}`} className="ops-btn ops-btn-secondary ops-btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                        <span>Edit</span>
                      </Link>
                      <button
                        type="button"
                        className="ops-btn ops-btn-danger ops-btn-sm"
                        onClick={() => removeService(s)}
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

const EMPTY_SERVICE = {
  title_en: '',
  slug: '',
  description_en: '',
  benefits_en: '',
  subtitle_en: '',
  icon: '',
  image_url: '',
  category: 'outpatient',
  sort_order: 0,
  status: 'draft',
  is_visible: true
};

export function ServiceForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [values, set, setValues] = useFormState(EMPTY_SERVICE);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api.get(ENTITY, id).then((d) => setValues({
      ...d,
      slug: d.slug ?? '',
      benefits_en: (d.benefits_en ?? []).join('\n'),
      subtitle_en: d.subtitle_en ?? '',
      icon: d.icon ?? '',
      image_url: d.image_url ?? '',
      category: d.category ?? 'outpatient',
      sort_order: d.sort_order ?? 0,
    })).catch(setError);
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      ...values,
      slug: values.slug.trim() || undefined,
      subtitle_en: values.subtitle_en?.trim?.() ?? values.subtitle_en ?? '',
      icon: values.icon?.trim?.() || null,
      image_url: values.image_url?.trim?.() || null,
      category: values.category || 'outpatient',
      sort_order: Number(values.sort_order) || 0,
      benefits_en: values.benefits_en.split('\n').map((b) => b.trim()).filter(Boolean),
    };
    try {
      if (isNew) {
        await api.create(ENTITY, body);
        toast.success(`Care package "${values.title_en}" created successfully!`);
      } else {
        await api.update(ENTITY, id, body);
        toast.success(`Care package "${values.title_en}" updated successfully!`);
      }
      navigate('/services');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to save service');
    } finally {
      setBusy(false);
    }
  };

  const removeCurrentService = async () => {
    if (!window.confirm(`Are you sure you want to delete service "${values.title_en}"? This will permanently remove it from the database.`)) return;
    try {
      await api.delete(ENTITY, id);
      toast.success(`Service "${values.title_en}" deleted successfully`);
      navigate('/services');
    } catch (err) {
      toast.error(err.message || 'Failed to delete service');
    }
  };

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Breadcrumb row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/services"
          className="ops-btn ops-btn-secondary ops-btn-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          <span>Back to Services</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isNew && (
            <button
              type="button"
              className="ops-btn ops-btn-danger ops-btn-sm"
              onClick={removeCurrentService}
              disabled={busy}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
              <span>Delete Service</span>
            </button>
          )}
          <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            {isNew ? 'New Entry' : `ID: ${id}`}
          </span>
        </div>
      </div>

      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              medical_services
            </span>
            <span>{isNew ? 'Create Care Accompaniment Package' : `Edit: ${values.title_en || 'Service'}`}</span>
          </h2>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <ErrorAlert error={error} />

          {/* Core Info */}
          <div className="ops-form-grid ops-form-grid-2">
            <Field label="Package Title" required error={error?.fieldErrors?.title_en}>
              <input
                className="ops-input"
                placeholder="e.g. Full-Day Outpatient Accompaniment"
                value={values.title_en}
                onChange={set('title_en')}
                required
              />
            </Field>

            <Field label="Category">
              <select className="ops-select" value={values.category ?? 'outpatient'} onChange={set('category')}>
                <option value="outpatient">Outpatient &amp; Doctor Visits</option>
                <option value="logistics">Logistics &amp; Transport</option>
                <option value="administrative">Hospital &amp; Administrative</option>
                <option value="recurring">Chronic &amp; Recurring Care</option>
              </select>
            </Field>
          </div>

          <div className="ops-form-grid ops-form-grid-2">
            <Field label="URL Slug" hint="Auto-derived if empty" error={error?.fieldErrors?.slug}>
              <input
                className="ops-input"
                placeholder="e.g. full-day-outpatient"
                value={values.slug}
                onChange={set('slug')}
              />
            </Field>

            <Field label="Card Pricing / Footer Line" hint="Shown on landing page cards">
              <input
                className="ops-input"
                placeholder="e.g. Starting ₹499 / Visit • Wheelchair Ready"
                value={values.subtitle_en ?? ''}
                onChange={set('subtitle_en')}
              />
            </Field>
          </div>

          {/* Icon with Live Preview */}
          <div className="ops-form-grid ops-form-grid-2" style={{ alignItems: 'flex-start' }}>
            <Field label="Material Symbol Icon" hint="e.g. local_hospital, accessible, healing" error={error?.fieldErrors?.icon}>
              <input
                className="ops-input"
                placeholder="calendar_month"
                value={values.icon ?? ''}
                onChange={set('icon')}
              />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span className="ops-form-label">Icon Preview</span>
              <div style={{
                height: '44px',
                padding: '0 1rem',
                borderRadius: 'var(--ops-radius-md)',
                backgroundColor: 'var(--ops-surface-container-low)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--ops-primary)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  {values.icon || 'medical_services'}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                  {values.icon || 'default (medical_services)'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Field label="Full Description">
            <textarea
              className="ops-textarea"
              rows={4}
              placeholder="Comprehensive details of what the care companion and driver will handle during this hospital journey…"
              value={values.description_en}
              onChange={set('description_en')}
            />
          </Field>

          {/* Benefits bullets */}
          <Field label="Key Inclusions / Benefits" hint="Enter one bullet point per line">
            <textarea
              className="ops-textarea"
              rows={4}
              placeholder="Doorstep vehicle rendezvous&#10;Wheelchair logistics pre-arranged&#10;Doctor notes summary PDF&#10;OPD queue standing support"
              value={values.benefits_en}
              onChange={set('benefits_en')}
            />
          </Field>

          {/* Image Upload */}
          <ImageUploadField
            label="Service Banner Graphic / Cover Image"
            value={values.image_url ?? ''}
            onChange={(url) => setValues((prev) => ({ ...prev, image_url: url }))}
            helper="Upload from your computer or phone, paste Google Drive image URL, or direct link. Compressed as WebP for low latency."
          />

          {/* Status & Options */}
          <div className="ops-form-grid ops-form-grid-3" style={{ alignItems: 'center' }}>
            <Field label="Publication Status">
              <select className="ops-select" value={values.status} onChange={set('status')}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <Field label="Display Priority / Sort Order">
              <input
                className="ops-input"
                type="number"
                min="0"
                value={values.sort_order}
                onChange={set('sort_order')}
              />
            </Field>

            <div style={{ paddingTop: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={values.is_visible}
                  onChange={set('is_visible')}
                  style={{ width: '1.15rem', height: '1.15rem' }}
                />
                <span>Visible on Public Website</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <button type="submit" className="ops-btn ops-btn-primary" disabled={busy}>
              {busy ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span>
                  <span>Saving Service…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  <span>Save Service</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="ops-btn ops-btn-secondary"
              onClick={() => navigate('/services')}
            >
              Cancel
            </button>
            {!isNew && (
              <button
                type="button"
                className="ops-btn ops-btn-danger"
                onClick={removeCurrentService}
                disabled={busy}
                style={{ marginLeft: 'auto' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                <span>Delete Service</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
