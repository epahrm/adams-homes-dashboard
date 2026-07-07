import { NextResponse } from 'next/server'
import { pool, ensureTables, dbTarget } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'

// Diagnostic endpoint: reports whether the interview platform can reach its
// database and provision its tables, with a sanitized error when it cannot.
// Returns no data and no secrets — safe to expose.
export async function GET() {
  const report: Record<string, unknown> = {
    env_DATABASE_URL: !!process.env.DATABASE_URL,
    target: dbTarget(),
    node: process.version,
  }
  try {
    const t0 = Date.now()
    const r = await pool.query('SELECT 1 AS ok')
    report.connect = 'ok'
    report.connectMs = Date.now() - t0
    report.select1 = r.rows[0]?.ok === 1
  } catch (e) {
    const err = e as { message?: string; code?: string }
    report.connect = 'FAILED'
    report.error = { code: err.code, message: String(err.message || e).slice(0, 300) }
    return NextResponse.json(report, { status: 503 })
  }
  try {
    const t0 = Date.now()
    await ensureTables()
    report.tables = 'ok'
    report.ensureMs = Date.now() - t0
    const q = await pool.query('SELECT COUNT(*)::int AS n FROM vi_questions')
    report.questions = q.rows[0].n
  } catch (e) {
    const err = e as { message?: string; code?: string }
    report.tables = 'FAILED'
    report.error = { code: err.code, message: String(err.message || e).slice(0, 300) }
    return NextResponse.json(report, { status: 503 })
  }
  return NextResponse.json(report)
}
