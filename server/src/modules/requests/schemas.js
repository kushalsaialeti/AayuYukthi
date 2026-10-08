import { z } from 'zod';
import { uuidSchema } from '../../validation/common.js';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const draftUpsertSchema = z.object({
  idempotency_key: z.string().trim().min(8).max(100),
  current_step: z.number().int().min(1).max(12).default(1),
  payload: z.object({
    recipient_id: z.string().uuid().optional().nullable(),
    service_id: z.string().uuid().optional().nullable(),
    service_ids: z.array(z.string().uuid()).optional().nullable(),
    hospital_id: z.string().uuid().optional().nullable(),
    appointment_type: z.string().trim().max(100).optional().nullable(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    schedule_at: z.string().datetime({ offset: true }).optional().nullable(),
    pickup_required: z.boolean().optional(),
    pickup_address: z.string().trim().max(1000).optional().nullable(),
    dropoff_address: z.string().trim().max(1000).optional().nullable(),
    update_phone: z.string().trim().max(50).optional().nullable(),
    additional_requirements: z.string().trim().max(2000).optional().nullable(),
  }).default({}),
});

// Full submit validation: ownership, publish state, dates, pickup coherence.
export const requestSubmitSchema = z.object({
  idempotency_key: z.string().trim().min(8).max(100),
  recipient_id: uuidSchema,
  service_id: uuidSchema,
  hospital_id: uuidSchema,
  appointment_type: z.string().trim().max(100).optional().nullable(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => d >= todayISO(), {
    message: 'Appointment date cannot be in the past',
  }).optional().nullable(),
  schedule_at: z.string().datetime({ offset: true }).refine((s) => new Date(s).getTime() > Date.now(), {
    message: 'Schedule must be in the future',
  }).optional().nullable(),
  pickup_required: z.boolean().default(false),
  pickup_address: z.string().trim().max(1000).optional().nullable(),
  dropoff_address: z.string().trim().max(1000).optional().nullable(),
  update_phone: z.string().trim().max(50).optional().nullable(),
  additional_requirements: z.string().trim().max(2000).optional().nullable(),
}).refine((v) => !v.pickup_required || (v.pickup_address && v.pickup_address.length > 0), {
  message: 'Pickup address is required when pickup is requested',
  path: ['pickup_address'],
});

export const requestListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['REQUEST_RECEIVED', 'UNDER_REVIEW', 'COORDINATION_IN_PROGRESS', 'CONFIRMED',
    'SCHEDULED', 'SERVICE_IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ACTION_REQUIRED']).optional(),
});
