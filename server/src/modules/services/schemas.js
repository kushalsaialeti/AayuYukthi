import { z } from 'zod';

const statusEnum = z.enum(['draft', 'published', 'archived']);

export const serviceCreateSchema = z.object({
  title_en: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case').optional(),
  description_en: z.string().max(10000).default(''),
  benefits_en: z.array(z.string().max(500)).max(20).default([]),
  subtitle_en: z.string().trim().max(200).default(''),
  icon: z.string().trim().max(60).regex(/^[a-z_]+$/, 'Icon must be a Material Symbol name').nullable().optional(),
  category: z.string().trim().max(60).default('outpatient'),
  image_media_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(10_000_000).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  status: statusEnum.default('draft'),
  is_visible: z.boolean().default(true),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const serviceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  category: z.string().trim().max(60).optional(),
  q: z.string().trim().max(200).optional(),
});
