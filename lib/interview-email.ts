import sgMail from '@sendgrid/mail'

// Candidate notification emails for the Virtual Sales Agent Video Interview
// platform. Same SendGrid setup as lib/email.ts; every send degrades to a
// console warning when SENDGRID_API_KEY is not configured so the pipeline
// keeps working (decisions are always also posted to the candidate's chat).

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@adamshomes.com'

const WRAP = (inner: string) => `
  <div style="font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#2c3e50;">
    <div style="background:#1a3a70;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0;border-bottom:3px solid #e31a23;">
      <h2 style="margin:0;font-size:20px;">Adams Homes &mdash; Sales Team Hiring</h2>
    </div>
    <div style="border:1px solid #e8eaed;border-top:0;border-radius:0 0 10px 10px;padding:22px;line-height:1.6;">
      ${inner}
      <p style="color:#7f8c8d;font-size:13px;margin-top:26px;">Adams Homes &mdash; Value, Simplified&trade;<br>Adams Homes is an equal opportunity employer.</p>
    </div>
  </div>`

export type NotifyKind =
  | 'advanced'
  | 'declined'
  | 'offer_sent'
  | 'invited'
  | 'pooled'
  | 'scheduled'

// Candidate-controlled strings (their name) are interpolated into email
// HTML — escape them so a crafted name cannot inject markup.
function escHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}

export function defaultNotification(
  kind: NotifyKind,
  candidateName: string,
  division: string,
  extra?: {
    interviewUrl?: string
    sessionDate?: string
    teamsUrl?: string
    managerName?: string
    managerEmail?: string
    offer?: { commission?: string; startDate?: string }
  }
): { subject: string; html: string; text: string } {
  const firstRaw = candidateName.split(' ')[0]
  const first = escHtml(firstRaw)
  switch (kind) {
    case 'invited':
      return {
        subject: 'Your Adams Homes video interview link',
        text: `Hi ${firstRaw}, your application to the Adams Homes ${division} sales team was received. Complete your video interview here: ${extra?.interviewUrl}`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p>Thanks for applying to the <b>${division}</b> sales team. Your next step is a short video interview &mdash; five questions, about 15 minutes, recorded whenever suits you.</p>
          <p style="margin:20px 0;"><a href="${extra?.interviewUrl}" style="background:#e31a23;color:#fff;padding:13px 22px;border-radius:6px;text-decoration:none;font-weight:700;">Start My Video Interview</a></p>
          <p>Tip: find a quiet spot, and dress like you're meeting a buyer.</p>`),
      }
    case 'scheduled':
      return {
        subject: 'Congratulations—You\'re Invited to Your Adams Homes Team Assessment',
        text: `Hi ${firstRaw}, congratulations! You impressed us, and we'd like to invite you to participate in our team assessment for the ${division} location${extra?.sessionDate ? ' on ' + extra.sessionDate : ''}. We hire professionals who prepare—please spend 30 minutes learning about Adams Homes before your assessment. Questions? Contact ${extra?.managerName} at ${extra?.managerEmail}.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p><b>Congratulations!</b> You impressed us, and we'd like to invite you to participate in our team assessment.</p>

          <h3 style="font-size:16px;margin:20px 0 10px;color:#1a3a70;">Interview Details</h3>
          <ul style="margin:10px 0 20px;padding-left:20px;">
            <li><b>Date & Time:</b> ${extra?.sessionDate || 'TBD'}</li>
            <li><b>Format:</b> Virtual (Microsoft Teams)</li>
            ${extra?.teamsUrl ? `<li><b>Teams Link:</b> <a href="${extra.teamsUrl}">${extra.teamsUrl}</a></li>` : ''}
          </ul>

          <h3 style="font-size:16px;margin:20px 0 10px;color:#1a3a70;">Before Your Assessment</h3>
          <p>We hire professionals who prepare. Please spend 30 minutes learning about Adams Homes. Review our website and be prepared to discuss what you learned and why you believe you're the right fit.</p>
          <p>We value preparation because that's exactly how we serve our customers.</p>

          <h3 style="font-size:16px;margin:20px 0 10px;color:#1a3a70;">What to Wear</h3>
          <p>Dress professionally—as if you're meeting with a customer. Business casual or better.</p>

          <h3 style="font-size:16px;margin:20px 0 10px;color:#1a3a70;">Questions or Scheduling Conflict?</h3>
          <p>If you have any questions or need to reschedule, please contact <b>${extra?.managerName}</b> at <b><a href="mailto:${extra?.managerEmail}">${extra?.managerEmail}</a></b>.</p>`),
      }
    case 'advanced':
      return {
        subject: "Great news — you're moving to the next round at Adams Homes",
        text: `Hi ${firstRaw}, great news: you've advanced to the next round of our sales team hiring process for ${division}. We'll follow up shortly with details.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p><b>Great news</b> &mdash; our sales managers reviewed your interview and you've <b>advanced to the next round</b> for the ${division} team.</p>
          <p>We'll follow up shortly with scheduling details. If you have any questions in the meantime, just reply through your interview page chat.</p>`),
      }
    case 'pooled':
      return {
        subject: "You're in our future candidate pool at Adams Homes",
        text: `Hi ${firstRaw}, congratulations — you've been added to our future candidate pool for the ${division} area. We'll contact you as soon as a matching opening arises.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p><b>Congratulations!</b> You've been added to our <b>future candidate pool</b> for the ${division} area.</p>
          <p>That means we were impressed and want to keep you close &mdash; we'll reach out as soon as an opening matches your profile. No action needed from you.</p>`),
      }
    case 'offer_sent':
      return {
        subject: 'Your offer from Adams Homes',
        text: `Hi ${firstRaw}, congratulations! We'd like to offer you a position as Sales Associate on the Adams Homes ${division} team.${extra?.offer?.commission ? ' Commission: ' + extra.offer.commission + '.' : ''}${extra?.offer?.startDate ? ' Start date: ' + extra.offer.startDate + '.' : ''} Full details to follow.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p><b>Congratulations!</b> We'd like to offer you a position as <b>Sales Associate</b> on the ${division} team.</p>
          ${extra?.offer?.commission || extra?.offer?.startDate ? `<ul>
            ${extra?.offer?.commission ? `<li><b>Commission:</b> ${extra.offer.commission}</li>` : ''}
            ${extra?.offer?.startDate ? `<li><b>Start date:</b> ${extra.offer.startDate}</li>` : ''}
            <li><b>Training:</b> Full-time professional sales training through Forrest Performance Group</li>
          </ul>` : ''}
          <p>Your official offer letter with full details follows separately. Welcome to the start of your onboarding journey &mdash; we can't wait to get you into a model home.</p>`),
      }
    case 'declined':
      return {
        subject: 'Update on your Adams Homes application',
        text: `Hi ${firstRaw}, thank you for interviewing with Adams Homes. After careful review we won't be moving forward at this time. We'd love to stay in touch for future openings.`,
        html: WRAP(`
          <p>Hi ${first},</p>
          <p>Thank you for the time and care you put into your application and interview for the ${division} team.</p>
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
