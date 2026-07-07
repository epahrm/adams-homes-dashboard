import { Pool } from 'pg'
import crypto from 'crypto'

// Data layer for the Virtual Sales Agent Video Interview platform
// (public/sales-interview). Follows the Land Acq Pro pattern: same Supabase
// Postgres instance, dedicated plain-SQL tables so the onboarding-dashboard
// Prisma schema stays untouched. Tables self-provision on first use.

let databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.tbzuajwitwonwojqshew:AdamsHomes1991!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?schema=public'

if (databaseUrl.includes('AdamsHomes1991!')) {
  databaseUrl = databaseUrl.replace('AdamsHomes1991!', 'AdamsHomes1991%21')
}

// Shared password for the hiring admin pages. Override in Vercel env settings.
export const ADMIN_KEY = process.env.INTERVIEW_ADMIN_KEY || 'AdamsHomes2026!'

export function isAdmin(key: string | null | undefined): boolean {
  return !!key && key === ADMIN_KEY
}

const globalForPool = global as unknown as {
  interviewPool?: Pool
  interviewTablesReady?: Promise<unknown>
}

export const pool =
  globalForPool.interviewPool ||
  new Pool({
    connectionString: databaseUrl,
    max: 3,
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false },
  })
globalForPool.interviewPool = pool

// ---------------------------------------------------------------------------
// Domain constants (from the Adams Homes ECF enterprise hiring platform spec)
// ---------------------------------------------------------------------------

// ECF divisions, color-coded per the spec: JAX red, DAY blue, ORL green,
// MEL purple, PSL orange.
export const DIVISIONS = [
  { code: 'JAX', name: 'Jacksonville', color: '#d9534f' },
  { code: 'DAY', name: 'Daytona', color: '#1a5ba5' },
  { code: 'ORL', name: 'Orlando', color: '#1a7a44' },
  { code: 'MEL', name: 'Melbourne', color: '#7a4fb5' },
  { code: 'PSL', name: 'Port St. Lucie', color: '#e8963c' },
] as const

// The 6 scored competencies with decision weights.
export const COMPETENCIES = [
  { key: 'coachability', label: 'Coachability', weight: 25 },
  { key: 'drive', label: 'Competitive Drive', weight: 20 },
  { key: 'sales_presence', label: 'Sales Presence', weight: 20 },
  { key: 'communication', label: 'Communication', weight: 15 },
  { key: 'eq', label: 'Emotional Intelligence', weight: 10 },
  { key: 'professionalism', label: 'Professionalism', weight: 10 },
] as const

export type CompetencyKey = (typeof COMPETENCIES)[number]['key']

export const CANDIDATE_STATUSES = [
  'applied', // application + pre-interview questionnaire submitted
  'video_complete', // all interview question videos recorded
  'under_review', // at least one manager score entered
  'advanced', // top candidates identified for offers
  'hold', // on hold pending other decisions
  'declined', // declined with reason captured
  'offer_sent', // offer email sent
  'hired', // accepted — begins onboarding journey
] as const

export const DECLINE_REASONS = [
  'salary',
  'role_fit',
  'other_opportunity',
  'experience',
  'assessment',
  'no_show',
  'other',
] as const

export const REFERRAL_SOURCES = [
  'linkedin',
  'instagram',
  'facebook',
  'indeed',
  'website',
  'internal_referral',
  'job_fair',
  'other',
] as const

// Default interview questions — one per competency, revealed to the candidate
// during the video interview. prep_seconds is think time before recording
// starts; answer_seconds is the max recording length.
export const DEFAULT_QUESTIONS: {
  competency: CompetencyKey
  text: string
  prepSeconds: number
  answerSeconds: number
}[] = [
  {
    competency: 'coachability',
    text: 'Tell us about a time you received tough feedback from a manager or coach. What was the feedback, and what did you change because of it?',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'drive',
    text: 'Describe the most competitive goal you have ever chased — in sales or anywhere else. How did you measure progress, and what was the result?',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'sales_presence',
    text: 'Sales simulation: You are standing in a brand-new Adams Homes model home. Give us your 60-second pitch to a young couple walking in for the first time.',
    prepSeconds: 45,
    answerSeconds: 90,
  },
  {
    competency: 'communication',
    text: 'Walk us through how you would explain the new-home buying process — from first visit to closing — to a nervous first-time buyer.',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'eq',
    text: 'A buyer calls you upset because their closing date slipped three weeks due to a construction delay. What exactly do you say and do?',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'professionalism',
    text: 'Describe the system you use to stay organized and follow up when you are juggling a dozen active prospects at once.',
    prepSeconds: 30,
    answerSeconds: 90,
  },
]

