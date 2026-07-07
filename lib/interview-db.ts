import { Pool } from 'pg'
import crypto from 'crypto'

// Data layer for the Virtual Sales Agent Video Interview platform
// (public/sales-interview). Follows the Land Acq Pro pattern: same Supabase
// Postgres instance, dedicated plain-SQL tables so the onboarding-dashboard
// Prisma schema stays untouched. Tables self-provision on first use.
//
// Framework source: the July 2026 handoff package (Round 1 Interview Guide +
// final public landing page prototype) — 4 competencies scored 1-5, the
// 20-question application, and Monday live group interview sessions.

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

const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)

export const pool =
  globalForPool.interviewPool ||
  new Pool({
    connectionString: databaseUrl,
    max: 3,
    connectionTimeoutMillis: 8000,
    ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  })
globalForPool.interviewPool = pool

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------

// ECF offices from the final landing page prototype (07/07/2026).
export const DIVISIONS = [
  {
    code: 'JAX',
    name: 'Jacksonville',
    color: '#d9534f',
    counties: 'Baker, St. Johns, Clay, Putnam, Flagler',
    address: '11570 San Jose Blvd. Suite 15, Jacksonville FL 32223',
    img: 'jax.jpg',
  },
  {
    code: 'ORL',
    name: 'Orlando',
    color: '#1a7a44',
    counties: 'Seminole, Orange',
    address: '4401 Vineland Rd. Suite A-11, Orlando FL 32811',
    img: 'orl.jpg',
  },
  {
    code: 'DAY',
    name: 'Daytona Beach',
    color: '#1a5ba5',
    counties: 'Brevard, Indian River',
    address: '1440 N. Nova Rd., Suite 303, Daytona Beach FL 32117',
    img: 'day.jpg',
  },
  {
    code: 'MEL',
    name: 'Melbourne',
    color: '#7a4fb5',
    counties: 'Brevard',
    address: '3840 West Eau Gallie Blvd. Suite 106, Melbourne FL 32934',
    img: 'mel.jpg',
  },
  {
    code: 'PSL',
    name: 'Port St. Lucie',
    color: '#e8963c',
    counties: 'St. Lucie, Okeechobee',
    address: '751 SE Port St Lucie Blvd., Port St. Lucie FL 34984',
    divisional: true,
    img: 'psl.jpg',
  },
] as const

// Round 1 competency framework (from HANDOFF Round 1 Interview Guide):
// 4 competencies, 1-5 scale, straight average. 3.0+ advances.
export const COMPETENCIES = [
  {
    key: 'communication',
    label: 'Communication Clarity',
    weight: 25,
    definition: 'Articulates thoughts clearly; appropriate pace and tone; listener understands easily',
  },
  {
    key: 'customer_centric',
    label: 'Customer-Centric Attitude',
    weight: 25,
    definition: 'Shows genuine care about customer success; puts customer needs first',
  },
  {
    key: 'coachability',
    label: 'Coachability & Growth Mindset',
    weight: 25,
    definition: 'Open to feedback; willing to learn; not defensive; sees challenges as growth opportunities',
  },
  {
    key: 'resilience',
    label: 'Resilience & Attitude',
    weight: 25,
    definition: 'Bounces back from rejection; maintains positive energy; does not give up',
  },
] as const

export type CompetencyKey = (typeof COMPETENCIES)[number]['key']

// 1-5 score anchors (Round 1 guide).
export const SCORE_ANCHORS = [
  { score: 1, label: 'Disqualifying', hint: 'Major gaps, negative attitude — eliminate' },
  { score: 2, label: 'Developing', hint: 'Below expectations, significant ramp time' },
  { score: 3, label: 'Meets Expectation', hint: 'Baseline good hire — advance' },
  { score: 4, label: 'Exceeds Expectation', hint: 'Clear strength, above average' },
  { score: 5, label: 'Exceptional', hint: 'Rare — flag for fast-track' },
] as const

// Round 1 advancement criteria.
export const ADVANCEMENT = {
  minAverage: 3.0,
  minOnThree: 3, // 3+ on at least 3 of 4 competencies
  disqualifyingScore: 1,
  grayZoneLow: 2.8,
}

export const CANDIDATE_STATUSES = [
  'applied', // application + 20-question form submitted
  'video_complete', // async video pre-screen recorded
  'scheduled', // assigned to a Monday live interview session
  'under_review', // scored (video or live), decision pending
  'advanced', // moving to next round
  'hold', // internal hold — candidate not notified
  'pooled', // future candidate pool — candidate notified
  'declined', // eliminated with reason captured
  'offer_sent', // offer extended
  'hired', // accepted — begins onboarding
] as const

