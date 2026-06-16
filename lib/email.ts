import sgMail from '@sendgrid/mail'

// Initialize SendGrid (will use env variable SENDGRID_API_KEY)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendQuestionToAdmin(
  questionText: string,
  userName: string,
  userEmail: string,
  division: string,
  adminEmail: string = process.env.ADMIN_EMAIL || 'admin@adamshomes.com'
) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Skipping email.')
    return
  }

  try {
    await sgMail.send({
      to: adminEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@adamshomes.com',
      subject: `New Question from ${userName} - ${division}`,
      html: `
        <h2>New Question Submitted</h2>
        <p><strong>From:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Division:</strong> ${division}</p>
        <p><strong>Question:</strong></p>
        <p>${questionText.replace(/\n/g, '<br>')}</p>
      `,
    })
  } catch (error) {
    console.error('Error sending question email:', error)
  }
}

export async function sendCompletionToManager(
  associateName: string,
  associateEmail: string,
  division: string,
  completedMilestones: string[],
  remainingMilestones: string[],
  managerEmail: string
) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Skipping email.')
    return
  }

  try {
    await sgMail.send({
      to: managerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@adamshomes.com',
      subject: `Onboarding Update: ${associateName} Completed a Milestone`,
      html: `
        <h2>Sales Associate Onboarding Progress</h2>
        <p><strong>Associate:</strong> ${associateName}</p>
        <p><strong>Email:</strong> ${associateEmail}</p>
        <p><strong>Division:</strong> ${division}</p>

        <h3>Completed Milestones (${completedMilestones.length})</h3>
        <ul>
          ${completedMilestones.map(m => `<li>${m}</li>`).join('')}
        </ul>

        <h3>Remaining Milestones (${remainingMilestones.length})</h3>
        <ul>
          ${remainingMilestones.length > 0 ? remainingMilestones.map(m => `<li>${m}</li>`).join('') : '<li>None - All completed!</li>'}
        </ul>
      `,
    })
  } catch (error) {
    console.error('Error sending completion email:', error)
  }
}

export async function sendWelcomeEmail(
  associateName: string,
  associateEmail: string,
  division: string,
  dashboardUrl: string = 'http://localhost:3000'
) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Skipping email.')
    return
  }

  try {
    await sgMail.send({
      to: associateEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@adamshomes.com',
      subject: 'Welcome to Adams Homes - Your Onboarding Journey Starts Here',
      html: `
        <h2>Welcome to Adams Homes, ${associateName}!</h2>
        <p>We're excited to have you join the team in the ${division} division.</p>
        <p>Your onboarding dashboard is ready. Access it here:</p>
        <p><a href="${dashboardUrl}" style="background-color: #1a5490; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a></p>
        <p>Complete the 8 onboarding milestones to get started successfully.</p>
      `,
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
  }
}
