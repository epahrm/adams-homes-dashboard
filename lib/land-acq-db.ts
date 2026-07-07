import { Pool } from 'pg'

// Shared lot store for the Land Acq Pro pages (public/land-acq-pro).
// Uses the same Supabase Postgres instance as the rest of the app, but a
// dedicated table managed with plain SQL so the onboarding-dashboard Prisma
// schema stays untouched. The table self-provisions on first use.

// The Postgres connection comes from the DATABASE_URL env var (set in Vercel —
// never committed). Strip any query params (e.g. sslmode=require, which makes
// node-postgres verify the server cert and reject Supabase's shared-pooler
// chain with SELF_SIGNED_CERT_IN_CHAIN); TLS is governed by the Pool's ssl
// option below (rejectUnauthorized:false), which the Supabase pooler needs.
const databaseUrl = (process.env.DATABASE_URL || '').split('?')[0]

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
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false },
  })
globalForPool.landAcqPool = pool

export const LOT_STATUSES = [
  'opportunity',      // buy-box market-scan match, pre-triage
  'opportunity-hold', // held for a later campaign
  'dismissed',        // marked unsuitable — never shown/re-added again
  'offer-denied',     // seller declined the offer — re-review in 30 days
  'pending',          // new lead, pre-offer
  'offer-sent',       // offer sent to seller
  'seller-signed',    // seller signed / offer accepted
  'pending-ep-sig',   // awaiting Elizabeth Porter counter-signature
  'ip',               // inspection period
  'manager-driven',   // manager-driven review
  'survey-rcvd',      // survey received
  'cd-approved',      // closing disclosure approved
  'ctc',              // clear to close
  'closed',
  'declined',
  // legacy keys kept so older records still validate
  'awaiting-signature',
  'executed',
  'signed',
  'due-diligence',
  'post-inspection',
  'ready-to-close',
] as const

// Palm Bay lot stipends (max price) by utility type. These are the seed
// defaults — Kevin or Elizabeth can change them from the dashboard, and each
// change is recorded in the audit log. Each lot also stores the stipend that
// applied to it at the time, so changing a default never rewrites history.
export const DEFAULT_STIPENDS: Record<string, number> = {
  'well-septic': 30000,
  'water-septic': 30000,
  'water-sewer': 50000,
}

export const STIPEND_LABELS: Record<string, string> = {
  'well-septic': 'Well / Septic',
  'water-septic': 'Water / Septic',
  'water-sewer': 'Water / Sewer',
}

export function ensureSettingsTable(): Promise<unknown> {
  return pool.query(`
    CREATE TABLE IF NOT EXISTS land_acq_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

export function ensureTable(): Promise<unknown> {
  if (!globalForPool.landAcqTableReady) {
    globalForPool.landAcqTableReady = pool
      .query(`
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
      .catch((e) => {
        // Don't cache the failure — a transient blip at boot must not brick
        // every later request; the next call retries table creation.
        globalForPool.landAcqTableReady = undefined
        throw e
      })
  }
  return globalForPool.landAcqTableReady
}

export function isAdmin(key: string | null): boolean {
  return !!key && key === ADMIN_KEY
}

export function addressKey(address: string): string {
  return address.toLowerCase().replace(/[^a-z0-9]/g, '')
}
