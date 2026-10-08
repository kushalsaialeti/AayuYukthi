import { z } from 'zod';
import { emailSchema, passwordSchema, phoneE164Schema } from '../../validation/common.js';

const contact = z.object({
  email: emailSchema.optional().nullable(),
  phone_e164: phoneE164Schema.optional().nullable(),
}).refine((v) => v.email || v.phone_e164, { message: 'Email or phone is required', path: ['email'] });

export const customerSignupSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(200),
  email: emailSchema.optional().nullable(),
  phone_e164: phoneE164Schema.optional().nullable(),
  password: passwordSchema.optional().nullable(),
}).refine((v) => v.email || v.phone_e164, { message: 'Email or phone is required', path: ['email'] });

export const customerLoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone is required').max(254),
  password: z.string().min(1, 'Password is required').max(128),
});

export const otpRequestSchema = z.object({
  purpose: z.enum(['signup', 'login', 'recovery']),
  email: emailSchema.optional().nullable(),
  phone_e164: phoneE164Schema.optional().nullable(),
  identifier: z.string().trim().min(1).max(254).optional().nullable(),
}).refine((v) => v.email || v.phone_e164 || v.identifier, { message: 'Email or phone is required', path: ['email'] });

export const otpVerifySchema = z.object({
  purpose: z.enum(['signup', 'login', 'recovery']),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  email: emailSchema.optional().nullable(),
  phone_e164: phoneE164Schema.optional().nullable(),
  identifier: z.string().trim().min(1).max(254).optional().nullable(),
}).refine((v) => v.email || v.phone_e164 || v.identifier, { message: 'Email or phone is required', path: ['email'] });

export const recoveryConfirmSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  newPassword: passwordSchema,
  email: emailSchema.optional().nullable(),
  phone_e164: phoneE164Schema.optional().nullable(),
  identifier: z.string().trim().min(1).max(254).optional().nullable(),
}).refine((v) => v.email || v.phone_e164 || v.identifier, { message: 'Email or phone is required', path: ['email'] });

export { contact };
