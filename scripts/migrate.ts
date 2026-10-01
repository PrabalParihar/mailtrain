import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
if (!process.env.MIGRATION_DATABASE_URL)
  throw new Error('MIGRATION_DATABASE_URL required; runtime must never own migrations');
const c = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
await c.connect();
try {
  const exists = (await c.query("SELECT 1 FROM pg_roles WHERE rolname='mailcraft_runtime'"))
    .rowCount;
  if (!exists) {
    const host = new URL(process.env.MIGRATION_DATABASE_URL).hostname;
    if (
      process.env.LOCAL_DEVELOPMENT !== 'true' ||
      !['127.0.0.1', 'localhost', 'postgres'].includes(host)
    )
      throw new Error(
        'Provision a restricted mailcraft_runtime role privately before production migration.',
      );
    await c.query(
      "CREATE ROLE mailcraft_runtime LOGIN PASSWORD 'mailcraft_local_runtime' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE",
    );
  }
  const role = (
    await c.query(
      "SELECT rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname='mailcraft_runtime'",
    )
  ).rows[0];
  if (Object.values(role).some(Boolean))
    throw new Error('Runtime role is privileged. Migration refused.');
  await c.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY,applied_at timestamptz DEFAULT now())',
  );
  for (const file of (await readdir('db')).filter((f) => /^\d+.*\.sql$/.test(f)).sort()) {
    const version = file.replace(/\.sql$/, '');
    if ((await c.query('SELECT 1 FROM schema_migrations WHERE version=$1', [version])).rowCount)
      continue;
    await c.query('BEGIN');
    try {
      await c.query(await readFile('db/' + file, 'utf8'));
      await c.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING', [
        version,
      ]);
      await c.query('COMMIT');
      console.log(version + ' applied');
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
  }
} finally {
  await c.end();
}
