// One-off/scheduled runner: npm run aggregate --workspace=server
import '../config/env.js';
import pg from 'pg';
import { runDailyAggregation } from '../jobs/aggregate.js';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const db = { query: (t, p) => client.query(t, p) };
  const result = await runDailyAggregation(db);
  console.log(`aggregate: ok (${result.aggregated} day/event rows)`);
} finally {
  await client.end();
}
