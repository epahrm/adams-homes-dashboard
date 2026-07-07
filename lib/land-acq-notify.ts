// Speed-to-lead alert (Follow Up Boss principle: reach a fresh lead in minutes).
// When a seller submits from the landing page, Kevin should hear about it right
// away. This helper sends that alert.
//
// It is a safe no-op until outbound email is configured: set LANDACQ_GMAIL_USER
// + LANDACQ_GMAIL_APP_PASSWORD (the same mailbox the alert-ingest uses) and
// KEVIN_NOTIFY_EMAIL (where the alert goes — Kevin's inbox, or an email-to-SMS
// gateway like 3215551234@vtext.com for a text). Until then it just returns
// { sent:false } so nothing breaks pre-launch.

export type Lead = { address?: string; owner?: string; phone?: string; email?: string; source?: string }

export async function sendLeadAlert(lead: Lead): Promise<{ sent: boolean; reason?: string }> {
  const user = process.env.LANDACQ_GMAIL_USER
  const pass = process.env.LANDACQ_GMAIL_APP_PASSWORD
  const to = process.env.KEVIN_NOTIFY_EMAIL
  if (!user || !pass || !to) return { sent: false, reason: 'not_configured' }
  try {
    const nodemailer = (await import('nodemailer')).default
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
    const line = [lead.owner, lead.address].filter(Boolean).join(' — ')
    const body =
      'New Land Acq Pro lead — reach out now while it is hot.\n\n' +
      (lead.owner ? 'Seller: ' + lead.owner + '\n' : '') +
      (lead.address ? 'Property: ' + lead.address + '\n' : '') +
      (lead.phone ? 'Phone: ' + lead.phone + '\n' : '') +
      (lead.email ? 'Email: ' + lead.email + '\n' : '') +
      (lead.source ? 'Source: ' + lead.source + '\n' : '') +
      '\nOpen the dashboard to make an offer.'
    await transport.sendMail({ from: user, to, subject: 'New lot lead: ' + (line || 'Palm Bay'), text: body })
    return { sent: true }
  } catch (e) {
    console.error('[land-acq] lead alert failed:', e)
    return { sent: false, reason: 'send_failed' }
  }
}
