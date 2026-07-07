import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Video answers are uploaded in sequential binary chunks (Vercel serverless
// caps request bodies at ~4.5MB, so the recorder splits blobs into ~3MB
// parts) and stored as bytea in Postgres. Small scale by design: one hiring
// class is ~20 candidates x 6 answers at ~5-8MB each.

const MAX_CHUNK = 4 * 1024 * 1024 // per-request cap
const MAX_VIDEO = 40 * 1024 * 1024 // per-answer cap

async function candidateByToken(token: string | null) {
  if (!token) return null
  const r = await pool.query('SELECT * FROM vi_candidates WHERE token = $1', [token])
  return r.rows[0] || null
}

// Candidate: upload one chunk of a video answer.
// Query params: token, questionId, part (0-based), last (1 on final chunk),
// mime, duration (seconds, sent with the final chunk).
export async function POST(request: NextRequest) {
  try {
    await ensureTables()
    const p = request.nextUrl.searchParams
    const cand = await candidateByToken(p.get('token'))
    if (!cand) return NextResponse.json({ error: 'Invalid interview link' }, { status: 401 })

    const questionId = Number(p.get('questionId'))
    const part = Number(p.get('part') || 0)
    const last = p.get('last') === '1'
    const mime = String(p.get('mime') || 'video/webm').slice(0, 100)
    const duration = Math.max(0, Math.min(600, Number(p.get('duration')) || 0))
    if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 })

    const q = await pool.query('SELECT id FROM vi_questions WHERE id = $1 AND active = TRUE', [questionId])
    if (q.rows.length === 0) return NextResponse.json({ error: 'Unknown question' }, { status: 404 })

    const buf = Buffer.from(await request.arrayBuffer())
    if (buf.length === 0) return NextResponse.json({ error: 'Empty chunk' }, { status: 400 })
    if (buf.length > MAX_CHUNK) return NextResponse.json({ error: 'Chunk too large' }, { status: 413 })

    if (part === 0) {
      // First chunk replaces any prior attempt (re-record).
      await pool.query(
        `INSERT INTO vi_responses (candidate_id, question_id, mime_type, duration_sec, size_bytes, upload_state, video)
         VALUES ($1, $2, $3, $4, $5, 'uploading', $6)
         ON CONFLICT (candidate_id, question_id) DO UPDATE SET
           mime_type = EXCLUDED.mime_type,
           duration_sec = EXCLUDED.duration_sec,
           size_bytes = EXCLUDED.size_bytes,
           upload_state = 'uploading',
           video = EXCLUDED.video,
           updated_at = now()`,
        [cand.id, questionId, mime, duration, buf.length, buf]
      )
    } else {
      const cur = await pool.query(
        `SELECT size_bytes FROM vi_responses WHERE candidate_id = $1 AND question_id = $2 AND upload_state = 'uploading'`,
        [cand.id, questionId]
      )
      if (cur.rows.length === 0) {
        return NextResponse.json({ error: 'Upload not started' }, { status: 409 })
      }
      if (Number(cur.rows[0].size_bytes) + buf.length > MAX_VIDEO) {
        return NextResponse.json({ error: 'Video too large' }, { status: 413 })
      }
      await pool.query(
        `UPDATE vi_responses
         SET video = video || $3, size_bytes = size_bytes + $4, updated_at = now()
         WHERE candidate_id = $1 AND question_id = $2`,
        [cand.id, questionId, buf, buf.length]
      )
    }

    if (last) {
      await pool.query(
        `UPDATE vi_responses SET upload_state = 'complete', duration_sec = GREATEST(duration_sec, $3), updated_at = now()
         WHERE candidate_id = $1 AND question_id = $2`,
        [cand.id, questionId, duration]
      )
      // When every active question has a complete answer, advance the
      // candidate so the admin pipeline updates in real time.
      const done = await pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM vi_questions WHERE active = TRUE) AS total,
           (SELECT COUNT(*)::int FROM vi_responses r
             JOIN vi_questions q ON q.id = r.question_id AND q.active = TRUE
             WHERE r.candidate_id = $1 AND r.upload_state = 'complete') AS answered`,
        [cand.id]
      )
      const { total, answered } = done.rows[0]
      if (answered >= total && cand.status === 'applied') {
        await pool.query(
          `UPDATE vi_candidates SET status = 'video_complete', updated_at = now() WHERE id = $1`,
          [cand.id]
        )
      }
      return NextResponse.json({ ok: true, complete: true, answered, total })
    }
    return NextResponse.json({ ok: true, complete: false })
  } catch (e) {
    console.error('[interview] POST response failed:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 503 })
  }
}

// Video playback. <video> tags cannot send headers, so auth rides in query
// params: ?key=<admin key> (admin review) or ?token=<candidate token>
// (candidate reviewing their own answer).
export async function GET(request: NextRequest) {
  try {
    await ensureTables()
    const p = request.nextUrl.searchParams
    const admin = isAdmin(p.get('key') || request.headers.get('x-admin-key'))
    const candidateId = Number(p.get('candidateId'))
    const questionId = Number(p.get('questionId'))

    if (!admin) {
      const cand = await candidateByToken(p.get('token'))
      if (!cand || Number(cand.id) !== candidateId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Metadata listing for the admin review modal.
    if (!questionId) {
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const r = await pool.query(
        `SELECT id, question_id, mime_type, duration_sec, size_bytes, upload_state, updated_at
         FROM vi_responses WHERE candidate_id = $1 ORDER BY question_id`,
        [candidateId]
      )
      return NextResponse.json({
        responses: r.rows.map((row) => ({
          id: Number(row.id),
          questionId: Number(row.question_id),
          mimeType: row.mime_type,
          durationSec: row.duration_sec,
          sizeBytes: Number(row.size_bytes),
          uploadState: row.upload_state,
          updatedAt: row.updated_at,
        })),
      })
    }

    const r = await pool.query(
      `SELECT video, mime_type FROM vi_responses
       WHERE candidate_id = $1 AND question_id = $2 AND upload_state = 'complete'`,
      [candidateId, questionId]
    )
    if (r.rows.length === 0 || !r.rows[0].video) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const video: Buffer = r.rows[0].video
    return new NextResponse(new Uint8Array(video), {
      status: 200,
      headers: {
        'Content-Type': r.rows[0].mime_type || 'video/webm',
        'Content-Length': String(video.length),
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e) {
    console.error('[interview] GET response failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
