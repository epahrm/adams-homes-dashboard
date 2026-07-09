import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { pool, ensureTable, isAdmin, addressKey } from '@/lib/land-acq-db'
import { parseListingEmail } from '@/lib/land-acq-email'
import { scoreBuyBox } from '@/lib/land-acq-buybox'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Reads saved-search alert emails from the dedicated Gmail (the sanctioned way
// to cover portals that prohibit scraping — we only read mail sent to us),
// parses each listing, scores it against the buy box, and files the matches as
// 'opportunity' lots for Kevin's dashboard. Triggered daily by Vercel Cron.

// Gmail shows app passwords grouped as "abcd efgh ijkl mnop"; pasted with those
// spaces, the IMAP LOGIN command is malformed ("Failed to parse your command").
// Strip whitespace so the credential works however it was entered.
const GMAIL_USER = (process.env.LANDACQ_GMAIL_USER || '').trim().replace(/^["']|["']$/g, '')
// App password is 16 lowercase letters shown as "abcd efgh ijkl mnop". Strip
// the display spaces and any stray surrounding quotes so the IMAP LOGIN parses.
const GMAIL_PASS = (process.env.LANDACQ_GMAIL_APP_PASSWORD || '').trim().replace(/^["']+|["']+$/g, '').replace(/\s+/g, '')
const CRON_SECRET = process.env.CRON_SECRET

function authorized(req: NextRequest): boolean {
  if (isAdmin(req.headers.get('x-admin-key'))) return true
  // Vercel crons and manual requests must use Bearer token (x-vercel-id is sent on all Vercel requests, not secure)
  const auth = req.headers.get('authorization') || ''
  return !!CRON_SECRET && auth === `Bearer ${CRON_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!GMAIL_USER || !GMAIL_PASS) {
    return NextResponse.json({
      configured: false,
      message:
        'Set LANDACQ_GMAIL_USER and LANDACQ_GMAIL_APP_PASSWORD in the environment to enable the email scan.',
    })
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    logger: false,
  })

  let scanned = 0
  let added = 0
  let rejected = 0
  let duplicates = 0
  const byLight: Record<string, number> = { green: 0, yellow: 0, red: 0 }

  try {
    await ensureTable()
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    try {
      // Only unread messages, so each alert is processed once.
      const uids = await client.search({ seen: false }, { uid: true })
      for (const uid of uids || []) {
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true })
        if (!msg || !msg.source) continue
        const mail = await simpleParser(msg.source as Buffer)
        const from = mail.from?.text || ''
        const listings = parseListingEmail({
          from,
          subject: mail.subject || '',
          html: typeof mail.html === 'string' ? mail.html : '',
          text: mail.text || '',
        })
        for (const li of listings) {
          scanned++
          const triage = scoreBuyBox({ address: li.address, acres: li.acres ?? undefined, listPrice: li.listPrice ?? undefined })
          byLight[triage.light]++
          if (triage.light === 'red') { rejected++; continue }
          const data = {
            source: 'Portal Alert · ' + li.source,
            listPrice: li.listPrice,
            acres: li.acres,
            url: li.url,
            listStatus: 'Active Listing',
            mls: li.mls,
            daysOnMarket: li.daysOnMarket,
            agentBrokerage: li.brokerage,
            agentName: li.agentName,
            agentPhone: li.agentPhone,
            agentEmail: li.agentEmail,
            agentLicense: li.agentLicense,
            offerSuggested: triage.offer,
            scanLight: triage.light,
            scanReasons: triage.reasons,
            addedBy: 'email-scan',
            sourceEmail: from,
          }
          // Merge with existing lot data if it already exists (e.g., from Redfin sweep)
          // Priority: Zillow agent info overwrites empty agent fields, but preserves existing values
          const mergeData = JSON.stringify(data)
          const res = await pool.query(
            `INSERT INTO land_acq_lots (address, address_key, status, data)
             VALUES ($1, $2, 'opportunity', $3)
             ON CONFLICT (address_key) DO UPDATE SET
               data = data || $3::jsonb,
               status = CASE WHEN status = 'opportunity' THEN 'opportunity' ELSE status END
             RETURNING id`,
            [li.address, addressKey(li.address), mergeData]
          )
          if (res.rows.length) added++
          else duplicates++
        }
        // Mark handled so we don't re-scan it next run.
        await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true })
      }
    } finally {
      lock.release()
    }
    await client.logout()
  } catch (e) {
    console.error('[land-acq] email ingest failed:', e)
    try { await client.logout() } catch { /* already closed */ }
    // Surface enough of the IMAP failure to tell auth problems (wrong app
    // password) apart from connection/IMAP-disabled problems, without leaking
    // the credentials themselves.
    const err = e as { authenticationFailed?: boolean; responseText?: string; response?: string; code?: string; message?: string }
    const reason = err?.authenticationFailed
      ? 'gmail_login_rejected'
      : /IMAP.*disabled|not enabled/i.test(err?.responseText || err?.response || '')
      ? 'imap_disabled'
      : (err?.code || 'imap_error')
    return NextResponse.json({
      error: 'ingest_failed',
      reason,
      hint: err?.authenticationFailed
        ? 'Gmail rejected the login — re-check LANDACQ_GMAIL_USER and the app password (no spaces, current one).'
        : 'Could not complete the IMAP session — check that IMAP is enabled on the Gmail account.',
      // Safe shape check (no secrets): a Gmail app password is exactly 16
      // characters and the user should be an email. Anything else means the
      // stored value is wrong.
      creds: { userIsEmail: /@gmail\.com$/i.test(GMAIL_USER), passLen: GMAIL_PASS.length, passExpected: 16 },
      detail: err?.responseText || err?.response || err?.message || String(e),
    }, { status: 502 })
  }

  return NextResponse.json({ configured: true, scanned, added, duplicates, rejected, byLight })
}
