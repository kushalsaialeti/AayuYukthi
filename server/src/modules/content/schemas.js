import { z } from 'zod';

export const heroSlideSchema = z.object({
  title_en: z.string().trim().min(1, 'Title is required').max(200),
  description_en: z.string().max(2000).default(''),
  short_label_en: z.string().trim().max(40).default(''),
  image_media_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(10_000_000).nullable().optional(),
  primary_cta_label_en: z.string().max(100).optional().nullable(),
  primary_cta_url: z.string().max(500).optional().nullable(),
  secondary_cta_label_en: z.string().max(100).optional().nullable(),
  secondary_cta_url: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export const heroSlideUpdateSchema = heroSlideSchema.partial();

export const faqSchema = z.object({
  question_en: z.string().trim().min(1, 'Question is required').max(500),
  answer_en: z.string().max(10000).default(''),
  category: z.string().trim().max(100).default('general'),
  sort_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
});
export const faqUpdateSchema = faqSchema.partial();

export const testimonialSchema = z.object({
  author_name: z.string().trim().min(1, 'Author name is required').max(200),
  author_detail_en: z.string().max(500).default(''),
  quote_en: z.string().trim().min(1, 'Quote is required').max(5000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  image_media_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(10_000_000).nullable().optional(),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});
export const testimonialUpdateSchema = testimonialSchema.partial();

export const contentBlockSchema = z.object({
  key: z.string().trim().min(1).max(120).regex(/^[a-z0-9_.]+$/, 'Key must be namespaced (e.g. about.story)'),
  title_en: z.string().max(500).default(''),
  body_en: z.string().max(50000).default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  icon: z.string().trim().max(60).regex(/^[a-z_]+$/, 'Icon must be a Material Symbol name').nullable().optional(),
});
export const contentBlockUpdateSchema = contentBlockSchema.omit({ key: true }).partial();

export const contactSettingsSchema = z.object({
  phone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  address_en: z.string().max(2000).default(''),
  hours_en: z.string().max(2000).default(''),
  socials: z.record(z.string().max(5000)).default({}),
});
