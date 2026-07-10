import { NextRequest, NextResponse } from 'next/server'
import { sendLeadAlert, type Lead } from '@/lib/land-acq-notify'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/land-acq/notify  { address, owner, phone, email, source }
// Sends the speed-to-lead alert to Kevin (no-op until outbound email is set).
export async function POST(request: NextRequest) {
  let lead: Lead
  try {
    lead = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const result = await sendLeadAlert(lead)
  return NextResponse.json({ ok: true, ...result })
}
