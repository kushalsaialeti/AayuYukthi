import { z } from 'zod';
import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { providerConfig, isConfigured } from './provider.js';
import { selectProvider } from './registry.js';
import { deliveryUrlFor } from './cloudinaryProvider.js';

// Two registration paths:
//  1. Cloudinary upload (signed params → browser uploads direct → register public_id)
//  2. External reference (dev / migrated URLs) — provider='external'
// Validation rejects unsupported types and oversized payloads before anything is stored.

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif']);

export const mediaRegisterSchema = z.object({
  provider: z.enum(['cloudinary', 'external']).default('external'),
  provider_asset_id: z.string().trim().min(1).max(500).optional().nullable(),
  storage_key: z.string().trim().min(1).max(500).optional().nullable(),
  url: z.string().trim().url('URL must be valid').max(2000).optional().nullable(),
  mime_type: z.string().trim().max(100).optional().nullable(),
  size_bytes: z.number().int().positive().max(10 * 1024 * 1024).optional().nullable(),
  original_filename: z.string().trim().max(255).optional().nullable(),
  width: z.number().int().positive().max(12000).optional().nullable(),
  height: z.number().int().positive().max(12000).optional().nullable(),
  format: z.string().trim().max(20).optional().nullable(),
  alt_text: z.string().max(500).default(''),
  entity_type: z.string().trim().max(100).optional().nullable(),
  entity_id: z.string().trim().max(100).optional().nullable(),
}).refine((v) => (v.provider === 'cloudinary' ? !!v.provider_asset_id : !!(v.url || v.storage_key)), {
  message: 'Cloudinary assets need a provider_asset_id; external assets need a url',
});

export const mediaSignatureSchema = z.object({
  folder: z.string().trim().max(200).default('aayuyukthi'),
  public_id: z.string().trim().max(300).optional().nullable(),
});

const FIELDS = ['id', 'provider', 'provider_asset_id', 'storage_key', 'url', 'mime_type', 'size_bytes',
  'original_filename', 'resource_type', 'width', 'height', 'format', 'alt_text', 'entity_type', 'entity_id', 'status', 'created_at'];

const toDto = (row) => pick(row, FIELDS);

