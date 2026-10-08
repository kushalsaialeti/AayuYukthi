import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

// Centralized media access. React never hardcodes provider URLs and never
// constructs transformation strings — the API returns ready variants.
const variantCache = new Map();

export async function getMediaVariants(mediaId, widths = [400, 768, 1200]) {
  if (!mediaId) return null;
  const key = `${mediaId}:${widths.join(',')}`;
  if (!variantCache.has(key)) {
    variantCache.set(
      key,
      fetch(`${BASE}/media/${mediaId}?widths=${widths.join(',')}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => b?.data ?? null)
        .catch(() => null),
    );
  }
  return variantCache.get(key);
}

// Responsive image by media_id: reserves dimensions (no CLS), lazy-loads
// below the fold, prioritizes hero/LCP with eager + fetchpriority.
export function ResponsiveImage({ mediaId, fallbackSrc = null, alt = '', widths = [400, 768, 1200], eager = false, className, style }) {
  const [variants, setVariants] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!mediaId) return undefined;
    getMediaVariants(mediaId, widths).then((v) => {
      if (!cancelled) setVariants(v);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  const src = variants?.src ?? fallbackSrc;
  if (!src && !variants) return null;
  return (
    <img
      src={src}
      srcSet={variants?.srcSet || undefined}
      sizes="(max-width: 700px) 400px, (max-width: 1100px) 768px, 1200px"
      alt={alt || variants?.alt_text || ''}
      loading={eager ? 'eager' : 'lazy'}
      fetchpriority={eager ? 'high' : 'auto'}
      width={variants?.width || undefined}
      height={variants?.height || undefined}
      className={className}
      style={style}
    />
  );
}
