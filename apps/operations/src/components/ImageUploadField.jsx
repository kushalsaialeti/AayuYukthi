import React, { useState, useRef } from 'react';
import { api } from '../api.js';
import { optimizeImageToWebP, resolveGoogleDriveUrl } from '../utils/imageOptimizer.js';

/**
 * Reusable Image Upload Field for Operations CMS.
 *
 * Supports two distinct modes:
 * 1. Direct File Upload (Desktop / Mobile file picker or Google Drive link)
 *    - Auto-optimizes on client to lightweight WebP format for low-end device performance.
 *    - Uploads directly to Cloudinary/server media storage.
 * 2. Paste Online URL
 *    - Paste any web image URL with live preview and optional WebP optimization.
 */
export function ImageUploadField({
  label = 'Image / Photo',
  value = '',
  onChange,
  hint = 'Supports WebP, PNG, JPEG, or Google Drive sharing link.',
  aspectRatio = '16/9', // '16/9' | '1/1' | '4/3' | 'auto'
  entityType = null,
  entityId = null,
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [driveUrl, setDriveUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [status, setStatus] = useState(null); // 'optimizing' | 'uploading' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState(null); // { originalBytes, optimizedBytes, width, height }
  const fileInputRef = useRef(null);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      setStatus('optimizing');
      setStatusMessage('Optimizing image to high-fidelity WebP format…');

      // Convert to WebP using client Canvas
      const optimized = await optimizeImageToWebP(file, { maxWidth: 1600, quality: 0.82 });
      setStats({
        originalBytes: optimized.originalBytes,
        optimizedBytes: optimized.optimizedBytes,
        width: optimized.width,
        height: optimized.height,
      });

      setStatus('uploading');
      setStatusMessage('Uploading optimized WebP to media storage…');

      // Upload via backend ops media direct-upload
      const res = await api.create('media/upload', {
        dataUri: optimized.dataUri,
        alt_text: file.name.replace(/\.[^/.]+$/, ''),
        entity_type: entityType,
        entity_id: entityId,
      });

      const uploadedUrl =
        res?.url ||
        res?.webp_url ||
        res?.delivery_url ||
        res?.data?.url ||
        res?.data?.webp_url ||
        res?.data?.delivery_url;

      if (!uploadedUrl) {
        throw new Error('Image uploaded but server did not return a valid URL.');
      }

      onChange(uploadedUrl);
      setStatus('success');
      setStatusMessage(`Saved & uploaded as WebP (${formatBytes(optimized.optimizedBytes)}, reduced from ${formatBytes(optimized.originalBytes)})`);
    } catch (err) {
      console.error('Image upload failed:', err);
      setStatus('error');
      setStatusMessage(err.message || 'Image optimization or upload failed.');
    }
  };

  const handleGoogleDriveImport = async (e) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    const resolved = resolveGoogleDriveUrl(driveUrl);
    if (!resolved) {
      setStatus('error');
      setStatusMessage('Please enter a valid Google Drive sharing link.');
      return;
    }

    try {
      setStatus('uploading');
      setStatusMessage('Importing and converting Google Drive image to WebP…');

      const res = await api.create('media/upload', {
        url: resolved,
        alt_text: 'Google Drive Import',
        entity_type: entityType,
        entity_id: entityId,
      });

      const finalUrl =
        res?.url ||
        res?.webp_url ||
        res?.delivery_url ||
        res?.data?.url ||
        res?.data?.webp_url ||
        resolved;

      onChange(finalUrl);
      setDriveUrl('');
      setStatus('success');
      setStatusMessage('Google Drive image imported and saved successfully!');
    } catch (err) {
      // Fallback: use direct resolved URL
      onChange(resolved);
      setDriveUrl('');
      setStatus('success');
      setStatusMessage('Google Drive link linked successfully!');
    }
  };

  const handleDirectUrlApply = (e) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    const resolved = resolveGoogleDriveUrl(directUrl.trim());
    onChange(resolved);
    setDirectUrl('');
    setStatus('success');
    setStatusMessage('Online image URL applied.');
  };

  const handleRemove = () => {
    onChange('');
    setStatus(null);
    setStatusMessage('');
    setStats(null);
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--color-text, #111)' }}>
        {label}
      </label>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid var(--color-border, #ddd)',
            background: mode === 'upload' ? 'var(--color-primary, #005a5b)' : '#fff',
            color: mode === 'upload' ? '#fff' : 'inherit',
            cursor: 'pointer',
          }}
        >
          Direct Upload (System / Drive)
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid var(--color-border, #ddd)',
            background: mode === 'url' ? 'var(--color-primary, #005a5b)' : '#fff',
            color: mode === 'url' ? '#fff' : 'inherit',
            cursor: 'pointer',
          }}
        >
          Paste Online URL
        </button>
      </div>

      {/* Mode 1: Direct File / Google Drive */}
      {mode === 'upload' && (
        <div style={{ border: '1px dashed var(--color-border, #cbd5e1)', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'optimizing' || status === 'uploading'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
              <span>{status === 'optimizing' ? 'Compressing…' : status === 'uploading' ? 'Uploading…' : 'Choose Image File'}</span>
            </button>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Auto-compressed to WebP (minimal memory, maximum speed)
            </span>
          </div>

          {/* Google Drive Option */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Or paste Google Drive sharing link:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                className="input"
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGoogleDriveImport}
                disabled={!driveUrl.trim() || status === 'uploading'}
                style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                Import from Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Online URL */}
      {mode === 'url' && (
        <div style={{ border: '1px solid var(--color-border, #cbd5e1)', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              className="input"
              type="url"
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg or Google Drive link"
              style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDirectUrlApply}
              disabled={!directUrl.trim()}
              style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              Apply URL
            </button>
          </div>
        </div>
      )}

      {/* Progress / Status feedback */}
      {statusMessage && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: status === 'error' ? '#fee2e2' : status === 'success' ? '#ecfdf5' : '#eff6ff',
            color: status === 'error' ? '#b91c1c' : status === 'success' ? '#047857' : '#1d4ed8',
            fontWeight: 500,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Live Preview Block */}
      {value ? (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div
            style={{
              width: '100px',
              height: '70px',
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={value}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                Active Web Image
              </span>
              {stats && (
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {stats.width}x{stats.height} • {formatBytes(stats.optimizedBytes)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              border: 'none',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
