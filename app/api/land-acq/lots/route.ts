import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTable, isAdmin, addressKey, LOT_STATUSES } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'

type LotRow = {
  id: string
  address: string
  status: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

function toLot(row: LotRow) {
  return {
    ...row.data,
    id: Number(row.id),
    address: row.address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Admin only: list all lots (Kevin's + Elizabeth's shared pipeline view).
export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureTable()
    const id = request.nextUrl.searchParams.get('id')
    const result = id
      ? await pool.query('SELECT * FROM land_acq_lots WHERE id = $1', [id])
      : await pool.query('SELECT * FROM land_acq_lots ORDER BY created_at DESC')
    return NextResponse.json({ lots: result.rows.map(toLot) })
  } catch (e) {
    console.error('[land-acq] GET lots failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// Public: seller submissions from the landing page.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = String(body.address || '').trim()
    if (!address) {
      return NextResponse.json({ error: 'Property address is required' }, { status: 400 })
    }
    await ensureTable()
    // Public endpoint: sellers cannot set a pipeline stage.
    const { id: _id, status: _s, createdAt: _c, updatedAt: _u, ...data } = body
    const result = await pool.query(
      `INSERT INTO land_acq_lots (address, address_key, status, data)
       VALUES ($1, $2, 'pending', $3)
       ON CONFLICT (address_key) DO NOTHING
       RETURNING *`,
      [address, addressKey(address), JSON.stringify(data)]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 })
    }
    return NextResponse.json({ lot: toLot(result.rows[0]) }, { status: 201 })
  } catch (e) {
    console.error('[land-acq] POST lot failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// Admin only: update a lot (status changes, offer approval fields).
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const id = body.id
    const set = body.set
    if (!id || !set || typeof set !== 'object') {
      return NextResponse.json({ error: 'id and set are required' }, { status: 400 })
    }
    if (set.status !== undefined && !(LOT_STATUSES as readonly string[]).includes(String(set.status))) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    await ensureTable()
    const { status, ...dataFields } = set
    const result = await pool.query(
      `UPDATE land_acq_lots
       SET status = COALESCE($2, status),
           data = data || $3::jsonb,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, status ? String(status) : null, JSON.stringify(dataFields)]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 })
    }
    return NextResponse.json({ lot: toLot(result.rows[0]) })
  } catch (e) {
    console.error('[land-acq] PATCH lot failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
