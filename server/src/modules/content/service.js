import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { invalidateTranslations } from '../translation/service.js';
import { getCached, setCached, clearCache } from '../../utils/cache.js';

// Generic small-entity helpers: hero_slides, faqs, testimonials share the
// create/list/update shape, so one factory covers all three (no copied logic).

function makeEntity({ table, dtoFields, auditPrefix, orderBy, publishedWhere = null, imageColumn = null, imageKey = 'image_url' }) {
  const columns = dtoFields.join(', ');
  const toDto = (row) => pick(row, dtoFields);

  async function attachImages(db, items) {
    if (!imageColumn && !items.some((i) => i.image_url !== undefined)) return items;
    const ids = imageColumn ? [...new Set(items.map((i) => i[imageColumn]).filter(Boolean))] : [];
    let byId = new Map();
    if (ids.length) {
      const { rows } = await db.query(`SELECT id, url FROM media WHERE id = ANY($1)`, [ids]);
      byId = new Map(rows.map((r) => [r.id, r.url]));
    }
    return items.map((i) => ({
      ...toDto(i),
      [imageKey]: i.image_url || (imageColumn ? byId.get(i[imageColumn]) : null) || null,
    }));
  }

  async function list(db, { page, limit, publishedOnly = false }) {
    const cacheKey = `${table}:${publishedOnly ? 'pub' : 'all'}:${page}:${limit}`;
    if (publishedOnly) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    const clause = publishedOnly && publishedWhere ? `WHERE ${publishedWhere}` : '';
    const total = (await db.query(`SELECT COUNT(*)::int AS count FROM ${table} ${clause}`)).rows[0].count;
    const { rows } = await db.query(
      `SELECT ${columns} FROM ${table} ${clause} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit],
    );
    const result = { items: await attachImages(db, rows), total };
    if (publishedOnly) {
      setCached(cacheKey, result, 30_000);
    }
    return result;
  }

  async function get(db, id) {
    const { rows } = await db.query(`SELECT ${columns} FROM ${table} WHERE id = $1 LIMIT 1`, [id]);
    if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Content not found');
    return toDto(rows[0]);
  }

  async function create(db, actor, input, columnNames) {
    clearCache(`${table}:`);
    clearCache('home_bundle');
    const cols = columnNames.filter((c) => input[c] !== undefined);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await db.query(
      `INSERT INTO ${table} (${cols.join(',')}, created_by, updated_by) VALUES (${placeholders},$${cols.length + 1},$${cols.length + 1}) RETURNING ${columns}`,
      [...cols.map((c) => input[c] ?? null), actor.actorId],
    );
    await recordAudit(db, { ...actor, action: `${auditPrefix}_CREATED`, entityType: table, entityId: rows[0].id, metadata: {} });
    return toDto(rows[0]);
  }

  async function update(db, actor, id, input) {
    clearCache(`${table}:`);
    clearCache('home_bundle');
    await get(db, id);
    const cols = Object.keys(input);
    if (cols.length === 0) return get(db, id);
    const sets = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
    const { rows } = await db.query(
      `UPDATE ${table} SET ${sets}, updated_at=now() WHERE id=$${cols.length + 1} RETURNING ${columns}`,
      [...cols.map((c) => input[c]), id],
    );
    await recordAudit(db, { ...actor, action: `${auditPrefix}_UPDATED`, entityType: table, entityId: id, metadata: {} });
    await invalidateTranslations(db, table, id);
    return toDto(rows[0]);
  }

  async function remove(db, actor, id) {
    clearCache(`${table}:`);
    clearCache('home_bundle');
    await get(db, id);
    await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    await recordAudit(db, { ...actor, action: `${auditPrefix}_DELETED`, entityType: table, entityId: id, metadata: {} });
    return { id, deleted: true };
  }

  return { list, get, create, update, remove };
}

export const heroSlides = makeEntity({
  table: 'hero_slides',
  dtoFields: ['id', 'title_en', 'description_en', 'short_label_en', 'image_media_id', 'image_url',
    'primary_cta_label_en', 'primary_cta_url', 'secondary_cta_label_en', 'secondary_cta_url',
    'sort_order', 'is_active', 'created_at', 'updated_at'],
  auditPrefix: 'HERO_SLIDE',
  orderBy: 'sort_order ASC, created_at DESC',
  publishedWhere: 'is_active = true',
  imageColumn: 'image_media_id',
});

export const faqs = makeEntity({
  table: 'faqs',
  dtoFields: ['id', 'question_en', 'answer_en', 'category', 'sort_order', 'is_published', 'created_at', 'updated_at'],
  auditPrefix: 'FAQ',
  orderBy: 'sort_order ASC, created_at DESC',
  publishedWhere: 'is_published = true',
});

export const testimonials = makeEntity({
  table: 'testimonials',
  dtoFields: ['id', 'author_name', 'author_detail_en', 'quote_en', 'rating', 'image_media_id', 'image_url',
    'is_published', 'sort_order', 'created_at', 'updated_at'],
  auditPrefix: 'TESTIMONIAL',
  orderBy: 'sort_order ASC, created_at DESC',
  publishedWhere: 'is_published = true',
  imageColumn: 'image_media_id',
});

const BLOCK_FIELDS = ['key', 'title_en', 'body_en', 'status', 'icon', 'created_at', 'updated_at'];

export async function listContentBlocks(db) {
  const { rows } = await db.query(`SELECT ${BLOCK_FIELDS.join(',')} FROM content_blocks ORDER BY key ASC`);
  return rows.map((r) => pick(r, BLOCK_FIELDS));
}

export async function upsertContentBlock(db, actor, input) {
  clearCache('content_blocks:');
  const { rows } = await db.query(
    `INSERT INTO content_blocks (key, title_en, body_en, status, icon, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (key) DO UPDATE SET title_en=$2, body_en=$3, status=$4, icon=$5, updated_by=$6, updated_at=now()
     RETURNING ${BLOCK_FIELDS.join(',')}`,
    [input.key, input.title_en ?? '', input.body_en ?? '', input.status ?? 'draft', input.icon ?? null, actor.actorId],
  );
  return pick(rows[0], BLOCK_FIELDS);
}

export async function deleteContentBlock(db, actor, key) {
  clearCache('content_blocks:');
  clearCache(`content_block_single:${key}`);
  await db.query(`DELETE FROM content_blocks WHERE key = $1`, [key]);
  await recordAudit(db, { ...actor, action: 'CONTENT_DELETED', entityType: 'content_blocks', entityId: key, metadata: {} });
  await invalidateTranslations(db, 'content_blocks', key);
  return { key, deleted: true };
}

export async function getPublishedBlock(db, key) {
  const cacheKey = `content_block_single:${key}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { rows } = await db.query(
    `SELECT ${BLOCK_FIELDS.join(',')} FROM content_blocks WHERE key = $1 AND status = 'published' LIMIT 1`, [key],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Content not found');
  const result = pick(rows[0], BLOCK_FIELDS);
  setCached(cacheKey, result, 30_000);
  return result;
}

export async function getPublishedBlocks(db, keys) {
  if (!keys.length) return {};
  const cacheKey = `content_blocks:${[...keys].sort().join(',')}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { rows } = await db.query(
    `SELECT ${BLOCK_FIELDS.join(',')} FROM content_blocks WHERE key = ANY($1::text[]) AND status = 'published'`,
    [keys],
  );
  const out = {};
  for (const r of rows) out[r.key] = pick(r, BLOCK_FIELDS);
  setCached(cacheKey, out, 30_000);
  return out;
}

export async function getContactSettings(db) {
  const cacheKey = 'contact_settings:1';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { rows } = await db.query('SELECT id, phone, email, address_en, hours_en, socials, updated_at FROM contact_settings WHERE id = 1 LIMIT 1');
  const result = rows[0] ?? { id: 1, phone: null, email: null, address_en: '', hours_en: '', socials: {} };
  setCached(cacheKey, result, 30_000);
  return result;
}

export async function updateContactSettings(db, actor, input) {
  clearCache('contact_settings:');
  const { rows } = await db.query(
    `UPDATE contact_settings SET phone=$1, email=$2, address_en=$3, hours_en=$4, socials=$5::jsonb, updated_by=$6, updated_at=now()
     WHERE id = 1 RETURNING id, phone, email, address_en, hours_en, socials, updated_at`,
    [input.phone ?? null, input.email ?? null, input.address_en ?? '', input.hours_en ?? '',
      JSON.stringify(input.socials ?? {}), actor.actorId],
  );
  await recordAudit(db, { ...actor, action: 'CONTACT_UPDATED', entityType: 'contact_settings', entityId: '1', metadata: {} });
  return rows[0];
}
