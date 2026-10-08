import { httpError } from '../../middleware/errorHandler.js';
import { slugify } from '../../utils/text.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { invalidateTranslations } from '../translation/service.js';
import { getCached, setCached, clearCache } from '../../utils/cache.js';

const FIELDS = [
  'id', 'slug', 'name_en', 'description_en', 'city', 'state', 'address_en', 'pincode',
  'contact_phone', 'contact_email', 'website', 'logo_media_id', 'image_url', 'logo_url', 'status', 'is_visible',
  'wait_info_en', 'campus_highlight_en', 'features_en',
  'tag_en', 'rating', 'assisted_visits_count', 'campus_size_en', 'map_image_url',
  'visiting_hours_en', 'parking_info_en', 'pharmacy_info_en', 'disclaimer_en', 'campus_guide_en',
  'zones', 'meeting_points', 'specialized_services', 'departments_en', 'checklist_en', 'faqs', 'station_lead',
  'created_at', 'updated_at',
];
const COLUMNS = FIELDS.join(', ');

export function toHospitalDto(row, serviceIds = []) {
  return { ...pick(row, FIELDS), service_ids: serviceIds };
}

async function withLogos(db, rows) {
  const ids = [...new Set(rows.map((r) => r.logo_media_id).filter(Boolean))];
  let byId = new Map();
  if (ids.length) {
    const { rows: media } = await db.query('SELECT id, url FROM media WHERE id = ANY($1)', [ids]);
    byId = new Map(media.map((m) => [m.id, m.url]));
  }
  return rows.map((r) => {
    const dto = toHospitalDto(r);
    return {
      ...dto,
      logo_url: r.logo_url || byId.get(r.logo_media_id) || null,
      image_url: r.image_url || null,
    };
  });
}

async function loadServiceIds(db, hospitalId) {
  const { rows } = await db.query('SELECT service_id FROM hospital_services WHERE hospital_id = $1', [hospitalId]);
  return rows.map((r) => r.service_id);
}

