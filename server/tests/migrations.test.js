import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

// Staging gate: every migration must apply cleanly on a FRESH database AND
// re-run safely on an already-migrated one (the migrate runner applies each
// file once, but the SQL itself must also tolerate re-application so a
// half-failed deploy can be retried without manual repair).

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../../migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

describe('migration safety (staging gate)', () => {
  it('applies all migrations twice on one database without errors', async () => {
    const pg = new PGlite({ extensions: { pgcrypto } });
    try {
      for (let pass = 1; pass <= 2; pass++) {
        for (const file of files) {
          const sql = fs.readFileSync(path.join(dir, file), 'utf8');
          await pg.exec(sql);
        }
      }
      const tables = await pg.query(`SELECT COUNT(*)::int AS c FROM pg_tables WHERE schemaname = 'public'`);
      expect(tables.rows[0].c).toBeGreaterThanOrEqual(20);
      const roles = await pg.query('SELECT COUNT(*)::int AS c FROM roles');
      expect(roles.rows[0].c).toBe(5);
    } finally {
      await pg.close();
    }
  }, 120_000);
});
