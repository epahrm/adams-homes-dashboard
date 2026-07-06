import { Pool } from 'pg'

// Shared lot store for the Land Acq Pro pages (public/land-acq-pro).
// Uses the same Supabase Postgres instance as the rest of the app, but a
// dedicated table managed with plain SQL so the onboarding-dashboard Prisma
// schema stays untouched. The table self-provisions on first use.

let databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.tbzuajwitwonwojqshew:AdamsHomes1991!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?schema=public'

if (databaseUrl.includes('AdamsHomes1991!')) {
  databaseUrl = databaseUrl.replace('AdamsHomes1991!', 'AdamsHomes1991%21')
}

// Shared password for the admin pages (Kevin + Elizabeth). Override in the
// Vercel project env settings.
export const ADMIN_KEY = process.env.LAND_ACQ_ADMIN_KEY || 'AdamsHomes2026!'

const globalForPool = global as unknown as {
  landAcqPool?: Pool
  landAcqTableReady?: Promise<unknown>
}

export const pool =
  globalForPool.landAcqPool ||
  new Pool({
    connectionString: databaseUrl,
    max: 3,
    ssl: { rejectUnauthorized: false },
  })
globalForPool.landAcqPool = pool

export function ensureTable(): Promise<unknown> {
  if (!globalForPool.landAcqTableReady) {
    globalForPool.landAcqTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS land_acq_lots (
        id BIGSERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        address_key TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
  }
  return globalForPool.landAcqTableReady
}

export function isAdmin(key: string | null): boolean {
  return !!key && key === ADMIN_KEY
}

export function addressKey(address: string): string {
  return address.toLowerCase().replace(/[^a-z0-9]/g, '')
}
