import { NextRequest, NextResponse } from 'next/server'

// palmbaylandoffer.com is the seller-facing domain (the QR target). Everything
// on that host maps into the Land Acq Pro seller page directory, so the bare
// domain opens the seller page and its relative assets resolve. The admin
// surface is kept off this public domain. All other hosts are untouched.
export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase()
  if (!/(?:^|\.)palmbaylandoffer\.com$/.test(host)) return NextResponse.next()

  const url = req.nextUrl.clone()
  const p = url.pathname

  // Never expose the admin/offer pages on the public seller domain.
  if (/\/(?:admin|offer-approval)\.html$/i.test(p)) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  // API routes, Next internals, and the real seller-page files pass through.
  if (p.startsWith('/api') || p.startsWith('/_next') || p.startsWith('/land-acq-pro')) {
    return NextResponse.next()
  }
  // Bare domain (and /sell) -> seller page; other paths -> its asset directory.
  url.pathname = '/land-acq-pro' + (p === '/' || p === '/sell' ? '/index.html' : p)
  return NextResponse.rewrite(url)
}

export const config = {
  // Include '/' explicitly — the negative-lookahead matcher alone does not run
  // middleware on the bare root path.
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
