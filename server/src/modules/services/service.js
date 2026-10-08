import { httpError } from '../../middleware/errorHandler.js';
import { slugify } from '../../utils/text.js';
import { toServiceDto } from './dto.js';
import { recordAudit } from '../audit/writer.js';
import { invalidateTranslations } from '../translation/service.js';
import { getCached, setCached, clearCache } from '../../utils/cache.js';

const COLUMNS = `id, slug, title_en, description_en, benefits_en, image_media_id, image_url,
  sort_order, status, is_visible, subtitle_en, icon, category, created_at, updated_at`;

function auditFor(statusTransition) {
  if (statusTransition === 'published') return 'SERVICE_PUBLISHED';
  if (statusTransition === 'archived') return 'SERVICE_ARCHIVED';
  return 'SERVICE_UPDATED';
}

export async function listServices(db, { page, limit, status, category, q, publishedOnly = false }) {
  const cacheKey = `services:${category || 'all'}:${q || ''}:${page}:${limit}`;
  if (publishedOnly && !status) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const where = [];
  const params = [];
  if (publishedOnly || status) {
    params.push(publishedOnly ? 'published' : status);
    where.push(`status = $${params.length}`);
  }
  if (publishedOnly) where.push(`is_visible = true`);
  if (category && category !== 'all') {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(title_en ILIKE $${params.length} OR description_en ILIKE $${params.length})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await db.query(`SELECT COUNT(*)::int AS count FROM services ${clause}`, params)).rows[0].count;
  params.push(limit, (page - 1) * limit);
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM services ${clause} ORDER BY sort_order ASC, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const result = { items: await withImageUrls(db, rows), total };
  if (publishedOnly && !status) {
    setCached(cacheKey, result, 30_000);
  }
  return result;
}

async function withImageUrls(db, rows) {
  const ids = [...new Set(rows.map((r) => r.image_media_id).filter(Boolean))];
  let byId = new Map();
  if (ids.length) {
    const { rows: media } = await db.query('SELECT id, url FROM media WHERE id = ANY($1)', [ids]);
    byId = new Map(media.map((m) => [m.id, m.url]));
  }
  return rows.map((r) => ({
    ...toServiceDto(r),
    image_url: r.image_url || byId.get(r.image_media_id) || null,
  }));
}

export async function getServiceById(db, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM services WHERE id = $1 LIMIT 1`, [id]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Service not found');
  return (await withImageUrls(db, rows))[0];
}

export async function getPublishedServiceBySlug(db, slug) {
  const cacheKey = `service_slug:${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM services WHERE slug = $1 AND status = 'published' AND is_visible = true LIMIT 1`,
    [slug],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Service not found');
  const result = (await withImageUrls(db, rows))[0];
  setCached(cacheKey, result, 30_000);
  return result;
}

export async function createService(db, actor, input) {
  clearCache('services:');
  clearCache('service_slug:');
  const slug = input.slug ?? slugify(input.title_en);
  try {
    const { rows } = await db.query(
      `INSERT INTO services (slug, title_en, description_en, benefits_en, image_media_id, image_url,
        sort_order, status, is_visible, subtitle_en, icon, category, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING ${COLUMNS}`,
      [slug, input.title_en, input.description_en ?? '', input.benefits_en ?? [],
        input.image_media_id ?? null, input.image_url ?? null, input.sort_order ?? 0, input.status ?? 'draft',
        input.is_visible ?? true, input.subtitle_en ?? '', input.icon ?? null, input.category ?? 'outpatient', actor.actorId],
    );
    await recordAudit(db, { ...actor, action: 'SERVICE_CREATED', entityType: 'service', entityId: rows[0].id, metadata: { slug } });
    return (await withImageUrls(db, rows))[0];
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === '23505') throw httpError(409, 'SLUG_TAKEN', 'A service with this slug already exists');
    throw err;
  }
}

export async function updateService(db, actor, id, input) {
  clearCache('services:');
  clearCache('service_slug:');
  const current = await getServiceById(db, id);
  const slug = input.slug ?? current.slug;
  const merged = {
    title_en: input.title_en ?? current.title_en,
    description_en: input.description_en ?? current.description_en,
    benefits_en: input.benefits_en ?? current.benefits_en,
    subtitle_en: input.subtitle_en ?? current.subtitle_en ?? '',
    icon: input.icon !== undefined ? input.icon : current.icon,
    category: input.category !== undefined ? input.category : current.category,
    image_media_id: input.image_media_id !== undefined ? input.image_media_id : current.image_media_id,
    image_url: input.image_url !== undefined ? input.image_url : (current.image_url ?? null),
    sort_order: input.sort_order ?? current.sort_order,
    status: input.status ?? current.status,
    is_visible: input.is_visible ?? current.is_visible,
  };
  try {
    const { rows } = await db.query(
      `UPDATE services SET slug=$1, title_en=$2, description_en=$3, benefits_en=$4, image_media_id=$5, image_url=$6,
        sort_order=$7, status=$8, is_visible=$9, subtitle_en=$10, icon=$11, category=$12, updated_by=$13, updated_at=now()
       WHERE id=$14 RETURNING ${COLUMNS}`,
      [slug, merged.title_en, merged.description_en, merged.benefits_en, merged.image_media_id, merged.image_url,
        merged.sort_order, merged.status, merged.is_visible, merged.subtitle_en, merged.icon, merged.category ?? 'outpatient', actor.actorId, id],
    );
    const transition = current.status !== merged.status ? merged.status : null;
    await recordAudit(db, {
      ...actor, action: auditFor(transition), entityType: 'service', entityId: id,
      metadata: transition ? { from: current.status, to: merged.status } : {},
    });
    await invalidateTranslations(db, 'services', id);
    return (await withImageUrls(db, rows))[0];
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === '23505') throw httpError(409, 'SLUG_TAKEN', 'A service with this slug already exists');
    throw err;
  }
}

export async function deleteService(db, actor, id) {
  clearCache('services:');
  clearCache('service_slug:');
  await db.query(`DELETE FROM services WHERE id = $1`, [id]);
  await recordAudit(db, { ...actor, action: 'SERVICE_DELETED', entityType: 'service', entityId: id, metadata: {} });
  return { id, deleted: true };
}
