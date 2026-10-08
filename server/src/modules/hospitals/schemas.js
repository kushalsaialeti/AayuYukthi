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

export const hospitalCreateSchema = z.object({
  name_en: z.string().trim().min(1, 'Name is required').max(200),
  slug: slugOptionalSchema,
  description_en: z.string().max(10000).default(''),
  city: z.string().trim().max(120).default(''),
  state: z.string().trim().max(120).default(''),
  address_en: z.string().max(1000).default(''),
  pincode: optionalString(12),
  contact_phone: optionalString(30),
  contact_email: emailOptionalSchema,
  website: websiteSchema,
  logo_media_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(10_000_000).nullable().optional(),
  logo_url: z.string().max(10_000_000).nullable().optional(),
  service_ids: z.array(z.string().uuid()).max(50).default([]),
  wait_info_en: z.string().max(200).default(''),
  campus_highlight_en: z.string().max(200).default(''),
  features_en: z.array(z.string().max(100)).max(20).default([]),
  tag_en: z.string().max(200).default('Premier Healthcare Hub'),
  rating: z.coerce.number().min(0).max(5).default(4.9),
  assisted_visits_count: z.string().max(100).default('250+ assisted visits'),
  campus_size_en: z.string().max(200).default(''),
  map_image_url: z.string().max(10_000_000).nullable().optional(),
  visiting_hours_en: z.string().max(500).default('10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM'),
  parking_info_en: z.string().max(500).default('Valet & Visitor Parking Available at Main Gate'),
  pharmacy_info_en: z.string().max(500).default('24/7 Pharmacy on Ground Floor'),
  disclaimer_en: z.string().max(2000).default(''),
  campus_guide_en: z.string().max(5000).default(''),
  zones: z.array(z.any()).default([]),
  meeting_points: z.array(z.any()).default([]),
  specialized_services: z.array(z.any()).default([]),
  departments_en: z.array(z.string().max(200)).default([]),
  checklist_en: z.array(z.string().max(500)).default([]),
  faqs: z.array(z.any()).default([]),
  station_lead: z.record(z.any()).default({}),
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
