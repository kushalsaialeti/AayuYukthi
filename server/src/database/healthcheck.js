import 'dotenv/config';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  await client.query('SELECT 1');
  console.log('db: ok');
} catch (err) {
  console.error(`db: unreachable (${err.code ?? err.message})`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