async function replaceServiceLinks(db, hospitalId, serviceIds) {
  await db.query('DELETE FROM hospital_services WHERE hospital_id = $1', [hospitalId]);
  for (const sid of serviceIds ?? []) {
    await db.query('INSERT INTO hospital_services (hospital_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [hospitalId, sid]);
  }
}

export async function listHospitals(db, { page, limit, status, city, service_id, q, publishedOnly = false }) {
  const cacheKey = `hospitals:${city || 'all'}:${service_id || 'all'}:${q || ''}:${page}:${limit}`;
  if (publishedOnly && !status) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const where = [];
  const params = [];
  if (publishedOnly || status) {
    params.push(publishedOnly ? 'published' : status);
    where.push(`h.status = $${params.length}`);
  }
  if (publishedOnly) where.push(`h.is_visible = true`);
  if (city) {
    params.push(city);
    where.push(`h.city ILIKE $${params.length}`);
  }
  if (service_id) {
    params.push(service_id);
    where.push(`EXISTS (SELECT 1 FROM hospital_services hs WHERE hs.hospital_id = h.id AND hs.service_id = $${params.length})`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(h.name_en ILIKE $${params.length} OR h.city ILIKE $${params.length})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await db.query(`SELECT COUNT(*)::int AS count FROM hospitals h ${clause}`, params)).rows[0].count;
  params.push(limit, (page - 1) * limit);
  const { rows } = await db.query(
    `SELECT ${COLUMNS.split(', ').map((c) => `h.${c}`).join(', ')} FROM hospitals h ${clause}
     ORDER BY h.name_en ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const result = { items: await withLogos(db, rows), total };
  if (publishedOnly && !status) {
    setCached(cacheKey, result, 30_000);
  }
  return result;
}

export async function getHospitalById(db, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM hospitals WHERE id = $1 LIMIT 1`, [id]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Hospital not found');
  const dto = (await withLogos(db, rows))[0];
  return { ...dto, service_ids: await loadServiceIds(db, id) };
}

export async function getPublishedHospitalBySlug(db, slug) {
  const cacheKey = `hospital_slug:${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM hospitals WHERE slug = $1 AND status = 'published' AND is_visible = true LIMIT 1`,
    [slug],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Hospital not found');
  const dto = (await withLogos(db, rows))[0];
  const result = { ...dto, service_ids: await loadServiceIds(db, rows[0].id) };
  setCached(cacheKey, result, 30_000);
  return result;
}

export async function createHospital(db, actor, input) {
  clearCache('hospitals:');
  clearCache('hospital_slug:');
  const slug = input.slug ?? slugify(input.name_en);
  try {
    const { rows } = await db.query(
      `INSERT INTO hospitals (
        slug, name_en, description_en, city, state, address_en, pincode,
        contact_phone, contact_email, website, logo_media_id, image_url, logo_url,
        wait_info_en, campus_highlight_en, features_en,
        tag_en, rating, assisted_visits_count, campus_size_en, map_image_url,
        visiting_hours_en, parking_info_en, pharmacy_info_en, disclaimer_en, campus_guide_en,
        zones, meeting_points, specialized_services, departments_en, checklist_en, faqs, station_lead,
        status, is_visible, created_by, updated_by
      )
       VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
        $27::jsonb,$28::jsonb,$29::jsonb,$30,$31,$32::jsonb,$33::jsonb,
        $34,$35,$36,$36
       ) RETURNING ${COLUMNS}`,
      [
        slug,
        input.name_en,
        input.description_en ?? '',
        input.city ?? '',
        input.state ?? '',
        input.address_en ?? '',
        input.pincode ?? null,
        input.contact_phone ?? null,
        input.contact_email ?? null,
        input.website ?? null,
        input.logo_media_id ?? null,
        input.image_url ?? null,
        input.logo_url ?? null,
        input.wait_info_en ?? '',
        input.campus_highlight_en ?? '',
        input.features_en ?? [],
        input.tag_en ?? 'Premier Healthcare Hub',
        input.rating !== undefined ? input.rating : 4.9,
        input.assisted_visits_count ?? '250+ assisted visits',
        input.campus_size_en ?? '',
        input.map_image_url ?? null,
        input.visiting_hours_en ?? '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM',
        input.parking_info_en ?? 'Valet & Visitor Parking Available at Main Gate',
        input.pharmacy_info_en ?? '24/7 Pharmacy on Ground Floor',
        input.disclaimer_en ?? '',
        input.campus_guide_en ?? '',
        JSON.stringify(input.zones ?? []),
        JSON.stringify(input.meeting_points ?? []),
        JSON.stringify(input.specialized_services ?? []),
        input.departments_en ?? [],
        input.checklist_en ?? [],
        JSON.stringify(input.faqs ?? []),
        JSON.stringify(input.station_lead ?? {}),
        input.status ?? 'draft',
        input.is_visible ?? true,
        actor.actorId,
      ],
    );
    await replaceServiceLinks(db, rows[0].id, input.service_ids);
    await recordAudit(db, { ...actor, action: 'HOSPITAL_CREATED', entityType: 'hospital', entityId: rows[0].id, metadata: { slug } });
    const dto = (await withLogos(db, rows))[0];
    return { ...dto, service_ids: input.service_ids ?? [] };
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === '23505') throw httpError(409, 'SLUG_TAKEN', 'A hospital with this slug already exists');
    throw err;
  }
}

export async function updateHospital(db, actor, id, input) {
  clearCache('hospitals:');
  clearCache('hospital_slug:');
  const current = await getHospitalById(db, id);
  const merged = {
    slug: input.slug ?? current.slug,
    name_en: input.name_en ?? current.name_en,
    description_en: input.description_en ?? current.description_en,
    city: input.city ?? current.city,
    state: input.state ?? current.state,
    address_en: input.address_en ?? current.address_en,
    pincode: input.pincode !== undefined ? input.pincode : current.pincode,
    contact_phone: input.contact_phone !== undefined ? input.contact_phone : current.contact_phone,
    contact_email: input.contact_email !== undefined ? input.contact_email : current.contact_email,
    website: input.website !== undefined ? input.website : current.website,
    logo_media_id: input.logo_media_id !== undefined ? input.logo_media_id : current.logo_media_id,
    image_url: input.image_url !== undefined ? input.image_url : (current.image_url ?? null),
    logo_url: input.logo_url !== undefined ? input.logo_url : (current.logo_url ?? null),
    wait_info_en: input.wait_info_en !== undefined ? input.wait_info_en : (current.wait_info_en ?? ''),
    campus_highlight_en: input.campus_highlight_en !== undefined ? input.campus_highlight_en : (current.campus_highlight_en ?? ''),
    features_en: input.features_en !== undefined ? input.features_en : (current.features_en ?? []),
    tag_en: input.tag_en !== undefined ? input.tag_en : (current.tag_en ?? 'Premier Healthcare Hub'),
    rating: input.rating !== undefined ? input.rating : (current.rating ?? 4.9),
    assisted_visits_count: input.assisted_visits_count !== undefined ? input.assisted_visits_count : (current.assisted_visits_count ?? '250+ assisted visits'),
    campus_size_en: input.campus_size_en !== undefined ? input.campus_size_en : (current.campus_size_en ?? ''),
    map_image_url: input.map_image_url !== undefined ? input.map_image_url : (current.map_image_url ?? null),
    visiting_hours_en: input.visiting_hours_en !== undefined ? input.visiting_hours_en : (current.visiting_hours_en ?? '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM'),
    parking_info_en: input.parking_info_en !== undefined ? input.parking_info_en : (current.parking_info_en ?? 'Valet & Visitor Parking Available at Main Gate'),
    pharmacy_info_en: input.pharmacy_info_en !== undefined ? input.pharmacy_info_en : (current.pharmacy_info_en ?? '24/7 Pharmacy on Ground Floor'),
    disclaimer_en: input.disclaimer_en !== undefined ? input.disclaimer_en : (current.disclaimer_en ?? ''),
    campus_guide_en: input.campus_guide_en !== undefined ? input.campus_guide_en : (current.campus_guide_en ?? ''),
    zones: input.zones !== undefined ? input.zones : (current.zones ?? []),
    meeting_points: input.meeting_points !== undefined ? input.meeting_points : (current.meeting_points ?? []),
    specialized_services: input.specialized_services !== undefined ? input.specialized_services : (current.specialized_services ?? []),
    departments_en: input.departments_en !== undefined ? input.departments_en : (current.departments_en ?? []),
    checklist_en: input.checklist_en !== undefined ? input.checklist_en : (current.checklist_en ?? []),
    faqs: input.faqs !== undefined ? input.faqs : (current.faqs ?? []),
    station_lead: input.station_lead !== undefined ? input.station_lead : (current.station_lead ?? {}),
    status: input.status ?? current.status,
    is_visible: input.is_visible ?? current.is_visible,
  };
  try {
    const { rows } = await db.query(
      `UPDATE hospitals SET
        slug=$1, name_en=$2, description_en=$3, city=$4, state=$5, address_en=$6,
        pincode=$7, contact_phone=$8, contact_email=$9, website=$10, logo_media_id=$11, image_url=$12, logo_url=$13,
        wait_info_en=$14, campus_highlight_en=$15, features_en=$16,
        tag_en=$17, rating=$18, assisted_visits_count=$19, campus_size_en=$20, map_image_url=$21,
        visiting_hours_en=$22, parking_info_en=$23, pharmacy_info_en=$24, disclaimer_en=$25, campus_guide_en=$26,
        zones=$27::jsonb, meeting_points=$28::jsonb, specialized_services=$29::jsonb,
        departments_en=$30, checklist_en=$31, faqs=$32::jsonb, station_lead=$33::jsonb,
        status=$34, is_visible=$35, updated_by=$36, updated_at=now()
       WHERE id=$37 RETURNING ${COLUMNS}`,
      [
        merged.slug, merged.name_en, merged.description_en, merged.city, merged.state, merged.address_en,
        merged.pincode, merged.contact_phone, merged.contact_email, merged.website, merged.logo_media_id,
        merged.image_url, merged.logo_url,
        merged.wait_info_en, merged.campus_highlight_en, merged.features_en,
        merged.tag_en, merged.rating, merged.assisted_visits_count, merged.campus_size_en, merged.map_image_url,
        merged.visiting_hours_en, merged.parking_info_en, merged.pharmacy_info_en, merged.disclaimer_en, merged.campus_guide_en,
        JSON.stringify(merged.zones ?? []),
        JSON.stringify(merged.meeting_points ?? []),
        JSON.stringify(merged.specialized_services ?? []),
        merged.departments_en ?? [],
        merged.checklist_en ?? [],
        JSON.stringify(merged.faqs ?? []),
        JSON.stringify(merged.station_lead ?? {}),
        merged.status, merged.is_visible, actor.actorId, id,
      ],
    );
    if (input.service_ids !== undefined) await replaceServiceLinks(db, id, input.service_ids);
    const transition = current.status !== merged.status ? merged.status : null;
    const action = transition === 'published' ? 'HOSPITAL_PUBLISHED' : transition === 'archived' ? 'HOSPITAL_ARCHIVED' : 'HOSPITAL_UPDATED';
    await recordAudit(db, { ...actor, action, entityType: 'hospital', entityId: id, metadata: transition ? { from: current.status, to: merged.status } : {} });
    await invalidateTranslations(db, 'hospitals', id);
    const dto = (await withLogos(db, rows))[0];
    return { ...dto, service_ids: input.service_ids ?? await loadServiceIds(db, id) };
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === '23505') throw httpError(409, 'SLUG_TAKEN', 'A hospital with this slug already exists');
    throw err;
  }
}

export async function deleteHospital(db, actor, id) {
  clearCache('hospitals:');
  clearCache('hospital_slug:');
  await db.query(`DELETE FROM hospital_services WHERE hospital_id = $1`, [id]);
  await db.query(`DELETE FROM hospitals WHERE id = $1`, [id]);
  await recordAudit(db, { ...actor, action: 'HOSPITAL_DELETED', entityType: 'hospital', entityId: id, metadata: {} });
  return { id, deleted: true };
}
