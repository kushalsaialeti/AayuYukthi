import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../../../migrations');

// Boots an isolated embedded Postgres, applies every migration in order,
// and returns a db handle with the same { query } shape services expect.
export async function bootTestDb() {
  const pg = new PGlite({ extensions: { pgcrypto } });
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pg.exec(sql);
  }
  const db = {
    query: async (text, params = []) => pg.query(text, params),
  };
  return { db, close: () => pg.close() };
}
