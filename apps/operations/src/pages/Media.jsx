import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, ErrorAlert, EmptyState, useFormState } from '../components/ui.jsx';
import { ImageUploadField } from '../components/ImageUploadField.jsx';
import { useToast } from '../components/OpsToast.jsx';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/gif';
const MAX_BYTES = 10 * 1024 * 1024;

export function Media() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [uploadState, setUploadState] = useState(null);
  const [showDirectUpload, setShowDirectUpload] = useState(false);
  const [values, set, setValues] = useFormState({ alt_text: '' });
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      setData(await api.list('media', q ? { q, limit: '100' } : { limit: '100' }));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!ACCEPT.split(',').includes(file.type)) {
      setError(new Error('Only JPEG, PNG, WebP, AVIF, SVG, or GIF images are accepted.'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(new Error('File is too large (10MB maximum).'));
      return;
    }
    try {
      setUploadState('Requesting secure signature…');
      const sig = await api.create('media/signature', { folder: 'aayuyukthi' });
      setUploadState('Uploading master asset…');
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', String(sig.timestamp));
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
      if (!up.ok) throw new Error('Upload failed. Please try again.');
      const uploaded = await up.json();
      setUploadState('Registering asset…');
      await api.create('media', {
        provider: 'cloudinary',
        provider_asset_id: uploaded.public_id,
        mime_type: file.type,
        size_bytes: file.size,
        original_filename: file.name,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        format: uploaded.format ?? null,
        alt_text: values.alt_text,
      });
      setValues({ alt_text: '' });
      setUploadState(null);
      toast.success('Media asset uploaded and registered');
      await load();
    } catch (err) {
      setUploadState(null);
      setError(err.code === 'MEDIA_NOT_CONFIGURED'
        ? new Error('Media storage provider is not configured. Register an external image URL below.')
        : err);
    }
  };

  const registerExternal = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await api.create('media', {
        provider: 'external',
        url: form.get('url'),
        mime_type: 'image/jpeg',
        alt_text: form.get('alt_text') ?? '',
      });
      e.target.reset();
      toast.success('External image registered successfully');
      await load();
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to register image');
    }
  };

  const archive = async (id) => {
    try {
      await api.raw(`/ops/media/${id}/archive`, 'POST');
      toast.success('Asset archived');
      await load();
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to archive asset');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this asset? Only unused assets can be deleted.')) return;
    try {
      await api.raw(`/ops/media/${id}`, 'DELETE');
      toast.success('Asset deleted');
      await load();
    } catch (err) {
      setError(err.code === 'MEDIA_IN_USE' ? new Error('Asset is currently used by published content. Archive it instead.') : err);
      toast.error('Asset could not be deleted');
    }
  };

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            Media &amp; Asset Library
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            High-speed WebP image assets serving hospital photos, service badges, and testimonial avatars.
          </p>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={load} />

      {uploadState && (
        <div className="ops-card" style={{ backgroundColor: 'var(--ops-primary-fixed)', color: 'var(--ops-primary)', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1.5s linear infinite' }}>sync</span>
            <span style={{ fontWeight: 600 }}>{uploadState}</span>
          </div>
        </div>
      )}

      {/* Main Uploader with Client WebP Compression */}
      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              cloud_upload
            </span>
            Add Asset (Dual Mode: System/Drive Upload or Web Link)
          </h2>
        </div>

        <ImageUploadField
          label="Select File, Drive Link, or Paste Image URL"
          value=""
          onChange={async (url) => {
            if (!url) return;
            try {
              await api.create('media', {
                provider: 'external',
                url,
                mime_type: 'image/webp',
                alt_text: values.alt_text || 'AayuYukthi Asset',
              });
              toast.success('WebP asset added to library');
              await load();
            } catch (err) {
              setError(err);
              toast.error(err.message || 'Failed to register image');
            }
          }}
          hint="Converts client-side to modern lightweight WebP for zero loss, optimal storage, and instant loading on budget mobile devices."
        />

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
          <button
            type="button"
            className="ops-btn ops-btn-secondary ops-btn-sm"
            onClick={() => setShowDirectUpload(!showDirectUpload)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {showDirectUpload ? 'expand_less' : 'tune'}
            </span>
            {showDirectUpload ? 'Hide Advanced Provider Upload' : 'Advanced Cloud Provider Upload'}
          </button>
        </div>

        {showDirectUpload && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--ops-surface-container-low)', borderRadius: 'var(--ops-radius-md)' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">Alt text for direct master</label>
              <input
                className="ops-input"
                value={values.alt_text}
                onChange={set('alt_text')}
                placeholder="Describe image for screen readers"
              />
            </div>
            <input type="file" accept={ACCEPT} onChange={uploadFile} aria-label="Upload raw master image" />
          </div>
        )}
      </div>

      {/* Search Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '420px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
              placeholder="Search filename or alt text…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="ops-btn ops-btn-secondary" type="submit">
            Search
          </button>
        </form>
        {data && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            {data.data?.length || 0} assets in library
          </span>
        )}
      </div>

      {!data && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading media assets…</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState message="No media assets in the library yet. Upload an image above." />
      )}

      {data && data.data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {data.data.map((m) => {
            const displayUrl = m.delivery_url || m.url;
            return (
              <div
                key={m.id}
                className="ops-card"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: m.status === 'archived' ? 0.65 : 1,
                }}
              >
                <div>
                  <div
                    style={{
                      width: '100%',
                      height: '160px',
                      borderRadius: 'var(--ops-radius-md)',
                      backgroundColor: 'var(--ops-surface-container)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {displayUrl ? (
                      <img
                        src={displayUrl}
                        alt={m.alt_text || 'Asset preview'}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--ops-outline)' }}>
                        broken_image
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span
                      className="ops-badge"
                      style={{
                        backgroundColor: m.status === 'active' ? 'var(--ops-success-container)' : 'var(--ops-surface-container-high)',
                        color: m.status === 'active' ? 'var(--ops-success)' : 'var(--ops-outline)',
                      }}
                    >
                      {m.status || 'active'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)', fontFamily: 'monospace' }}>
                      {m.format ? m.format.toUpperCase() : 'WEBP'}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0.5rem 0 0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--ops-on-surface)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={m.original_filename ?? m.provider_asset_id ?? 'Media Asset'}
                  >
                    {m.original_filename ?? m.provider_asset_id ?? 'Media Asset'}
                  </p>

                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
                    {m.width && m.height ? `${m.width}×${m.height} px` : 'Responsive'} · {m.provider}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    marginTop: '0.875rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--ops-outline-subtle)',
                  }}
                >
                  {displayUrl && (
                    <button
                      type="button"
                      className="ops-btn ops-btn-secondary ops-btn-sm"
                      onClick={() => copyToClipboard(displayUrl, 'Image URL')}
                      title="Copy public URL"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                      Copy URL
                    </button>
                  )}
                  <button
                    type="button"
                    className="ops-btn ops-btn-secondary ops-btn-sm"
                    onClick={() => copyToClipboard(m.id, 'Asset ID')}
                    title="Copy UUID"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fingerprint</span>
                    Copy ID
                  </button>
                  {m.status === 'active' && (
                    <button
                      type="button"
                      className="ops-btn ops-btn-secondary ops-btn-sm"
                      onClick={() => archive(m.id)}
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    className="ops-btn ops-btn-danger ops-btn-sm"
                    onClick={() => remove(m.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
