import { z } from 'zod';
import { localeSchema } from '../../validation/common.js';

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(200).optional(),
  locale: localeSchema.optional(),
  preferences: z.object({
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  }).passthrough().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
