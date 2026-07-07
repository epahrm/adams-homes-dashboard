import sgMail from '@sendgrid/mail'

// Candidate notification emails for the Virtual Sales Agent Video Interview
// platform. Same SendGrid setup as lib/email.ts; every send degrades to a
// console warning when SENDGRID_API_KEY is not configured so the pipeline
// keeps working (the admin UI also offers a mailto: fallback).

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@adamshomes.com'

const WRAP = (inner: string) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
    <div style="background:#1a5ba5;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0;">
      <h2 style="margin:0;font-size:20px;">Adams Homes &mdash; Sales Team Hiring</h2>
    </div>
    <div style="border:1px solid #dde3ea;border-top:0;border-radius:0 0 10px 10px;padding:22px;line-height:1.6;">
      ${inner}
      <p style="color:#667;font-size:13px;margin-top:26px;">Adams Homes &mdash; Value, Simplified&trade;<br>Adams Homes is an equal opportunity employer.</p>
    </div>
  </div>`

export type NotifyKind = 'advanced' | 'declined' | 'offer_sent' | 'invited'

export function defaultNotification(
  kind: NotifyKind,
  candidateName: string,
  division: string,
  interviewUrl?: string
): { subject: string; html: string; text: string } {
  const first = candidateName.split(' ')[0]
  switch (kind) {
    case 'invited':
      return {
        subject: 'Your Adams Homes video interview link',
        text: `Hi ${first}, your application to the Adams Homes ${division} sales team was received. Complete your video interview here: ${interviewUrl}`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p>Thanks for applying to the <b>${division}</b> sales team. Your next step is a short video interview &mdash; six questions, about 15 minutes, recorded whenever suits you.</p>
          <p style="margin:20px 0;"><a href="${interviewUrl}" style="background:#c0432f;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:700;">Start My Video Interview</a></p>
          <p>Tip: find a quiet spot, and dress like you're meeting a buyer.</p>`),
      }
    case 'advanced':
      return {
        subject: 'Great news — you\'re moving to the next round at Adams Homes',
        text: `Hi ${first}, great news: you've advanced to the next round of our sales team hiring process for ${division}. We'll follow up shortly with details.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p><b>Great news</b> &mdash; our sales managers reviewed your video interview and you've <b>advanced to the next round</b> for the ${division} team.</p>
          <p>We'll follow up shortly with scheduling details for the live interview. If you have any questions in the meantime, just reply through your interview page chat.</p>`),
      }
    case 'offer_sent':
      return {
        subject: 'Your offer from Adams Homes',
        text: `Hi ${first}, congratulations! We'd like to offer you a position on the Adams Homes ${division} sales team. Full details to follow.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p><b>Congratulations!</b> We'd like to offer you a position on the <b>${division}</b> sales team.</p>
          <p>Your official offer letter with full details follows separately. Welcome to the start of your onboarding journey &mdash; we can't wait to get you into a model home.</p>`),
      }
    case 'declined':
      return {
        subject: 'Update on your Adams Homes application',
        text: `Hi ${first}, thank you for interviewing with Adams Homes. After careful review we won't be moving forward at this time. We'd love to stay in touch for future openings.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p>Thank you for the time and care you put into your application and video interview for the ${division} team.</p>
          <p>After careful review, we won't be moving forward at this time. This decision reflects fit for this specific opening &mdash; not your potential, and we'd genuinely love to stay in touch for future openings.</p>
          <p>We wish you every success in your search.</p>`),
      }
  }
}

export async function sendCandidateNotification(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[interview] SendGrid not configured; notification not emailed:', subject)
    return false
  }
  try {
    await sgMail.send({ to, from: FROM, subject, html, text })
    return true
  } catch (e) {
    console.error('[interview] notification email failed:', e)
    return false
  }
}
