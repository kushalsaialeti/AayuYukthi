import { z } from 'zod';
import { uuidSchema } from '../../validation/common.js';

export const ticketCreateSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(300),
  message: z.string().trim().min(1, 'Message is required').max(5000),
  request_id: uuidSchema.optional().nullable(),
});

export const messageCreateSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(5000),
});

export const opsTicketListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().max(200).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned: z.string().trim().max(100).optional(),
  q: z.string().trim().max(200).optional(),
});

export const opsTicketStatusSchema = z.object({
  to_status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']),
});

export const opsTicketAssignSchema = z.object({
  assigned_to: z.string().uuid().nullable(),
});

export const opsTicketPrioritySchema = z.object({
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
});

export const opsMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(5000),
  is_internal: z.boolean().default(false),
});
