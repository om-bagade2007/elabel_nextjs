import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

// Additive, re-runnable migrations applied at startup, so a deploy can't run ahead of its database
// (inserts list every schema column and fail with 42703 if one is missing).
// profiles.sql is not re-runnable (it creates triggers on auth.users) and stays a manual step.
const FILES = ['add_owner_id_columns.sql', 'add_manufacturing_columns.sql', 'add_ingredients_and_scans.sql'];

export async function ensureSchema(url = process.env.DATABASE_URL) {
  if (!url) return;
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    for (const file of FILES) {
      await sql.unsafe(fs.readFileSync(path.join(process.cwd(), 'server', 'db', file), 'utf8'));
    }
    console.log('Database schema is up to date');
  } finally {
    await sql.end();
  }
}
