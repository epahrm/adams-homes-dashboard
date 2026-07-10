import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Renders a QR code PNG for a given URL. Used to build postcard QR codes
// (navy on white, high error-correction so it scans even if a postcard is
// scuffed). Public — it only encodes whatever URL is passed in.

export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get('data')
  if (!data) {
    return NextResponse.json({ error: 'data (URL) is required' }, { status: 400 })
  }
  const size = Math.min(1200, Math.max(120, parseInt(request.nextUrl.searchParams.get('size') || '600', 10) || 600))
  try {
    const buf = await QRCode.toBuffer(data, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#003d66', light: '#ffffff' },
    })
    return new NextResponse(buf as unknown as BodyInit, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (e) {
    console.error('[land-acq] qr generate failed:', e)
    return NextResponse.json({ error: 'qr_failed' }, { status: 500 })
  }
}
