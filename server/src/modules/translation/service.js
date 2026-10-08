import { z } from 'zod';
import { httpError } from '../../middleware/errorHandler.js';
import { translateText, sourceHash } from './providers.js';

// Closed allowlist: only public catalog fields may be translated.
// Personal, auth, request, and internal content is never translatable here.
const TRANSLATABLE = {
  services: ['title_en', 'description_en'],
  hospitals: ['name_en', 'description_en', 'address_en'],
  hero_slides: ['title_en', 'description_en', 'primary_cta_label_en', 'secondary_cta_label_en'],
  faqs: ['question_en', 'answer_en'],
  testimonials: ['author_detail_en', 'quote_en'],
  content_blocks: ['title_en', 'body_en'],
};

const SUPPORTED_LOCALES = ['te'];

export const translateBatchSchema = z.object({
  target_locale: z.enum(SUPPORTED_LOCALES),
  items: z.array(z.object({
    entity_type: z.string().min(1).max(50),
    entity_id: z.string().min(1).max(100),
    field: z.string().min(1).max(50),
  })).min(1).max(50),
});

export function isTranslatable(entityType, field) {
  return (TRANSLATABLE[entityType] ?? []).includes(field);
}

// Returns { text, cached } — throws 404 for unknown rows, 503 when the
// provider fails (callers fall back to English).
export async function translateField(db, { entityType, entityId, field, targetLocale, sourceText: provided }) {
  if (!SUPPORTED_LOCALES.includes(targetLocale)) throw httpError(400, 'UNSUPPORTED_LOCALE', 'This language is not supported yet');
  if (!isTranslatable(entityType, field)) throw httpError(400, 'NOT_TRANSLATABLE', 'This content cannot be translated');

  let sourceText = provided;
  if (sourceText == null) {
    const table = entityType;
    const idCol = table === 'content_blocks' ? 'key' : 'id';
    let rows;
    try {
      ({ rows } = await db.query(`SELECT ${field} AS text FROM ${table} WHERE ${idCol} = $1 LIMIT 1`, [entityId]));
    } catch {
      throw httpError(400, 'NOT_TRANSLATABLE', 'This content cannot be translated');
    }
    if (!rows[0] || rows[0].text == null) throw httpError(404, 'NOT_FOUND', 'Content not found');
    sourceText = rows[0].text;
  }
  if (!sourceText.trim()) return { text: '', cached: true };

  const hash = sourceHash(`${entityType}:${entityId}:${field}:${sourceText}`);
  const hit = (await db.query(
    `SELECT translated_text FROM translation_cache
     WHERE entity_type = $1 AND entity_id = $2 AND field = $3 AND target_locale = $4 AND source_hash = $5 LIMIT 1`,
    [entityType, String(entityId), field, targetLocale, hash],
  )).rows[0];
  if (hit) return { text: hit.translated_text, cached: true };

  let result;
  try {
    result = await translateText({ text: sourceText, targetLocale });
  } catch (err) {
    if (err.code === 'TRANSLATION_UNAVAILABLE') throw httpError(503, 'TRANSLATION_UNAVAILABLE', 'Telugu translation is not configured yet');
    throw httpError(503, 'TRANSLATION_FAILED', 'Translation failed. Showing English instead.');
  }
  await db.query(
    `INSERT INTO translation_cache (entity_type, entity_id, field, source_hash, target_locale, translated_text, provider)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (entity_type, entity_id, field, target_locale) DO UPDATE
       SET translated_text = $6, source_hash = $4, provider = $7, created_at = now()`,
    [entityType, String(entityId), field, hash, targetLocale, result.text, result.provider ?? 'external'],
  );
  return { text: result.text, cached: false };
}

export async function translateBatch(db, { target_locale, targetLocale, items }) {
  const locale = targetLocale ?? target_locale;
  const out = [];
  for (const item of items) {
    try {
      const r = await translateField(db, {
        entityType: item.entity_type ?? item.entityType,
        entityId: item.entity_id ?? item.entityId,
        field: item.field,
        targetLocale: locale,
      });
      out.push({ ...item, text: r.text, cached: r.cached });
    } catch (err) {
      out.push({ ...item, text: null, error: err.code ?? 'FAILED' });
    }
  }
  return out;
}

// Called from CMS update paths so edits to the English master invalidate
// stale translations (next read retranslates via source_hash mismatch).
export async function invalidateTranslations(db, entityType, entityId) {
  await db.query('DELETE FROM translation_cache WHERE entity_type = $1 AND entity_id = $2', [entityType, String(entityId)]);
}