// The 3 pre-interview culture/sales questionnaire prompts (typed answers,
// completed at home during application).
export const PRE_INTERVIEW_QUESTIONS = [
  'Why do you want to sell new construction homes for Adams Homes?',
  'What does a winning week look like for you in a sales role?',
  'Tell us about a time you turned a "no" into a "yes".',
] as const

export function newToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// ---------------------------------------------------------------------------
// Schema provisioning
// ---------------------------------------------------------------------------

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vi_candidates (
      id          BIGSERIAL PRIMARY KEY,
      token       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT DEFAULT '',
      division    TEXT NOT NULL,
      referral_source TEXT DEFAULT 'other',
      status      TEXT NOT NULL DEFAULT 'applied',
      decline_reason TEXT,
      data        JSONB NOT NULL DEFAULT '{}'::jsonb,
      flags       JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS vi_candidates_email_idx ON vi_candidates (lower(email));

    CREATE TABLE IF NOT EXISTS vi_questions (
      id          BIGSERIAL PRIMARY KEY,
      ord         INT NOT NULL,
      competency  TEXT NOT NULL,
      text        TEXT NOT NULL,
      prep_seconds   INT NOT NULL DEFAULT 30,
      answer_seconds INT NOT NULL DEFAULT 90,
      active      BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS vi_responses (
      id           BIGSERIAL PRIMARY KEY,
      candidate_id BIGINT NOT NULL REFERENCES vi_candidates(id) ON DELETE CASCADE,
      question_id  BIGINT NOT NULL REFERENCES vi_questions(id) ON DELETE CASCADE,
      mime_type    TEXT NOT NULL DEFAULT 'video/webm',
      duration_sec INT NOT NULL DEFAULT 0,
      size_bytes   BIGINT NOT NULL DEFAULT 0,
      upload_state TEXT NOT NULL DEFAULT 'uploading',
      video        BYTEA,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (candidate_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS vi_scores (
      id           BIGSERIAL PRIMARY KEY,
      candidate_id BIGINT NOT NULL REFERENCES vi_candidates(id) ON DELETE CASCADE,
      manager      TEXT NOT NULL,
      competency   TEXT NOT NULL,
      score        INT NOT NULL CHECK (score BETWEEN 1 AND 5),
      evidence     TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (candidate_id, manager, competency)
    );

    CREATE TABLE IF NOT EXISTS vi_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS vi_messages (
      id           BIGSERIAL PRIMARY KEY,
      candidate_id BIGINT NOT NULL REFERENCES vi_candidates(id) ON DELETE CASCADE,
      sender       TEXT NOT NULL CHECK (sender IN ('candidate', 'admin', 'system')),
      body         TEXT NOT NULL,
      read_by_admin     BOOLEAN NOT NULL DEFAULT FALSE,
      read_by_candidate BOOLEAN NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS vi_messages_candidate_idx ON vi_messages (candidate_id, created_at);
  `)

  // Seed the default question set once.
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM vi_questions')
  if (rows[0].n === 0) {
    for (let i = 0; i < DEFAULT_QUESTIONS.length; i++) {
      const q = DEFAULT_QUESTIONS[i]
      await pool.query(
        `INSERT INTO vi_questions (ord, competency, text, prep_seconds, answer_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [i + 1, q.competency, q.text, q.prepSeconds, q.answerSeconds]
      )
    }
  }
}

export function ensureTables(): Promise<unknown> {
  if (!globalForPool.interviewTablesReady) {
    globalForPool.interviewTablesReady = createTables().catch((e) => {
      globalForPool.interviewTablesReady = undefined
      throw e
    })
  }
  return globalForPool.interviewTablesReady
}
