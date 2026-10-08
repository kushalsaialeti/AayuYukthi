import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PG_POOL_MAX: z.coerce.number().int().min(2).max(50).default(10),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('AayuYukthi Care <onboarding@resend.dev>'),
  RENDER_EXTERNAL_URL: z.string().optional(),
  KEEP_ALIVE_URL: z.string().optional(),
  KEEP_ALIVE_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(60).default(8),
  KEEP_ALIVE_DISABLED: z.coerce.boolean().default(false),
});

const isTestRun = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL ?? (isTestRun ? 'postgres://test:test@localhost:5432/aayuyukthi_test' : undefined),
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET ?? (isTestRun ? 'test-only-secret-min-32-chars-xxxxxxxx' : undefined),
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  PG_POOL_MAX: process.env.PG_POOL_MAX,
  LOG_LEVEL: process.env.NODE_ENV === 'test' ? 'error' : process.env.LOG_LEVEL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
  KEEP_ALIVE_URL: process.env.KEEP_ALIVE_URL,
  KEEP_ALIVE_INTERVAL_MINUTES: process.env.KEEP_ALIVE_INTERVAL_MINUTES,
  KEEP_ALIVE_DISABLED: process.env.KEEP_ALIVE_DISABLED,
});

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
  // Supabase: the app talks to the pooler (6543); migrations run on the direct host.
  migrationUrl: parsed.data.DIRECT_DATABASE_URL ?? parsed.data.DATABASE_URL,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
};
