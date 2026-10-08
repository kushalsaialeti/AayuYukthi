import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../../../migrations');

async function connectClient() {
  const directUrl = process.env.DIRECT_DATABASE_URL;
  const poolUrl = process.env.DATABASE_URL;

  if (!directUrl && !poolUrl) {
    console.error('DIRECT_DATABASE_URL (or DATABASE_URL) is required to run migrations.');
    process.exit(1);
  }

  if (directUrl) {
    try {
      const directClient = new pg.Client({ connectionString: directUrl, connectionTimeoutMillis: 4000 });
      await directClient.connect();
      console.log('Connected via DIRECT_DATABASE_URL');
      return directClient;
    } catch (err) {
      console.warn(`Direct connection failed (${err.code ?? err.message}); falling back to DATABASE_URL...`);
    }
  }

  if (!poolUrl) {
    console.error('DATABASE_URL is not set as fallback.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: poolUrl });
  await client.connect();
  console.log('Connected via DATABASE_URL');
  return client;
}

async function main() {
  const client = await connectClient();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    const applied = new Set((await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename));
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`apply ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
