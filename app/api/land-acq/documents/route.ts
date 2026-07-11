import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureDocumentsTable, isAdmin } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Real file storage for lot documents — signed contracts, surveys, closing
// disclosures, title docs. Bytes live in Postgres (land_acq_documents.data),
// same pattern as candidate photos/interview video elsewhere in this app.
//
//   GET  ?lotId=X            -> list this lot's documents (metadata only)
//   GET  ?id=X&download=1    -> stream one document's actual file bytes
//   POST multipart{lotId,file[,uploadedBy]} -> store a new document
//   DELETE ?id=X              -> remove a document

type DocRow = {
  id: string
  filename: string
  mime_type: string
  size_bytes: string
  uploaded_by: string | null
  created_at: string
}

function toDoc(row: DocRow) {
  return {
    id: Number(row.id),
    name: row.filename,
    mimeType: row.mime_type,
    size: Number(row.size_bytes),
    by: row.uploaded_by || '',
    at: row.created_at,
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const q = request.nextUrl.searchParams
  const id = q.get('id')
  const download = q.get('download') === '1'

  try {
    await ensureDocumentsTable()

    if (id && download) {
      const r = await pool.query(
        'SELECT filename, mime_type, data FROM land_acq_documents WHERE id = $1',
        [id]
      )
      if (!r.rows.length) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      const doc = r.rows[0]
      return new NextResponse(doc.data, {
        headers: {
          'Content-Type': doc.mime_type || 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="' + doc.filename.replace(/"/g, "'") + '"',
        },
      })
    }

    const lotId = q.get('lotId')
    if (!lotId) return NextResponse.json({ error: 'lotId required' }, { status: 400 })
    const r = await pool.query(
      `SELECT id, filename, mime_type, size_bytes, uploaded_by, created_at
       FROM land_acq_documents WHERE lot_id = $1 ORDER BY created_at DESC`,
      [lotId]
    )
    return NextResponse.json({ documents: r.rows.map(toDoc) })
  } catch (e) {
    console.error('[land-acq] GET documents failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const form = await request.formData()
    const lotId = form.get('lotId')
    const file = form.get('file')
    const uploadedBy = String(form.get('uploadedBy') || '')
    if (!lotId || !(file instanceof File)) {
      return NextResponse.json({ error: 'lotId and file are required' }, { status: 400 })
    }
    // Vercel serverless request bodies are capped (~4.5MB on most plans) — fail
    // with a clear message rather than a generic 500 for anything larger.
    if (file.size > 4_400_000) {
      return NextResponse.json({ error: 'File too large — 4MB max for now.' }, { status: 413 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())

    await ensureDocumentsTable()
    const r = await pool.query(
      `INSERT INTO land_acq_documents (lot_id, filename, mime_type, size_bytes, data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, filename, mime_type, size_bytes, uploaded_by, created_at`,
      [lotId, file.name, file.type || 'application/octet-stream', bytes.length, bytes, uploadedBy]
    )
    return NextResponse.json({ document: toDoc(r.rows[0]) }, { status: 201 })
  } catch (e) {
    console.error('[land-acq] POST document failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await ensureDocumentsTable()
    const r = await pool.query('DELETE FROM land_acq_documents WHERE id = $1 RETURNING id', [id])
    if (!r.rows.length) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[land-acq] DELETE document failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
