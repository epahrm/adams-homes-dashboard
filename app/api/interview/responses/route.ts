import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin, mintMediaToken, verifyMediaToken } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Video answers are uploaded in sequential binary chunks (Vercel serverless
// caps request bodies at ~4.5MB, so the recorder splits blobs into ~3MB
// parts) and stored as bytea in Postgres. Small scale by design: one hiring
// class is ~20 candidates x 5 answers at ~5-8MB each.
//
// Upload integrity: parts_received tracks how many chunks are appended.
// A part index below parts_received is a client retry of a chunk that
// already committed — acknowledged idempotently, never appended twice.
// Append + completion happen in a single statement, so a failure response
// always means nothing was committed and the client can retry safely.

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
      // A completed answer is final — the interview page never re-records an
      // answered question, so part 0 against a complete row is either a
      // client retry whose success response was lost (ack idempotently,
      // never append) or a stale tab (no data harm either way).
      const existing = await pool.query(
        `SELECT upload_state FROM vi_responses WHERE candidate_id = $1 AND question_id = $2`,
        [cand.id, questionId]
      )
      if (existing.rows[0]?.upload_state === 'complete') {
        return NextResponse.json({ ok: true, complete: true, duplicate: true })
      }
      await pool.query(
        `INSERT INTO vi_responses (candidate_id, question_id, mime_type, duration_sec, size_bytes, upload_state, parts_received, video)
         VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
         ON CONFLICT (candidate_id, question_id) DO UPDATE SET
           mime_type = EXCLUDED.mime_type,
           duration_sec = EXCLUDED.duration_sec,
           size_bytes = EXCLUDED.size_bytes,
           upload_state = EXCLUDED.upload_state,
           parts_received = 1,
           video = EXCLUDED.video,
           updated_at = now()`,
        [cand.id, questionId, mime, duration, buf.length, last ? 'complete' : 'uploading', buf]
      )
    } else {
      const cur = await pool.query(
        `SELECT size_bytes, parts_received, upload_state FROM vi_responses
         WHERE candidate_id = $1 AND question_id = $2`,
        [cand.id, questionId]
      )
      if (cur.rows.length === 0) {
        return NextResponse.json({ error: 'Upload not started' }, { status: 409 })
      }
      const received = Number(cur.rows[0].parts_received)
      const state = cur.rows[0].upload_state
      if (part < received) {
        // Retry of a chunk that already committed — acknowledge, don't append.
        return NextResponse.json({ ok: true, complete: state === 'complete', duplicate: true })
      }
      if (state !== 'uploading') {
        return NextResponse.json({ error: 'This question is already answered' }, { status: 409 })
      }
      if (part > received) {
        return NextResponse.json({ error: 'Chunk out of order' }, { status: 409 })
      }
      if (Number(cur.rows[0].size_bytes) + buf.length > MAX_VIDEO) {
        return NextResponse.json({ error: 'Video too large' }, { status: 413 })
      }
      // Single statement: append + advance part counter + (on last chunk)
      // completion, so an error response always means nothing committed and
      // the client retry cannot double-append.
      const updated = await pool.query(
        `UPDATE vi_responses
         SET video = video || $3,
             size_bytes = size_bytes + $4,
             parts_received = parts_received + 1,
             upload_state = CASE WHEN $5 THEN 'complete' ELSE upload_state END,
             duration_sec = CASE WHEN $5 THEN GREATEST(duration_sec, $6) ELSE duration_sec END,
             updated_at = now()
         WHERE candidate_id = $1 AND question_id = $2
           AND parts_received = $7 AND upload_state = 'uploading'
         RETURNING id`,
        [cand.id, questionId, buf, buf.length, last, duration, part]
      )
      if (updated.rows.length === 0) {
        return NextResponse.json({ error: 'Chunk out of order' }, { status: 409 })
      }
    }

    if (last) {
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

// Video playback. <video> tags cannot send headers, so playback URLs carry a
// short-lived signed media token (?mt=, minted for admins via op=token) or
// the candidate's own token. Supports single-range requests so seeking and
// Safari playback work.
export async function GET(request: NextRequest) {
  try {
    await ensureTables()
    const p = request.nextUrl.searchParams
    const admin = isAdmin(request.headers.get('x-admin-key'))
    const media = verifyMediaToken(p.get('mt')) || isAdmin(p.get('key'))
    const candidateId = Number(p.get('candidateId'))
    const questionId = Number(p.get('questionId'))

    // Admin mints a short-lived token for <video> src URLs.
    if (p.get('op') === 'token') {
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.json({ mediaToken: mintMediaToken() })
    }

    if (!admin && !media) {
      const cand = await candidateByToken(p.get('token'))
      if (!cand || Number(cand.id) !== candidateId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    if (!candidateId || Number.isNaN(candidateId)) {
      return NextResponse.json({ error: 'candidateId required' }, { status: 400 })
    }

    // Metadata listing for the admin review modal.
    if (!questionId) {
      if (!admin && !media) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const mimeType = r.rows[0].mime_type || 'video/webm'
    const range = request.headers.get('range')
    const common = {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=300',
    }
    const rangeMatch = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim())
    if (rangeMatch && (rangeMatch[1] || rangeMatch[2])) {
      let start = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : NaN
      let end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : video.length - 1
      if (Number.isNaN(start)) {
        // suffix range: last N bytes
        start = Math.max(0, video.length - parseInt(rangeMatch[2], 10))
        end = video.length - 1
      }
      end = Math.min(end, video.length - 1)
      if (start > end || start >= video.length) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${video.length}` },
        })
      }
      const slice = video.subarray(start, end + 1)
      return new NextResponse(new Uint8Array(slice), {
        status: 206,
        headers: {
          ...common,
          'Content-Range': `bytes ${start}-${end}/${video.length}`,
          'Content-Length': String(slice.length),
        },
      })
    }
    return new NextResponse(new Uint8Array(video), {
      status: 200,
      headers: { ...common, 'Content-Length': String(video.length) },
    })
  } catch (e) {
    console.error('[interview] GET response failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
