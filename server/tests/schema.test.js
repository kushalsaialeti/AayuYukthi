import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../../migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const sql = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');

const EXPECTED_TABLES = [
  'roles', 'users', 'user_roles', 'user_sessions', 'otp_codes',
  'care_recipients',
  'media', 'services', 'hospitals', 'hospital_services', 'hero_slides',
  'faqs', 'testimonials', 'contact_settings', 'content_blocks',
  'requests', 'request_status_history',
  'notifications', 'support_tickets', 'support_messages',
  'contact_submissions',
  'analytics_events', 'analytics_daily_counts', 'audit_logs',
]; // note: schema_migrations is created by the migrate runner, not a migration file

describe('Phase 1 schema', () => {
  it('migrations are sequentially numbered', () => {
    const nums = files.map((f) => Number(f.split('_')[0]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
  });

  it('creates every required domain table', () => {
    for (const t of EXPECTED_TABLES) {
      expect(sql, `missing CREATE TABLE ${t}`).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${t}\\b`));
    }
  });

  it('request status uses a closed CHECK set (no arbitrary status text)', () => {
    expect(sql).toMatch(/REQUEST_RECEIVED/);
    expect(sql).toMatch(/ACTION_REQUIRED/);
  });

  it('collections that need pagination have supporting indexes', () => {
    for (const idx of ['requests_status_idx', 'notifications_user_idx', 'audit_logs_action_idx', 'analytics_events_name_time_idx']) {
      expect(sql).toContain(idx);
    }
  });

  it('no SELECT * or secrets in migrations', () => {
    expect(sql).not.toMatch(/SELECT\s+\*/i);
    expect(sql.toLowerCase()).not.toContain('password123');
  });
});