export const DECLINE_REASONS = [
  'better_fit_found',
  'not_ready',
  'relocation_unwilling',
  'salary',
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

// Managers (from the platform spec; Elizabeth is regional/superadmin).
// Photos live at public/sales-interview/img/managers/<img>; the UI shows
// initials until a photo file exists.
export const MANAGERS = [
  { name: 'Elizabeth Porter', title: 'Regional Manager', img: 'elizabeth-porter.jpg' },
  { name: 'Kristi Worley', title: 'Orlando', img: 'kristi-worley.jpg' },
  { name: 'Eric Landrum', title: 'Jacksonville', img: 'eric-landrum.jpg' },
  { name: 'Liza Carrasquillo', title: 'Daytona Beach', img: 'liza-carrasquillo.jpg' },
  { name: 'Scott Harris', title: 'Melbourne', img: 'scott-harris.jpg' },
  { name: 'Bob Frein', title: 'Port St. Lucie', img: 'bob-frein.jpg' },
] as const

// The finalized 20 application questions (from the 07/07/2026 landing page
// prototype). Q5 is a select; everything else free text.
export const APP_QUESTIONS: { text: string; type: 'text' | 'select'; options?: string[] }[] = [
  { text: 'Describe your new-home sales experience', type: 'text' },
  { text: 'Describe the sales process as you know it', type: 'text' },
  { text: 'Are you interviewing with other builders?', type: 'text' },
  { text: 'Will you have reliable transportation?', type: 'text' },
  {
    text: 'When are you available to start?',
    type: 'select',
    options: ['Immediate', 'Within 1 month', 'Need to relocate', 'Other'],
  },
  { text: 'What resources do you actively use to continuously develop your sales and professional skills?', type: 'text' },
  { text: 'What does winning mean to you in sales?', type: 'text' },
  { text: 'What is your annual income goal?', type: 'text' },
  { text: 'How do you ensure you achieve your goals?', type: 'text' },
  { text: 'What were your sales targets last year?', type: 'text' },
  { text: 'Describe your ideal work environment', type: 'text' },
  { text: 'How do you respond to coaching and feedback aimed at helping you improve and maximize your potential?', type: 'text' },
  { text: 'What qualities in top salespeople do you admire?', type: 'text' },
  { text: 'What attracts you to Adams Homes?', type: 'text' },
  { text: 'How would your past customers describe their experience working with you?', type: 'text' },
  { text: 'How do you see your role contributing to the success of our communities?', type: 'text' },
  { text: 'How do you respond to difficult clients or objections?', type: 'text' },
  { text: 'Describe a recent win and what made it successful', type: 'text' },
  { text: 'What questions do YOU have for us?', type: 'text' },
  { text: 'Additional thoughts or anything else we should know?', type: 'text' },
]

// The 5 standardized Round 1 interview questions (used both in the async
// video pre-screen and read aloud in live sessions), each tagged with the
// primary competency it evidences.
export const DEFAULT_QUESTIONS: {
  competency: CompetencyKey
  text: string
  listenFor: string
  prepSeconds: number
  answerSeconds: number
}[] = [
  {
    competency: 'communication',
    text: 'Tell us about your biggest sales win. What made it successful?',
    listenFor: 'Process, customer focus, results, confidence',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'resilience',
    text: "How do you handle rejection in sales? Give us an example of a time you heard 'no' and what you did next.",
    listenFor: 'Bounce-back ability, attitude, learning mindset',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'customer_centric',
    text: 'What do you know about Adams Homes and our model home communities? Why are we different?',
    listenFor: 'Research effort, genuine interest, customer-centric thinking',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'coachability',
    text: "How do you approach learning new product information quickly? Tell us how you'd learn about our floor plans and pricing.",
    listenFor: 'Structured approach, willingness to learn, resourcefulness',
    prepSeconds: 30,
    answerSeconds: 90,
  },
  {
    competency: 'resilience',
    text: 'Tell us about a time you stayed motivated after a difficult week or lost deal. How did you bounce back?',
    listenFor: 'Resilience, positive attitude, accountability',
    prepSeconds: 30,
    answerSeconds: 90,
  },
]

// Live session breakouts: 3 rooms x 5 minutes each (15 minutes total),
// 2 candidates per room.
export const SESSION_SLOTS = [
  { slot: 1, label: 'Breakout 1', time: '9:00 – 9:05 AM', minutes: 5 },
  { slot: 2, label: 'Breakout 2', time: '9:05 – 9:10 AM', minutes: 5 },
  { slot: 3, label: 'Breakout 3', time: '9:10 – 9:15 AM', minutes: 5 },
] as const

export function newToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// Short-lived signed tokens for <video> playback URLs, so the admin key
// never appears in query strings (which land in access logs / history).
export function mintMediaToken(ttlSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = crypto.createHmac('sha256', ADMIN_KEY).update(String(exp)).digest('hex').slice(0, 32)
  return `${exp}.${sig}`
}

export function verifyMediaToken(token: string | null | undefined): boolean {
  if (!token) return false
  const [expStr, sig] = String(token).split('.')
  const exp = Number(expStr)
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false
  const expect = crypto.createHmac('sha256', ADMIN_KEY).update(String(exp)).digest('hex').slice(0, 32)
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))
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
      listen_for  TEXT NOT NULL DEFAULT '',
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
      parts_received INT NOT NULL DEFAULT 0,
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

    -- Live group interview day (Monday sessions, Round 1 guide)
    CREATE TABLE IF NOT EXISTS vi_sessions (
      id           BIGSERIAL PRIMARY KEY,
      session_date DATE NOT NULL,
      teams_url    TEXT NOT NULL DEFAULT '',
      status       TEXT NOT NULL DEFAULT 'scheduled',
      started_at   TIMESTAMPTZ,
      notes        TEXT NOT NULL DEFAULT '',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS vi_session_assignments (
      id           BIGSERIAL PRIMARY KEY,
      session_id   BIGINT NOT NULL REFERENCES vi_sessions(id) ON DELETE CASCADE,
      slot         INT NOT NULL CHECK (slot IN (1, 2, 3)),
      candidate_id BIGINT NOT NULL REFERENCES vi_candidates(id) ON DELETE CASCADE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (session_id, candidate_id)
    );

    CREATE TABLE IF NOT EXISTS vi_live_scores (
      id           BIGSERIAL PRIMARY KEY,
      session_id   BIGINT NOT NULL REFERENCES vi_sessions(id) ON DELETE CASCADE,
      candidate_id BIGINT NOT NULL REFERENCES vi_candidates(id) ON DELETE CASCADE,
      manager      TEXT NOT NULL,
      competency   TEXT NOT NULL,
      score        INT NOT NULL CHECK (score BETWEEN 1 AND 5),
      note         TEXT NOT NULL DEFAULT '',
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (session_id, candidate_id, manager, competency)
    );
  `)

  // Older deployments may miss newer columns.
  await pool.query(`ALTER TABLE vi_questions ADD COLUMN IF NOT EXISTS listen_for TEXT NOT NULL DEFAULT ''`)
  await pool.query(`ALTER TABLE vi_responses ADD COLUMN IF NOT EXISTS parts_received INT NOT NULL DEFAULT 0`)
  // One live interview day per date (dedupe any pre-index duplicates first,
  // keeping the oldest, so index creation cannot fail).
  await pool.query(
    `DELETE FROM vi_sessions a USING vi_sessions b
     WHERE a.session_date = b.session_date AND a.id > b.id`
  )
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS vi_sessions_date_idx ON vi_sessions (session_date)`)

  // Seed / migrate the standardized question set inside an advisory lock so
  // concurrent serverless cold starts cannot double-seed. If an earlier
  // deploy seeded the pre-handoff 6-question set and no answers were
  // recorded yet, replace it with the finalized Round 1 questions.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(914301)')
    const currentKeys = COMPETENCIES.map((c) => c.key)
    const { rows } = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM vi_questions) AS questions,
         (SELECT COUNT(*)::int FROM vi_questions WHERE competency = ANY($1)) AS current_framework,
         (SELECT COUNT(*)::int FROM vi_responses) AS responses`,
      [currentKeys]
    )
    const { questions, current_framework, responses } = rows[0]
    if (questions > 0 && current_framework === 0 && responses === 0) {
      await client.query('DELETE FROM vi_questions')
    }
    const after = await client.query('SELECT COUNT(*)::int AS n FROM vi_questions')
    if (after.rows[0].n === 0) {
      for (let i = 0; i < DEFAULT_QUESTIONS.length; i++) {
        const q = DEFAULT_QUESTIONS[i]
        await client.query(
          `INSERT INTO vi_questions (ord, competency, text, listen_for, prep_seconds, answer_seconds)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [i + 1, q.competency, q.text, q.listenFor, q.prepSeconds, q.answerSeconds]
        )
      }
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
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
