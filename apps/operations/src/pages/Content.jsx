import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api.js';
import { Field, ErrorAlert, EmptyState, useFormState } from '../components/ui.jsx';
import { ImageUploadField } from '../components/ImageUploadField.jsx';
import { useToast } from '../components/OpsToast.jsx';

// Reusable entity manager for Hero Slides, FAQs, and Testimonials
function EntityManager({ entity, title, entitySingular, fields, renderCardPreview, defaultNewItem = {} }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      const res = await api.list(`cms/${entity}`, { limit: '100' });
      setData(res);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, [entity]);

  const filteredItems = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;
    const q = searchQuery.toLowerCase();
    return data.data.filter((item) => {
      return Object.values(item).some((v) =>
        typeof v === 'string' && v.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (draft.id) {
        const { id, created_at, updated_at, ...body } = draft;
        // Convert numeric fields if needed
        if ('sort_order' in body) body.sort_order = Number(body.sort_order) || 0;
        if ('rating' in body && body.rating) body.rating = Number(body.rating);
        await api.update(`cms/${entity}`, id, body);
        toast.success(`${entitySingular || 'Item'} updated successfully`);
      } else {
        const body = { ...draft };
        if ('sort_order' in body) body.sort_order = Number(body.sort_order) || 0;
        if ('rating' in body && body.rating) body.rating = Number(body.rating);
        await api.create(`cms/${entity}`, body);
        toast.success(`New ${entitySingular || 'item'} created successfully`);
      }
      setDraft(null);
      await load();
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to save item');
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this ${entitySingular || 'item'}? This will remove it from the live website.`)) return;
    try {
      await api.delete(`cms/${entity}`, item.id);
      toast.success(`${entitySingular || 'Item'} deleted successfully`);
      if (draft?.id === item.id) setDraft(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete item');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>{title}</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Manage and publish live user-facing {title.toLowerCase()} directly on the public portal.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="ops-btn ops-btn-primary"
            onClick={() => {
              setDraft({ ...defaultNewItem });
              setError(null);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Add {entitySingular || 'Item'}
          </button>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={load} />

      {/* Inline / Modal Editor Drawer */}
      {draft && (
        <div
          className="ops-card"
          style={{
            border: '2px solid var(--ops-primary)',
            boxShadow: 'var(--ops-shadow-lg)',
            backgroundColor: '#ffffff',
          }}
        >
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                {draft.id ? 'edit_note' : 'add_circle'}
              </span>
              {draft.id ? `Edit ${entitySingular || 'Item'}` : `New ${entitySingular || 'Item'}`}
            </h2>
            <button
              type="button"
              className="ops-btn ops-btn-secondary ops-btn-sm"
              onClick={() => setDraft(null)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              Cancel
            </button>
          </div>

          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="ops-form-grid ops-form-grid-2">
              {fields.map((f) => {
                if (f.type === 'image') {
                  return (
                    <div key={f.key} style={{ gridColumn: f.fullWidth ? '1 / -1' : 'span 1' }}>
                      <ImageUploadField
                        label={f.label}
                        value={draft[f.key] ?? ''}
                        onChange={(url) => setDraft({ ...draft, [f.key]: url })}
                        aspectRatio={f.aspectRatio || '16/9'}
                        hint={f.hint || 'Direct upload from mobile/system or paste URL. Auto-converted to WebP.'}
                      />
                    </div>
                  );
                }

                if (f.type === 'textarea') {
                  return (
                    <div key={f.key} className="ops-form-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="ops-form-label">{f.label}</label>
                      <textarea
                        className="ops-textarea"
                        rows={f.rows || 3}
                        value={draft[f.key] ?? ''}
                        placeholder={f.placeholder || ''}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        required={f.required}
                      />
                      {f.hint && <span className="ops-form-hint">{f.hint}</span>}
                    </div>
                  );
                }

                if (f.type === 'check') {
                  return (
                    <div key={f.key} className="ops-form-field" style={{ justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--ops-primary)' }}
                          checked={!!draft[f.key]}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.label}</span>
                      </label>
                      {f.hint && <span className="ops-form-hint" style={{ paddingLeft: '1.75rem' }}>{f.hint}</span>}
                    </div>
                  );
                }

                if (f.type === 'number') {
                  return (
                    <div key={f.key} className="ops-form-field">
                      <label className="ops-form-label">{f.label}</label>
                      <input
                        type="number"
                        className="ops-input"
                        value={draft[f.key] ?? ''}
                        min={f.min}
                        max={f.max}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        required={f.required}
                      />
                      {f.hint && <span className="ops-form-hint">{f.hint}</span>}
                    </div>
                  );
                }

                return (
                  <div key={f.key} className="ops-form-field" style={{ gridColumn: f.fullWidth ? '1 / -1' : 'span 1' }}>
                    <label className="ops-form-label">{f.label}</label>
                    <input
                      type="text"
                      className="ops-input"
                      value={draft[f.key] ?? ''}
                      placeholder={f.placeholder || ''}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      required={f.required}
                    />
                    {f.hint && <span className="ops-form-hint">{f.hint}</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              <div>
                {draft.id && (
                  <button
                    type="button"
                    className="ops-btn ops-btn-danger"
                    onClick={() => removeItem(draft)}
                    disabled={busy}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    Delete {entitySingular || 'Item'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary"
                  onClick={() => setDraft(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ops-btn ops-btn-primary"
                  disabled={busy}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {busy ? 'hourglass_empty' : 'check'}
                  </span>
                  {busy ? 'Saving changes…' : draft.id ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ops-outline)',
              fontSize: '18px',
            }}
          >
            search
          </span>
          <input
            className="ops-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder={`Search ${title.toLowerCase()}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {!data && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--ops-outline)' }}>
            sync
          </span>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--ops-outline)' }}>Loading live data…</p>
        </div>
      )}

      {data && filteredItems.length === 0 && (
        <EmptyState message={`No ${title.toLowerCase()} found matching your criteria.`} />
      )}

      {data && filteredItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="ops-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>{renderCardPreview(item)}</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--ops-outline-subtle)',
                }}
              >
                <button
                  type="button"
                  className="ops-btn ops-btn-danger ops-btn-sm"
                  onClick={() => removeItem(item)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  Delete
                </button>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary ops-btn-sm"
                  onClick={() => {
                    setDraft({ ...item });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 1. HERO SLIDES
export function HeroSlides() {
  return (
    <EntityManager
      entity="hero-slides"
      title="Hero Carousel Slides"
      entitySingular="Hero Slide"
      defaultNewItem={{
        title_en: '',
        short_label_en: '',
        description_en: '',
        image_url: '',
        primary_cta_label_en: 'Request Care Accompaniment',
        primary_cta_url: '/request-care',
        secondary_cta_label_en: 'Explore Hospital Network',
        secondary_cta_url: '/hospitals',
        sort_order: 0,
        is_active: true,
      }}
      fields={[
        { key: 'title_en', label: 'Slide Title (English)', required: true, fullWidth: true, placeholder: 'Compassionate Care in Bhimavaram' },
        { key: 'short_label_en', label: 'Badge / Pill Label', placeholder: 'e.g. Verified Accompaniment, OPD Fast Track' },
        { key: 'sort_order', label: 'Sort Order (0 = First)', type: 'number', min: 0 },
        { key: 'description_en', label: 'Slide Description', type: 'textarea', rows: 3, fullWidth: true },
        { key: 'image_url', label: 'Hero Slide Visual Graphic / Photo', type: 'image', aspectRatio: '16/9', fullWidth: true },
        { key: 'primary_cta_label_en', label: 'Primary CTA Label', placeholder: 'Request Care' },
        { key: 'primary_cta_url', label: 'Primary CTA Destination URL', placeholder: '/request-care' },
        { key: 'secondary_cta_label_en', label: 'Secondary CTA Label', placeholder: 'Learn More' },
        { key: 'secondary_cta_url', label: 'Secondary CTA Destination URL', placeholder: '/hospitals' },
        { key: 'is_active', label: 'Slide Active & Visible to Users', type: 'check', hint: 'If unchecked, slide is hidden from public carousel.' },
      ]}
      renderCardPreview={(s) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {s.image_url ? (
            <div style={{ width: '100%', height: '140px', borderRadius: 'var(--ops-radius-md)', overflow: 'hidden', backgroundColor: 'var(--ops-surface-container)' }}>
              <img src={s.image_url} alt={s.title_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '80px',
                borderRadius: 'var(--ops-radius-md)',
                backgroundColor: 'var(--ops-surface-container-low)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ops-outline)',
                gap: '0.5rem',
              }}
            >
              <span className="material-symbols-outlined">image</span>
              <span style={{ fontSize: '0.75rem' }}>No visual assigned</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span
              className="ops-badge"
              style={{
                backgroundColor: s.is_active ? 'var(--ops-success-container)' : 'var(--ops-surface-container-high)',
                color: s.is_active ? 'var(--ops-success)' : 'var(--ops-outline)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {s.is_active ? 'visibility' : 'visibility_off'}
              </span>
              {s.is_active ? 'Active' : 'Inactive'}
            </span>
            {s.short_label_en && (
              <span className="ops-badge" style={{ backgroundColor: 'var(--ops-primary-fixed)', color: 'var(--ops-primary)' }}>
                {s.short_label_en}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>Order: {s.sort_order ?? 0}</span>
          </div>

          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ops-on-surface)' }}>{s.title_en}</h3>
          {s.description_en && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {s.description_en}
            </p>
          )}
        </div>
      )}
    />
  );
}

// 2. FAQS
export function Faqs() {
  return (
    <EntityManager
      entity="faqs"
      title="Frequently Asked Questions"
      entitySingular="FAQ"
      defaultNewItem={{
        question_en: '',
        answer_en: '',
        category: 'general',
        sort_order: 0,
        is_published: true,
      }}
      fields={[
        { key: 'question_en', label: 'Question (English)', required: true, fullWidth: true, placeholder: 'How does wheelchair assistance work at Bhimavaram hospitals?' },
        { key: 'category', label: 'Category (e.g. general, logistics, payments, companion)', placeholder: 'general' },
        { key: 'sort_order', label: 'Sort Order', type: 'number', min: 0 },
        { key: 'answer_en', label: 'Answer (English)', type: 'textarea', rows: 4, fullWidth: true, required: true },
        { key: 'is_published', label: 'Published & Visible on Website', type: 'check', hint: 'If unchecked, stays as draft.' },
      ]}
      renderCardPreview={(f) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span
              className="ops-badge"
              style={{
                backgroundColor: f.is_published ? 'var(--ops-success-container)' : '#fef3c7',
                color: f.is_published ? 'var(--ops-success)' : '#92400e',
              }}
            >
              {f.is_published ? 'Published' : 'Draft'}
            </span>
            <span className="ops-badge" style={{ backgroundColor: 'var(--ops-surface-container-high)', color: 'var(--ops-on-surface-variant)' }}>
              {f.category || 'general'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>Order: {f.sort_order ?? 0}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ops-on-surface)' }}>{f.question_en}</h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {f.answer_en}
          </p>
        </div>
      )}
    />
  );
}

// 3. TESTIMONIALS
export function Testimonials() {
  return (
    <EntityManager
      entity="testimonials"
      title="Patient & Family Testimonials"
      entitySingular="Testimonial"
      defaultNewItem={{
        author_name: '',
        author_detail_en: '',
        quote_en: '',
        rating: 5,
        image_url: '',
        sort_order: 0,
        is_published: true,
      }}
      fields={[
        { key: 'author_name', label: 'Author Name', required: true, placeholder: 'e.g. Ramesh V., NRI Son in USA' },
        { key: 'author_detail_en', label: 'Author Subtitle / City', placeholder: 'e.g. Bhimavaram resident parent care' },
        { key: 'rating', label: 'Rating (1 to 5 Stars)', type: 'number', min: 1, max: 5 },
        { key: 'sort_order', label: 'Sort Order', type: 'number', min: 0 },
        { key: 'image_url', label: 'Patient / Family Photo', type: 'image', aspectRatio: '1/1', hint: 'Square avatar photo. Auto-converted to WebP.' },
        { key: 'quote_en', label: 'Quote / Feedback Story', type: 'textarea', rows: 3, fullWidth: true, required: true },
        { key: 'is_published', label: 'Published & Visible on Website', type: 'check', hint: 'If unchecked, stays as draft.' },
      ]}
      renderCardPreview={(t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              className="ops-badge"
              style={{
                backgroundColor: t.is_published ? 'var(--ops-success-container)' : '#fef3c7',
                color: t.is_published ? 'var(--ops-success)' : '#92400e',
              }}
            >
              {t.is_published ? 'Published' : 'Draft'}
            </span>
            <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
              {[...Array(t.rating || 5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {t.image_url ? (
              <img
                src={t.image_url}
                alt={t.author_name}
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ops-primary-fixed)',
                  color: 'var(--ops-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {t.author_name ? t.author_name[0].toUpperCase() : 'A'}
              </div>
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{t.author_name}</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ops-outline)' }}>{t.author_detail_en}</p>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            “{t.quote_en}”
          </p>
        </div>
      )}
    />
  );
}

// 4. CONTENT BLOCKS
const PREDEFINED_CATEGORIES = [
  { id: 'all', label: 'All Blocks' },
  { id: 'request', label: 'Care Request (12 Steps)' },
  { id: 'auth', label: 'Auth & Verification' },
  { id: 'home', label: 'Home Page' },
  { id: 'about', label: 'About Page' },
  { id: 'profile', label: 'Profile & Care Settings' },
  { id: 'services', label: 'Services & Pillars' },
  { id: 'hospitals', label: 'Hospitals & Standards' },
  { id: 'contact', label: 'Contact & Hubs' },
  { id: 'customer', label: 'Customer Portal & Advisories' },
  { id: 'recipient', label: 'Care Recipients Config' },
  { id: 'footer', label: 'Footer & Legal' },
];

export function Blocks() {
  const [blocks, setBlocks] = useState(null);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const [values, set, setValues] = useFormState({
    key: '',
    title_en: '',
    body_en: '',
    icon: '',
    status: 'published',
  });

  const load = () =>
    api
      .list('cms/content-blocks')
      .then((d) => setBlocks(d?.data ?? d ?? []))
      .catch(setError);

  const toggleAuthMethod = async (key, currentVal) => {
    const nextVal = currentVal === 'true' ? 'false' : 'true';
    const label = key === 'auth.email_enabled' ? 'Email Authentication' : 'Phone Number Authentication';
    setBusy(true);
    try {
      await api.put('cms/content-blocks', {
        key,
        title_en: `${label} Enabled`,
        body_en: nextVal,
        status: 'published',
      });
      toast.success(`${label} turned ${nextVal === 'true' ? 'ON' : 'OFF'} successfully`);
      await load();
    } catch (err) {
      toast.error(err.message || `Failed to update ${label}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (block) => {
    setSelectedBlock(block);
    setValues({
      key: block.key,
      title_en: block.title_en || '',
      body_en: block.body_en || '',
      icon: block.icon || '',
      status: block.status || 'published',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNew = () => {
    setSelectedBlock({ isNew: true });
    setValues({
      key: '',
      title_en: '',
      body_en: '',
      icon: '',
      status: 'published',
    });
  };

  const removeBlock = async (key) => {
    if (!window.confirm(`Are you sure you want to delete content block "${key}"? This will permanently remove it from the database and live website.`)) return;
    try {
      await api.deleteBlock(key);
      toast.success(`Content block "${key}" deleted successfully`);
      if (selectedBlock?.key === key) setSelectedBlock(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete content block');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.put('cms/content-blocks', values);
      toast.success(`Content block '${values.key}' saved successfully`);
      setSelectedBlock(null);
      await load();
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to save content block');
    } finally {
      setBusy(false);
    }
  };

  const filteredBlocks = useMemo(() => {
    if (!blocks) return [];
    return blocks.filter((b) => {
      const matchCat =
        activeCategory === 'all' ||
        b.key.toLowerCase().startsWith(activeCategory.toLowerCase());
      const matchQuery =
        !search.trim() ||
        b.key.toLowerCase().includes(search.toLowerCase()) ||
        (b.title_en && b.title_en.toLowerCase().includes(search.toLowerCase())) ||
        (b.body_en && b.body_en.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [blocks, activeCategory, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            Content Blocks CMS
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Precision keyed text blocks that power customer advisories, trust badges, about section, and dynamic banners.
          </p>
        </div>
        <button type="button" className="ops-btn ops-btn-primary" onClick={openNew}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Create New Block
        </button>
      </div>

      <ErrorAlert error={error} onRetry={load} />

      {/* Care Request Auth & Verification Methods CMS Control */}
      <div
        className="ops-card"
        style={{
          border: '1px solid var(--ops-outline-variant, #e2e8f0)',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '22px' }}>
                verified_user
              </span>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--ops-on-surface)' }}>
                Care Request Authentication &amp; Verification Controls
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
              Configure customer verification channels during the Care Request verification step. By default, Email OTP is ON and Phone OTP is OFF.
            </p>
          </div>
          <span className="ops-badge ops-badge-info" style={{ fontSize: '0.75rem' }}>
            Live Production Gateways
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Email Authentication Card */}
          {(() => {
            const emailAuthBlock = blocks?.find((b) => b.key === 'auth.email_enabled');
            const isEmailOn = emailAuthBlock ? emailAuthBlock.body_en !== 'false' : true;
            return (
              <div
                style={{
                  padding: '1.125rem',
                  borderRadius: '10px',
                  border: isEmailOn ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  background: isEmailOn ? '#f0fdf4' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: isEmailOn ? '#059669' : '#64748b' }}>
                        mail
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: '#1e293b' }}>Email Authentication &amp; Verification</strong>
                    </div>
                    <span
                      className={`ops-badge ${isEmailOn ? 'ops-badge-success' : 'ops-badge-warning'}`}
                      style={{ fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {isEmailOn ? 'Active (Default)' : 'Disabled'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                    Sends secure 6-digit OTP codes to the user&apos;s email address. Displays the standard caregiver signup &amp; verification form.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                    key: auth.email_enabled
                  </span>
                  <button
                    type="button"
                    className={`ops-btn ops-btn-sm ${isEmailOn ? 'ops-btn-secondary' : 'ops-btn-primary'}`}
                    onClick={() => toggleAuthMethod('auth.email_enabled', emailAuthBlock?.body_en || 'true')}
                    disabled={busy}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {isEmailOn ? 'toggle_on' : 'toggle_off'}
                    </span>
                    {isEmailOn ? 'Turn OFF' : 'Turn ON'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Phone Number Authentication Card */}
          {(() => {
            const phoneAuthBlock = blocks?.find((b) => b.key === 'auth.phone_enabled');
            const isPhoneOn = phoneAuthBlock ? phoneAuthBlock.body_en === 'true' : false;
            return (
              <div
                style={{
                  padding: '1.125rem',
                  borderRadius: '10px',
                  border: isPhoneOn ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  background: isPhoneOn ? '#f0fdf4' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: isPhoneOn ? '#059669' : '#64748b' }}>
                        sms
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: '#1e293b' }}>Phone Number Authentication &amp; Verification</strong>
                    </div>
                    <span
                      className={`ops-badge ${isPhoneOn ? 'ops-badge-success' : 'ops-badge-secondary'}`}
                      style={{ fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {isPhoneOn ? 'Active' : 'Disabled (Default)'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                    Enables SMS OTP phone number authentication. When turned ON, works side-by-side with email verification without causing abnormal behavior.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                    key: auth.phone_enabled
                  </span>
                  <button
                    type="button"
                    className={`ops-btn ops-btn-sm ${isPhoneOn ? 'ops-btn-secondary' : 'ops-btn-primary'}`}
                    onClick={() => toggleAuthMethod('auth.phone_enabled', phoneAuthBlock?.body_en || 'false')}
                    disabled={busy}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {isPhoneOn ? 'toggle_on' : 'toggle_off'}
                    </span>
                    {isPhoneOn ? 'Turn OFF' : 'Turn ON'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Editor Drawer / Card */}
      {selectedBlock && (
        <div
          className="ops-card"
          style={{
            border: '2px solid var(--ops-primary)',
            boxShadow: 'var(--ops-shadow-lg)',
            backgroundColor: '#ffffff',
          }}
        >
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                {selectedBlock.isNew ? 'add_box' : 'edit_document'}
              </span>
              {selectedBlock.isNew ? 'Create New Content Block' : `Editing Block: ${selectedBlock.key}`}
            </h2>
            <button
              type="button"
              className="ops-btn ops-btn-secondary ops-btn-sm"
              onClick={() => setSelectedBlock(null)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              Close Editor
            </button>
          </div>

          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="ops-form-grid ops-form-grid-2">
              <div className="ops-form-field">
                <label className="ops-form-label">
                  Block Key (Namespaced)
                  <span className="ops-form-hint">e.g. customer.advisory, about.mission</span>
                </label>
                <input
                  className="ops-input"
                  value={values.key}
                  onChange={set('key')}
                  placeholder="category.identifier"
                  required
                  disabled={!selectedBlock.isNew}
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">Publication Status</label>
                <select className="ops-select" value={values.status} onChange={set('status')}>
                  <option value="published">Published (Live on Public Portal)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="ops-form-field" style={{ gridColumn: '1 / -1' }}>
                <label className="ops-form-label">Title / Headline</label>
                <input
                  className="ops-input"
                  value={values.title_en}
                  onChange={set('title_en')}
                  placeholder="e.g. Care Accompaniment Guarantee"
                />
              </div>

              <div className="ops-form-field" style={{ gridColumn: '1 / -1' }}>
                <label className="ops-form-label">Content Body / Markdown</label>
                <textarea
                  className="ops-textarea"
                  rows={5}
                  value={values.body_en}
                  onChange={set('body_en')}
                  placeholder="Enter the full content text..."
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Material Symbol Icon
                  <span className="ops-form-hint">e.g. shield, verified, local_hospital</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    className="ops-input"
                    value={values.icon}
                    onChange={set('icon')}
                    placeholder="e.g. volunteer_activism"
                  />
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--ops-radius-md)',
                      backgroundColor: 'var(--ops-primary-fixed)',
                      color: 'var(--ops-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    title="Live Icon Preview"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                      {values.icon || 'star'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              {!selectedBlock.isNew && (
                <button
                  type="button"
                  className="ops-btn ops-btn-danger"
                  onClick={() => removeBlock(selectedBlock.key)}
                  disabled={busy}
                  style={{ marginRight: 'auto' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  Delete Block
                </button>
              )}
              <button
                type="button"
                className="ops-btn ops-btn-secondary"
                onClick={() => setSelectedBlock(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="ops-btn ops-btn-primary" disabled={busy}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {busy ? 'hourglass_empty' : 'save'}
                </span>
                {busy ? 'Saving block…' : 'Save Block'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Pills & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {PREDEFINED_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`ops-btn ops-btn-sm ${activeCategory === cat.id ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ops-outline)',
                fontSize: '18px',
              }}
            >
              search
            </span>
            <input
              className="ops-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by key, title, or text…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            Showing {filteredBlocks.length} block{filteredBlocks.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {!blocks && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading content blocks…</p>
        </div>
      )}

      {blocks && filteredBlocks.length === 0 && (
        <EmptyState message="No content blocks match your category or search filter." />
      )}

      {/* Blocks Grid */}
      {blocks && filteredBlocks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {filteredBlocks.map((b) => (
            <div
              key={b.key}
              className="ops-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--ops-surface-container-high)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--ops-radius-sm)',
                      color: 'var(--ops-primary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {b.key}
                  </span>
                  <span
                    className="ops-badge"
                    style={{
                      backgroundColor:
                        b.status === 'published'
                          ? 'var(--ops-success-container)'
                          : b.status === 'draft'
                          ? '#fef3c7'
                          : 'var(--ops-surface-container-high)',
                      color:
                        b.status === 'published'
                          ? 'var(--ops-success)'
                          : b.status === 'draft'
                          ? '#92400e'
                          : 'var(--ops-outline)',
                    }}
                  >
                    {b.status || 'published'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {b.icon && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--ops-radius-md)',
                        backgroundColor: 'var(--ops-primary-fixed)',
                        color: 'var(--ops-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {b.icon}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ops-on-surface)' }}>
                      {b.title_en || '(Untitled Block)'}
                    </h3>
                  </div>
                </div>

                {b.body_en && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8125rem',
                      color: 'var(--ops-on-surface-variant)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.45,
                    }}
                  >
                    {b.body_en}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--ops-outline-subtle)',
                }}
              >
                <button
                  type="button"
                  className="ops-btn ops-btn-danger ops-btn-sm"
                  onClick={() => removeBlock(b.key)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  Delete
                </button>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary ops-btn-sm"
                  onClick={() => openEdit(b)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  Edit Block
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 5. CONTACT SETTINGS
export function Contact() {
  const [values, set, setValues] = useFormState({
    phone: '',
    email: '',
    address_en: '',
    hours_en: '',
    whatsapp: '',
  });
  const [existingSocials, setExistingSocials] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api
      .getOne('cms/contact-settings')
      .then((d) => {
        setExistingSocials(d.socials || {});
        setValues({
          phone: d.phone ?? '',
          phone_sub: d.socials?.phone_sub ?? '',
          phone_desc: d.socials?.phone_desc ?? '',
          email: d.email ?? '',
          support_sub: d.socials?.support_sub ?? '',
          partnerships_email: d.socials?.partnerships_email ?? '',
          partnerships_sub: d.socials?.partnerships_sub ?? '',
          address_en: d.address_en ?? '',
          hours_en: d.hours_en ?? '',
          city_hub_name: d.socials?.city_hub_name ?? 'Bhimavaram',
          city_hub_coverage: d.socials?.city_hub_coverage ?? '',
          whatsapp: d.socials?.whatsapp ?? '',
          whatsapp_sub: d.socials?.whatsapp_sub ?? '',
          whatsapp_desc: d.socials?.whatsapp_desc ?? '',
          coordinator_image_url: d.socials?.coordinator_image_url ?? '',
          counseling_badge: d.socials?.counseling_badge ?? '',
          counseling_title: d.socials?.counseling_title ?? '',
          counseling_heading: d.socials?.counseling_heading ?? '',
          counseling_desc: d.socials?.counseling_desc ?? '',
          rapid_phone: d.socials?.rapid_phone ?? '',
          rapid_title: d.socials?.rapid_title ?? '',
          rapid_subtitle: d.socials?.rapid_subtitle ?? '',
        });
      })
      .catch(setError);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const {
        phone,
        email,
        address_en,
        hours_en,
        ...socialFields
      } = values;
      await api.put('cms/contact-settings', {
        phone: phone || null,
        email: email || null,
        address_en: address_en || '',
        hours_en: hours_en || '',
        socials: {
          ...existingSocials,
          ...socialFields,
          whatsapp: socialFields.whatsapp || phone || '',
        },
      });
      toast.success('Public contact channels and page copy saved successfully');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to update contact settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
          Public Contact Channels &amp; Page CMS
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
          Manage phone numbers, support emails, Bhimavaram coordination hub address, active hours, rapid response hotlines, and guidance features displayed on the Contact page.
        </p>
      </div>

      <ErrorAlert error={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Editing Form */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                settings_phone
              </span>
              Contact Directives &amp; Page Content
            </h2>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Toll-Free & Direct Helpline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Direct Helpline / Toll-Free
              </span>
              <div className="ops-form-field">
                <label className="ops-form-label">
                  Helpline Display Number
                  <span className="ops-form-hint">E.g. 1800-AAYU-CARE or +91 8816 223344</span>
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.phone ?? ''}
                  onChange={set('phone')}
                  placeholder="1800-AAYU-CARE"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Secondary Dial Subtitle
                  <span className="ops-form-hint">E.g. (1800-2298-2273)</span>
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.phone_sub ?? ''}
                  onChange={set('phone_sub')}
                  placeholder="(1800-2298-2273)"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Helpline SLA Note
                  <span className="ops-form-hint">Displayed below phone number</span>
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.phone_desc ?? ''}
                  onChange={set('phone_desc')}
                  placeholder="Average response under 45 seconds with native multilingual support."
                />
              </div>
            </div>

            {/* 2. Instant WhatsApp Concierge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Instant WhatsApp Concierge
              </span>
              <div className="ops-form-field">
                <label className="ops-form-label">
                  WhatsApp Business Number
                  <span className="ops-form-hint">Used for 1-click WhatsApp chat link</span>
                </label>
                <input
                  className="ops-input"
                  type="tel"
                  value={values.whatsapp ?? ''}
                  onChange={set('whatsapp')}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  WhatsApp Badge Label
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.whatsapp_sub ?? ''}
                  onChange={set('whatsapp_sub')}
                  placeholder="Verified Care Business Account"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  WhatsApp Description Note
                </label>
                <textarea
                  className="ops-textarea"
                  rows={2}
                  value={values.whatsapp_desc ?? ''}
                  onChange={set('whatsapp_desc')}
                  placeholder="Send prescription photos, doctor appointment slips, discharge summaries, or request on-demand companion availability."
                />
              </div>
            </div>

            {/* 3. Written Inquiries & Emails */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Support &amp; Partnerships Emails
              </span>
              <div className="ops-form-field">
                <label className="ops-form-label">
                  Support &amp; Family Coordination Email
                </label>
                <input
                  className="ops-input"
                  type="email"
                  value={values.email ?? ''}
                  onChange={set('email')}
                  placeholder="support@aayuyukthi.com"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Support Email Subtitle
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.support_sub ?? ''}
                  onChange={set('support_sub')}
                  placeholder="Family Coordination &amp; Scheduling"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Hospital Networks &amp; Corporate Email
                </label>
                <input
                  className="ops-input"
                  type="email"
                  value={values.partnerships_email ?? ''}
                  onChange={set('partnerships_email')}
                  placeholder="partnerships@aayuyukthi.com"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Partnerships Subtitle
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.partnerships_sub ?? ''}
                  onChange={set('partnerships_sub')}
                  placeholder="Hospital Networks &amp; Corporate Plans"
                />
              </div>
            </div>

            {/* 4. Physical Hub & Operating Hours */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                4. Physical Operations Hub
              </span>
              <div className="ops-form-field">
                <label className="ops-form-label">
                  City Hub Name
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.city_hub_name ?? ''}
                  onChange={set('city_hub_name')}
                  placeholder="Bhimavaram"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Physical Hub Address
                </label>
                <textarea
                  className="ops-textarea"
                  rows={2}
                  value={values.address_en ?? ''}
                  onChange={set('address_en')}
                  placeholder="Main Road, Bhimavaram, West Godavari District, Andhra Pradesh 534201"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Service &amp; Accompaniment Hours
                </label>
                <input
                  className="ops-input"
                  value={values.hours_en ?? ''}
                  onChange={set('hours_en')}
                  placeholder="Mon–Sun, 7:00 AM – 9:00 PM IST"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Partner Hospitals Coverage Scope
                </label>
                <input
                  className="ops-input"
                  value={values.city_hub_coverage ?? ''}
                  onChange={set('city_hub_coverage')}
                  placeholder="Dedicated accompaniment across accredited partner hospitals in Bhimavaram"
                />
              </div>
            </div>

            {/* 5. Coordination Desk Feature & Rapid Care */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                5. Guidance Feature &amp; Rapid Hotline
              </span>
              <div className="ops-form-field">
                <label className="ops-form-label">
                  Care Coordinator Image URL
                  <span className="ops-form-hint">Leave blank to show wireframe architectural illustration</span>
                </label>
                <input
                  className="ops-input"
                  type="url"
                  value={values.coordinator_image_url ?? ''}
                  onChange={set('coordinator_image_url')}
                  placeholder="https://... (or leave empty for wireframe fallback)"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Guidance Feature Badge
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.counseling_badge ?? ''}
                  onChange={set('counseling_badge')}
                  placeholder="In-House Coordination Desk"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Guidance Feature Title
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.counseling_title ?? ''}
                  onChange={set('counseling_title')}
                  placeholder="Certified Hospital Navigators"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Guidance Heading
                </label>
                <input
                  className="ops-input"
                  type="text"
                  value={values.counseling_heading ?? ''}
                  onChange={set('counseling_heading')}
                  placeholder="Human-First Healthcare Guidance"
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Guidance Description
                </label>
                <textarea
                  className="ops-textarea"
                  rows={3}
                  value={values.counseling_desc ?? ''}
                  onChange={set('counseling_desc')}
                  placeholder="Our care coordinators are trained in hospital administrative workflows, patient privacy, and compassionate geriatric support. No call centers — speak directly with certified care specialists."
                />
              </div>

              <div className="ops-form-field">
                <label className="ops-form-label">
                  Rapid Care Hotline Phone
                  <span className="ops-form-hint">Under 3 hours dispatch desk</span>
                </label>
                <input
                  className="ops-input"
                  type="tel"
                  value={values.rapid_phone ?? ''}
                  onChange={set('rapid_phone')}
                  placeholder="1800-AAYU-CARE"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
              <button type="submit" className="ops-btn ops-btn-primary" disabled={saving}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {saving ? 'hourglass_empty' : 'save'}
                </span>
                {saving ? 'Saving changes…' : 'Save All Contact Channels &amp; Copy'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Public Preview Card */}
        <div className="ops-card" style={{ backgroundColor: 'var(--ops-surface-container-low)' }}>
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                preview
              </span>
              Public Website Preview
            </h2>
            <span className="ops-badge ops-badge-active">Live Replica</span>
          </div>

          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            This preview mirrors how your contact information appears on the user website and mobile web apps.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {/* Phone pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--ops-radius-lg)',
                border: '1px solid var(--ops-outline-subtle)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ops-primary-fixed)',
                  color: 'var(--ops-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined">call</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                  Phone Helpline
                </span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ops-on-surface)' }}>
                  {values.phone || '+91 8816 223344'}
                </p>
              </div>
            </div>

            {/* Email pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--ops-radius-lg)',
                border: '1px solid var(--ops-outline-subtle)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ops-secondary-container)',
                  color: 'var(--ops-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                  Care Inquiries
                </span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ops-on-surface)' }}>
                  {values.email || 'care@aayuyukthi.com'}
                </p>
              </div>
            </div>

            {/* Address pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--ops-radius-lg)',
                border: '1px solid var(--ops-outline-subtle)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ops-surface-container)',
                  color: 'var(--ops-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                  Operational Hub
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)', lineHeight: 1.4 }}>
                  {values.address_en || 'Bhimavaram Care Accompaniment Center, West Godavari District, Andhra Pradesh'}
                </p>
              </div>
            </div>

            {/* Hours pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--ops-radius-lg)',
                border: '1px solid var(--ops-outline-subtle)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ops-success-container)',
                  color: 'var(--ops-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                  Operational Hours
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ops-on-surface)' }}>
                  {values.hours_en || 'Monday – Sunday: 6:00 AM – 10:00 PM'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