function assertMime(mime) {
  if (mime && !IMAGE_MIMES.has(mime.toLowerCase())) {
    throw httpError(400, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG, WebP, AVIF, SVG, or GIF images are accepted');
  }
}

// Resolve the best delivery URL for a row: Cloudinary-optimized when the
// asset lives there and credentials exist, otherwise the stored reference.
export function resolveDeliveryUrl(row, opts = {}) {
  if (row.provider === 'cloudinary' && row.provider_asset_id) {
    try {
      const cfg = providerConfig();
      if (isConfigured(cfg)) return deliveryUrlFor(row.provider_asset_id, opts);
    } catch {
      /* fall through to stored url */
    }
  }
  return row.url;
}

export async function resolveMediaUrls(db, rows, opts = {}) {
  return rows.map((r) => ({ ...toDto(r), delivery_url: resolveDeliveryUrl(r, opts), url: resolveDeliveryUrl(r, opts) ?? r.url }));
}

export async function createMedia(db, actor, input) {
  assertMime(input.mime_type);
  const provider = input.provider ?? 'external';
  const assetId = input.provider_asset_id ?? input.storage_key ?? null;

  if (provider === 'cloudinary') {
    // Verify the asset actually exists when we can (prevents dangling references).
    if (isConfigured()) {
      const meta = await selectProvider().metadata(assetId).catch(() => null);
      if (!meta) throw httpError(400, 'UNKNOWN_ASSET', 'This Cloudinary asset could not be verified');
      input = {
        ...input,
        width: input.width ?? meta.width,
        height: input.height ?? meta.height,
        format: input.format ?? meta.format,
        size_bytes: input.size_bytes ?? meta.bytes ?? null,
      };
    }
    const url = resolveDeliveryUrl({ provider, provider_asset_id: assetId, url: input.url ?? null }, { width: 1200 });
    input = { ...input, url: url ?? input.url ?? null, storage_key: assetId };
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO media (provider, provider_asset_id, storage_key, url, mime_type, size_bytes,
          original_filename, resource_type, width, height, format, alt_text, entity_type, entity_id, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'image',$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${FIELDS.join(',')}`,
      [provider, assetId, input.storage_key ?? assetId, input.url ?? null, input.mime_type ?? null,
        input.size_bytes ?? null, input.original_filename ?? null, input.width ?? null, input.height ?? null,
        input.format ?? null, input.alt_text ?? '', input.entity_type ?? null, input.entity_id ?? null, actor.actorId],
    );
    await recordAudit(db, { ...actor, action: 'MEDIA_UPLOADED', entityType: 'media', entityId: rows[0].id, metadata: { provider } });
    return (await resolveMediaUrls(db, rows))[0];
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === '23505') {
      // Same asset re-registered: return the existing row (reuse over duplicates).
      const { rows } = await db.query(
        `SELECT ${FIELDS.join(',')} FROM media WHERE provider = $1 AND provider_asset_id = $2 LIMIT 1`,
        [provider, assetId],
      );
      if (rows[0]) return (await resolveMediaUrls(db, rows))[0];
      throw httpError(409, 'CONFLICT', 'This media asset is already registered');
    }
    throw err;
  }
}

export function uploadSignature(input) {
  return selectProvider().uploadSignature(input ?? {});
}

export async function listMedia(db, { page, limit, q, status }) {
  const params = [];
  const where = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(original_filename ILIKE $${params.length} OR alt_text ILIKE $${params.length} OR provider_asset_id ILIKE $${params.length})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await db.query(`SELECT COUNT(*)::int AS count FROM media ${clause}`, params)).rows[0].count;
  const { rows } = await db.query(
    `SELECT ${FIELDS.join(',')} FROM media ${clause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit],
  );
  return { items: await resolveMediaUrls(db, rows), total };
}

export async function getMedia(db, id) {
  const { rows } = await db.query(`SELECT ${FIELDS.join(',')} FROM media WHERE id = $1 LIMIT 1`, [id]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Media not found');
  return (await resolveMediaUrls(db, rows))[0];
}

// Responsive variant set for one asset (src + srcSet). Widths map to actual
// display sizes (card 400 / tablet 768 / desktop 1200); the provider renders
// f_auto + q_auto derivatives from the preserved master.
export async function mediaVariants(db, id, widths = [400, 768, 1200]) {
  const { rows } = await db.query(`SELECT ${FIELDS.join(',')} FROM media WHERE id = $1 LIMIT 1`, [id]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Media not found');
  const row = rows[0];
  const safe = [...new Set(widths)].filter((w) => Number.isInteger(w) && w >= 100 && w <= 2400).slice(0, 5);
  const urls = safe.map((w) => ({ width: w, url: resolveDeliveryUrl(row, { width: w }) ?? row.url }));
  const fallback = resolveDeliveryUrl(row, { width: 1200 }) ?? row.url;
  return {
    id: row.id,
    alt_text: row.alt_text,
    width: row.width,
    height: row.height,
    src: fallback,
    srcSet: urls.map((u) => `${u.url} ${u.width}w`).join(', '),
  };
}

export async function archiveMedia(db, actor, id) {
  const { rows } = await db.query(`UPDATE media SET status = 'archived' WHERE id = $1 RETURNING ${FIELDS.join(',')}`, [id]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Media not found');
  await recordAudit(db, { ...actor, action: 'MEDIA_ARCHIVED', entityType: 'media', entityId: id, metadata: {} });
  return (await resolveMediaUrls(db, rows))[0];
}

const REFERENCE_CHECKS = [
  ['services', 'image_media_id'],
  ['hospitals', 'logo_media_id'],
  ['hero_slides', 'image_media_id'],
  ['testimonials', 'image_media_id'],
];

export async function deleteMedia(db, actor, id) {
  const { rows } = await db.query(`SELECT ${FIELDS.join(',')} FROM media WHERE id = $1 LIMIT 1`, [id]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Media not found');
  for (const [table, col] of REFERENCE_CHECKS) {
    const ref = await db.query(`SELECT 1 FROM ${table} WHERE ${col} = $1 LIMIT 1`, [id]);
    if (ref.rows[0]) {
      throw httpError(409, 'MEDIA_IN_USE', `This asset is used by ${table}. Archive it instead of deleting.`);
    }
  }
  await db.query('DELETE FROM media WHERE id = $1', [id]);
  // Controlled provider cleanup: best-effort, only after the DB row is gone.
  if (rows[0].provider === 'cloudinary' && rows[0].provider_asset_id && isConfigured()) {
    await selectProvider().remove(rows[0].provider_asset_id).catch(() => {});
  }
  await recordAudit(db, { ...actor, action: 'MEDIA_DELETED', entityType: 'media', entityId: id, metadata: {} });
  return { ok: true };
}
