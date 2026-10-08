import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

// In-memory batch cache: one entry per entity+field+locale for the session.
// Server-side translation_cache persists across loads; this avoids repeat
// requests within a session and lets language switches feel instant.
const memoryCache = new Map();
const inFlight = new Map();

const keyOf = (entityType, entityId, field, locale) => `${locale}:${entityType}:${entityId}:${field}`;

async function postBatch(items, locale) {
  const res = await fetch(`${BASE}/translate/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_locale: locale, items }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? 'Translation failed');
  return body.data ?? [];
}

export async function translateItems(items, locale) {
  if (locale === 'en' || items.length === 0) return {};
  const missing = items.filter((i) => {
    const k = keyOf(i.entity_type, i.entity_id, i.field, locale);
    return !memoryCache.has(k) && !inFlight.has(k);
  });
  if (missing.length > 0) {
    const promise = postBatch(missing, locale)
      .then((results) => {
        for (const r of results) {
          memoryCache.set(keyOf(r.entity_type, r.entity_id, r.field, locale), r.text ?? null);
        }
      })
      .catch(() => {
        // Failure fallback: leave cache empty; callers render English.
        for (const m of missing) memoryCache.set(keyOf(m.entity_type, m.entity_id, m.field, locale), null);
      })
      .finally(() => {
        for (const m of missing) inFlight.delete(keyOf(m.entity_type, m.entity_id, m.field, locale));
      });
    for (const m of missing) inFlight.set(keyOf(m.entity_type, m.entity_id, m.field, locale), promise);
    await promise;
  } else {
    const pending = items
      .map((i) => inFlight.get(keyOf(i.entity_type, i.entity_id, i.field, locale)))
      .filter(Boolean);
    if (pending.length) await Promise.all(pending);
  }
  const out = {};
  for (const i of items) {
    out[`${i.entity_type}:${i.entity_id}:${i.field}`] = memoryCache.get(keyOf(i.entity_type, i.entity_id, i.field, locale)) ?? null;
  }
  return out;
}

export function lookupTranslation(entityType, entityId, field, locale, sourceText) {
  if (locale === 'en') return sourceText;
  const hit = memoryCache.get(keyOf(entityType, entityId, field, locale));
  return hit || sourceText; // null/empty → English fallback
}

// Hook: batch-translate a list of CMS fields for the current locale.
// Usage: const t = useTranslatedText(locale, [{entity_type:'services',entity_id,field:'title_en',source}])
export function useTranslatedText(locale, items) {
  const [, force] = useState(0);
  const fingerprint = JSON.stringify((items ?? []).map((i) => [i.entity_type, i.entity_id, i.field]));
  useEffect(() => {
    let cancelled = false;
    if (locale === 'en' || !items?.length) return undefined;
    translateItems(items, locale).then(() => {
      if (!cancelled) force((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, fingerprint]);

  return (entityType, entityId, field, source) => lookupTranslation(entityType, entityId, field, locale, source);
}
