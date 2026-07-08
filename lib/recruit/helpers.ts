// Grade-band and key-date math for the recruiting timeline.
// School year convention: the school year ending in May/June of year Y
// belongs to Y. From July 1 onward athletes are treated as their next grade.

export type Band = 'PRE_HS' | 'GRADE_9_10' | 'GRADE_11' | 'GRADE_12'

export const BAND_LABELS: Record<Band, string> = {
  PRE_HS: 'Pre-High School',
  GRADE_9_10: '9th–10th Grade',
  GRADE_11: '11th Grade',
  GRADE_12: '12th Grade',
}

export const BAND_ORDER: Band[] = ['PRE_HS', 'GRADE_9_10', 'GRADE_11', 'GRADE_12']

export const BAND_FOCUS: Record<Band, string> = {
  PRE_HS: 'Foundations & habits',
  GRADE_9_10: 'Development, film & first outreach',
  GRADE_11: 'The push year: visits & conversations',
  GRADE_12: 'Decide & sign',
}

export function currentGrade(gradYear: number, now = new Date()): number {
  // End-year of the current school year (July+ rolls into next year)
  const endYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
  return 12 - (gradYear - endYear)
}

export function bandForGradYear(gradYear: number, now = new Date()): Band {
  const grade = currentGrade(gradYear, now)
  if (grade < 9) return 'PRE_HS'
  if (grade <= 10) return 'GRADE_9_10'
  if (grade === 11) return 'GRADE_11'
  return 'GRADE_12'
}

export function gradeLabel(gradYear: number, now = new Date()): string {
  const g = currentGrade(gradYear, now)
  if (g < 6) return 'Youth'
  if (g < 9) return `${g}th grade (middle school)`
  if (g <= 12) return `${g}th grade`
  return 'Graduated'
}

export interface KeyDate {
  key: string
  label: string
  detail: string
  date: Date
}

// NCAA anchor dates derived from graduation year:
// - June 15 after sophomore year: D1/D2 coaches may contact athletes directly
// - August 1 before junior year: official/unofficial D1 visits may be arranged
// - November of senior year: National Letter of Intent signing opens
export function keyDates(gradYear: number): KeyDate[] {
  return [
    {
      key: 'june15',
      label: 'NCAA D1/D2 contact opens',
      detail: 'June 15 after sophomore year — coaches can call and email you directly',
      date: new Date(gradYear - 2, 5, 15),
    },
    {
      key: 'aug1',
      label: 'Official visits open',
      detail: 'August 1 before junior year — D1 campus visits can be scheduled',
      date: new Date(gradYear - 2, 7, 1),
    },
    {
      key: 'signing',
      label: 'Signing window',
      detail: 'November of senior year — National Letter of Intent',
      date: new Date(gradYear - 1, 10, 12),
    },
  ]
}

export function daysUntil(d: Date, now = new Date()): number {
  const ms = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round(ms / 86400000)
}

export function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base || 'athlete'
}

export const STAGES = [
  { key: 'RESEARCHING', label: 'Researching' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'CONVERSATION', label: 'In conversation' },
  { key: 'VISIT_PLANNED', label: 'Visit planned' },
  { key: 'OFFER', label: 'Offer' },
  { key: 'COMMITTED', label: 'Committed' },
] as const

export const SCHOOL_CATEGORIES = [
  { key: 'DREAM', label: 'Dream' },
  { key: 'TARGET', label: 'Target' },
  { key: 'SAFETY', label: 'Safety' },
] as const

export const CONTACT_TYPES = [
  { key: 'EMAIL_SENT', label: 'Email sent' },
  { key: 'REPLY', label: 'Coach replied' },
  { key: 'CALL', label: 'Phone/video call' },
  { key: 'VISIT', label: 'Campus visit' },
  { key: 'CAMP', label: 'Camp / showcase' },
  { key: 'NOTE', label: 'Note' },
] as const
