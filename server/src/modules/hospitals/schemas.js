import { z } from 'zod';

const statusEnum = z.enum(['draft', 'published', 'archived']);

const websiteSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const s = val.trim();
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s;
}, z.string().url('Must be a valid URL (e.g. https://example.com)').max(500).nullable().optional());

const emailOptionalSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  return val.trim();
}, z.string().email('Must be a valid email address').max(254).nullable().optional());

const optionalString = (max) => z.preprocess((val) => {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  return val.trim();
}, z.string().max(max).nullable().optional());

const slugOptionalSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'string' || !val.trim()) return undefined;
  return val.trim().toLowerCase().replace(/[\s_]+/g, '-');
}, z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case (e.g. city-hospital)').optional());

const stringOrEmpty = (max, def = '') => z.preprocess((val) => {
  if (val === null || val === undefined) return def;
  return typeof val === 'string' ? val.trim() : String(val);
}, z.string().max(max).default(def));

export const hospitalCreateSchema = z.object({
  name_en: z.string().trim().min(1, 'Name is required').max(200),
  slug: slugOptionalSchema,
  description_en: stringOrEmpty(10000, ''),
  city: stringOrEmpty(120, ''),
  state: stringOrEmpty(120, ''),
  address_en: stringOrEmpty(1000, ''),
  pincode: optionalString(12),
  contact_phone: optionalString(30),
  contact_email: emailOptionalSchema,
  website: websiteSchema,
  logo_media_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(10_000_000).nullable().optional(),
  logo_url: z.string().max(10_000_000).nullable().optional(),
  service_ids: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.string().uuid()).max(50).default([])),
  wait_info_en: stringOrEmpty(200, ''),
  campus_highlight_en: stringOrEmpty(200, ''),
  features_en: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.string().max(100)).max(20).default([])),
  tag_en: stringOrEmpty(200, 'Premier Healthcare Hub'),
  rating: z.coerce.number().min(0).max(5).default(4.9),
  assisted_visits_count: stringOrEmpty(100, '250+ assisted visits'),
  campus_size_en: stringOrEmpty(200, ''),
  map_image_url: z.string().max(10_000_000).nullable().optional(),
  visiting_hours_en: stringOrEmpty(500, '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM'),
  parking_info_en: stringOrEmpty(500, 'Valet & Visitor Parking Available at Main Gate'),
  pharmacy_info_en: stringOrEmpty(500, '24/7 Pharmacy on Ground Floor'),
  disclaimer_en: stringOrEmpty(2000, ''),
  campus_guide_en: stringOrEmpty(5000, ''),
  zones: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.any()).default([])),
  meeting_points: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.any()).default([])),
  specialized_services: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.any()).default([])),
  departments_en: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.string().max(200)).default([])),
  checklist_en: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.string().max(500)).default([])),
  faqs: z.preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.any()).default([])),
  station_lead: z.preprocess((val) => (val === null || val === undefined ? {} : val), z.record(z.any()).default({})),
  status: statusEnum.default('draft'),
  is_visible: z.boolean().default(true),
});

export const hospitalUpdateSchema = hospitalCreateSchema.partial();

export const hospitalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  city: z.string().trim().max(120).optional(),
  service_id: z.string().uuid().optional(),
  q: z.string().trim().max(200).optional(),
});
