import React, { useState } from 'react';
import { ResponsiveImage } from '../../media.jsx';

/**
 * HospitalWireframePlaceholder:
 * Sleek, architectural wireframe graphic displayed when a hospital does not have an uploaded picture.
 * Provides high-aesthetic blueprint lines, hospital facade silhouette, and medical emblem.
 */
export function HospitalWireframePlaceholder({ name = 'Hospital Campus', style = {} }) {
  return (
    <div
      className="hospital-wireframe-placeholder"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#e6eeed',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Blueprint Grid Lines Pattern */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.3 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="wf-hosp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#004349" strokeWidth="0.75" strokeDasharray="2,2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wf-hosp-grid)" />
      </svg>

      {/* Architectural Hospital Building Wireframe Silhouette */}
      <svg
        viewBox="0 0 320 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '85%', height: '85%', maxWidth: '300px', zIndex: 1 }}
      >
        {/* Background Building Structure (Left Wing) */}
        <rect x="40" y="50" width="70" height="110" stroke="#004349" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="55" y1="65" x2="65" y2="65" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="85" y1="65" x2="95" y2="65" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="55" y1="85" x2="65" y2="85" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="85" y1="85" x2="95" y2="85" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="55" y1="105" x2="65" y2="105" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="85" y1="105" x2="95" y2="105" stroke="#004349" strokeWidth="1.2" opacity="0.5" />

        {/* Background Building Structure (Right Wing) */}
        <rect x="210" y="60" width="70" height="100" stroke="#004349" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="225" y1="75" x2="235" y2="75" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="255" y1="75" x2="265" y2="75" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="225" y1="95" x2="235" y2="95" stroke="#004349" strokeWidth="1.2" opacity="0.5" />
        <line x1="255" y1="95" x2="265" y2="95" stroke="#004349" strokeWidth="1.2" opacity="0.5" />

        {/* Central Main Hospital Tower */}
        <rect x="100" y="25" width="120" height="135" fill="#f0f5f4" stroke="#004349" strokeWidth="2" />

        {/* Helipad / Roof Feature */}
        <line x1="120" y1="25" x2="200" y2="25" stroke="#004349" strokeWidth="3" />
        <circle cx="160" cy="15" r="7" stroke="#0d5c63" strokeWidth="1.5" strokeDasharray="2 2" />
        <text x="157" y="18" fill="#0d5c63" fontSize="8" fontWeight="bold">H</text>
        <line x1="160" y1="22" x2="160" y2="25" stroke="#0d5c63" strokeWidth="1.5" />

        {/* Medical Cross Emblem at Top */}
        <rect x="156" y="36" width="8" height="20" rx="1" fill="#0d5c63" />
        <rect x="150" y="42" width="20" height="8" rx="1" fill="#0d5c63" />

        {/* Main Windows Grid */}
        <g stroke="#004349" strokeWidth="1.2" opacity="0.75">
          <rect x="115" y="65" width="18" height="14" rx="1" />
          <rect x="141" y="65" width="18" height="14" rx="1" />
          <rect x="167" y="65" width="18" height="14" rx="1" />
          <rect x="193" y="65" width="18" height="14" rx="1" />

          <rect x="115" y="88" width="18" height="14" rx="1" />
          <rect x="141" y="88" width="18" height="14" rx="1" />
          <rect x="167" y="88" width="18" height="14" rx="1" />
          <rect x="193" y="88" width="18" height="14" rx="1" />

          <rect x="115" y="111" width="18" height="14" rx="1" />
          <rect x="141" y="111" width="18" height="14" rx="1" />
          <rect x="167" y="111" width="18" height="14" rx="1" />
          <rect x="193" y="111" width="18" height="14" rx="1" />
        </g>

        {/* Entrance Atrium & Canopy */}
        <path d="M 135 160 L 135 138 L 185 138 L 185 160 Z" stroke="#004349" strokeWidth="1.8" fill="#ffffff" />
        <path d="M 125 138 L 195 138" stroke="#004349" strokeWidth="2.5" />
        <line x1="160" y1="138" x2="160" y2="160" stroke="#004349" strokeWidth="1" strokeDasharray="2 2" />

        {/* Ground Baseline */}
        <line x1="20" y1="160" x2="300" y2="160" stroke="#004349" strokeWidth="2" />
        <line x1="10" y1="164" x2="310" y2="164" stroke="#004349" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      </svg>

      {/* Wireframe Tag Label */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0, 67, 73, 0.2)',
          fontSize: '10px',
          fontWeight: 700,
          color: '#004349',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          zIndex: 2,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>domain</span>
        <span>Campus Wireframe</span>
      </div>
    </div>
  );
}

/**
 * HospitalImage:
 * Renders the live hospital image from CMS (image_url or media_id or logo_url).
 * If no picture is found or if the image fails to load, gracefully displays the wireframe placeholder.
 */
export function HospitalImage({ hospital, alt = '', style = {}, className = '' }) {
  const [loadFailed, setLoadFailed] = useState(false);

  const rawUrl = hospital?.image_url || hospital?.banner_url || hospital?.logo_url || null;
  const mediaId = hospital?.image_media_id || hospital?.logo_media_id || null;

  // If no picture data exists, or if loading failed, show wireframe
  if (loadFailed || (!rawUrl && !mediaId)) {
    return <HospitalWireframePlaceholder name={hospital?.name_en} style={style} />;
  }

  if (mediaId && !rawUrl) {
    return (
      <ResponsiveImage
        mediaId={mediaId}
        fallbackSrc={rawUrl}
        alt={alt || hospital?.name_en || 'Partner Hospital'}
        widths={[400, 768]}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  return (
    <img
      src={rawUrl}
      alt={alt || hospital?.name_en || 'Partner Hospital'}
      loading="lazy"
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      onError={() => setLoadFailed(true)}
    />
  );
}
