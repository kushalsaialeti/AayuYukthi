import { z } from 'zod';
import { emailSchema, passwordSchema } from '../../validation/common.js';

// Ops login (Phase 3). Customer signup/login/OTP reuse this service in Phase 5.
export const opsLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export { passwordSchema };
