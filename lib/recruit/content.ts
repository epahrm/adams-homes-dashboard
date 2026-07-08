// Static content: strengths questionnaire, recruiting dictionary, official
// resources, parent guide, and the Florida programs directory.
// Sources: Elizabeth's playbook/workbook + "College Recruiting Questions".

export interface QOption {
  label: string
  strengths: string[]
}

export interface Question {
  id: string
  text: string
  kind: 'choice' | 'multi' | 'text'
  options?: QOption[]
  placeholder?: string
}

export const QUESTIONNAIRE: Question[] = [
  {
    id: 'position', text: 'What position do you play (primary)?', kind: 'choice',
    options: [
      { label: 'Forward / Striker', strengths: ['Goal scorer'] },
      { label: 'Winger', strengths: ['Pace & width'] },
      { label: 'Attacking / Central midfielder', strengths: ['Playmaker'] },
      { label: 'Defensive midfielder', strengths: ['Engine of the team'] },
      { label: 'Outside back', strengths: ['Two-way athlete'] },
      { label: 'Center back', strengths: ['Defensive anchor'] },
      { label: 'Goalkeeper', strengths: ['Last line, first voice'] },
    ],
  },
  {
    id: 'onfield', text: 'Which best describes your strongest on-field quality?', kind: 'choice',
    options: [
      { label: 'Pace & athleticism', strengths: ['Elite athleticism'] },
      { label: 'Vision & final pass', strengths: ['Vision & final pass', 'High soccer IQ'] },
      { label: 'Finishing', strengths: ['Clinical finisher'] },
      { label: 'Defensive work rate & tackling', strengths: ['Relentless work rate'] },
      { label: 'Ball control & 1v1 ability', strengths: ['Technical on the ball'] },
      { label: 'Reading the game / positioning', strengths: ['High soccer IQ'] },
    ],
  },
  {
    id: 'locker', text: 'Your team is losing at halftime. What role do you play in the locker room?', kind: 'choice',
    options: [
      { label: 'I speak up and reset the energy', strengths: ['Vocal leader'] },
      { label: 'I lead by example on the field', strengths: ['Leads by example'] },
      { label: 'I support teammates one-on-one', strengths: ['Great teammate'] },
      { label: 'I stay locked in on my own job', strengths: ['Mentally disciplined'] },
    ],
  },
  {
    id: 'workethic', text: 'What kind of work ethic do you bring to the table?', kind: 'choice',
    options: [
      { label: 'First to arrive, last to leave', strengths: ['Trains beyond the whistle'] },
      { label: 'I train smart — quality over volume', strengths: ['Purposeful trainer'] },
      { label: 'I compete hardest when it counts', strengths: ['Big-game competitor'] },
      { label: 'Steady and consistent, every session', strengths: ['Consistency you can count on'] },
    ],
  },
  {
    id: 'coachable', text: 'When a coach criticizes your play, what do you usually do?', kind: 'choice',
    options: [
      { label: 'Ask questions until I understand the fix', strengths: ['Coachable'] },
      { label: 'Apply it immediately in the next rep', strengths: ['Fast learner'] },
      { label: 'Take it personally at first, then use it as fuel', strengths: ['Competitive fire'] },
      { label: 'Watch film to see it for myself', strengths: ['Student of the game'] },
    ],
  },
  {
    id: 'role', text: 'What role do you want to play on a college team?', kind: 'choice',
    options: [
      { label: 'In the starting lineup as a freshman', strengths: ['Ambitious'] },
      { label: 'Earn my way into the lineup over time', strengths: ['Growth mindset'] },
      { label: 'Contribute wherever the team needs me', strengths: ['Team-first'] },
      { label: 'Become a captain / culture-setter', strengths: ['Future captain'] },
    ],
  },
  {
    id: 'student', text: 'How strong of a student are you?', kind: 'choice',
    options: [
      { label: 'Honor roll — academics are a strength', strengths: ['Student first'] },
      { label: 'Solid grades with room to climb', strengths: ['Rising student'] },
      { label: 'I work harder in the classroom than it shows', strengths: ['Classroom grinder'] },
    ],
  },
  {
    id: 'offfield', text: 'Outside of soccer, what are you most proud of?', kind: 'multi',
    options: [
      { label: 'Academic honors', strengths: ['Student first'] },
      { label: 'Community service / volunteering', strengths: ['Community-minded'] },
      { label: 'A job or family responsibility', strengths: ['Responsible beyond my years'] },
      { label: 'Leadership role (club, church, scouts...)', strengths: ['Leader off the field'] },
      { label: 'Another sport or activity', strengths: ['Multi-sport athlete'] },
    ],
  },
  {
    id: 'struggle', text: 'What do you struggle with most right now? (Honest answers make better plans — only your advisor sees this.)', kind: 'text',
    placeholder: 'e.g., weaker left foot, fitness in the last 15 minutes, confidence after mistakes...',
  },
  {
    id: 'dream', text: 'Describe your dream college experience in one or two sentences.', kind: 'text',
    placeholder: 'e.g., Playing D2 close to home while studying nursing, on a team that feels like family...',
  },
]

// Turns questionnaire answers into strength chips + a résumé profile paragraph.
export function deriveStrengths(answers: Record<string, string | string[]>): string[] {
  const found: string[] = []
  for (const q of QUESTIONNAIRE) {
    if (!q.options) continue
    const a = answers[q.id]
    const picked = Array.isArray(a) ? a : a ? [a] : []
    for (const label of picked) {
      const opt = q.options.find((o) => o.label === label)
      if (opt) for (const s of opt.strengths) if (!found.includes(s)) found.push(s)
    }
  }
  return found.slice(0, 6)
}

export function buildSummary(
  name: string,
  position: string,
  strengths: string[],
  answers: Record<string, string | string[]>
): string {
  const first = name.split(' ')[0]
  const lead = strengths.slice(0, 3).map((s) => s.toLowerCase()).join(', ')
  const student = strengths.some((s) => /student|classroom/i.test(s))
    ? ' A committed student in the classroom,'
    : ''
  const dream = typeof answers.dream === 'string' && answers.dream.trim()
    ? ` ${first}'s goal: ${answers.dream.trim().replace(/\.?$/, '.')}`
    : ''
  return `${position || 'Soccer player'} known for ${lead || 'competitiveness and coachability'}.${student} ${first} leads on and off the field.${dream}`.trim()
}

// ---- Coach email templates (from the recruiting playbook) ----
// Filled with athlete profile + school data; [brackets] mark what the
// athlete still personalizes by hand.

export interface EmailContext {
  athleteName: string
  gradYear: number
  position: string
  clubTeam: string
  highSchool: string
  gpa: string
  highlightUrl: string
  profileUrl: string
  ncaaRegistered: boolean
  schoolName: string
  coachName: string
}

export interface EmailTemplate {
  key: string
  label: string
  subject: (c: EmailContext) => string
  body: (c: EmailContext) => string
}

const coachLine = (c: EmailContext) =>
  `Coach ${c.coachName ? c.coachName.split(' ').slice(-1)[0] : '[Last name]'},`
const signature = (c: EmailContext) =>
  `${c.athleteName}\n[phone]\n${c.profileUrl}`
const statsLine = (c: EmailContext) =>
  [
    c.highlightUrl ? `Highlights: ${c.highlightUrl}` : 'Highlights: [link]',
    c.gpa ? `GPA: ${c.gpa}` : 'GPA: [#]',
    c.ncaaRegistered ? 'NCAA Eligibility Center: registered' : null,
  ].filter(Boolean).join(' · ')

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: 'intro',
    label: 'Introduction email',
    subject: (c) => `${c.gradYear} ${c.position || '[Position]'} — ${c.athleteName}${c.clubTeam ? `, ${c.clubTeam}` : ''}`,
    body: (c) => `${coachLine(c)}

My name is ${c.athleteName} and I'm a ${c.gradYear} ${c.position || '[position]'}${c.highSchool ? ` at ${c.highSchool}` : ''}${c.clubTeam ? ` playing club for ${c.clubTeam}` : ''}.

${statsLine(c)}

I'm interested in ${c.schoolName} because [one specific, true reason — their major, style of play, something real about the program].

My upcoming schedule:
[event, date, location]

Thank you for your time — I'd love to know what you look for in a ${c.position || '[position]'}.

${signature(c)}`,
  },
  {
    key: 'preEvent',
    label: 'Pre-tournament / showcase',
    subject: (c) => `${c.gradYear} ${c.position || '[Position]'} — ${c.athleteName} at [Event], [Dates]`,
    body: (c) => `${coachLine(c)}

I'm ${c.athleteName}, class of ${c.gradYear}, ${c.position || '[position]'}${c.clubTeam ? ` with ${c.clubTeam}` : ''}. I'll be playing at [event] in [city] on [dates]:

- [Date, time] — Field [#] vs [opponent] — #[jersey] in [color]
- [Date, time] — Field [#] vs [opponent]

${statsLine(c)}

I'm very interested in ${c.schoolName} because [one specific reason]. I'd love for you to see me play.

Thank you,
${signature(c)}`,
  },
  {
    key: 'followUp',
    label: '48-hour follow-up',
    subject: (c) => `Thank you — ${c.athleteName}, ${c.gradYear} ${c.position || '[position]'} at [event]`,
    body: (c) => `${coachLine(c)}

Thank you for coming out to [event]. My team went [result summary]. Here's a short clip from the weekend: [10–20 second clip link].

I remain very interested in ${c.schoolName} and would welcome the chance to talk. My updated highlights and schedule: ${c.profileUrl}

${c.athleteName}`,
  },
  {
    key: 'campThanks',
    label: 'Post-camp thank you',
    subject: (c) => `Thank you — ${c.athleteName}, ${c.gradYear} ${c.position || '[position]'} at your ID camp`,
    body: (c) => `${coachLine(c)}

Thank you for this weekend's camp — I especially enjoyed [specific drill or session moment]. It confirmed how interested I am in ${c.schoolName}.

I'd appreciate any feedback on my performance and what you'd want to see me improve. My updated film and schedule: ${c.profileUrl}

${c.athleteName}`,
  },
]

export interface GlossaryTerm { term: string; def: string }

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Offer', def: 'A coach indicates they want you in their program. May include scholarship money or just a roster spot — always ask which.' },
  { term: 'Scholarship Offer', def: 'An offer that includes athletic scholarship money (often partial in soccer).' },
  { term: 'Roster Spot', def: 'A place on the team without guaranteed scholarship money.' },
  { term: 'Non-Committable Offer', def: 'An offer that depends on other recruiting decisions before it becomes official. Not a promise.' },
  { term: 'Verbal Commitment', def: 'A non-binding agreement where an athlete says they plan to attend a school.' },
  { term: 'National Letter of Intent (NLI)', def: 'Official document that finalizes the recruiting agreement between athlete and school.' },
  { term: 'Official Visit', def: 'A campus visit paid for by the college (travel, meals, lodging — usually up to 48 hours).' },
  { term: 'Unofficial Visit', def: 'A campus visit paid for by the athlete and family.' },
  { term: 'Preferred Walk-On', def: 'A guaranteed roster spot but no scholarship initially.' },
  { term: 'Walk-On', def: 'An athlete who must try out to earn a roster spot.' },
  { term: 'Redshirt', def: 'Practice with the team but do not compete, preserving a season of eligibility.' },
  { term: 'Medical Redshirt', def: 'An extra year of eligibility granted due to injury.' },
  { term: 'Grayshirt', def: 'Delaying enrollment until the spring semester.' },
  { term: 'ID Camp', def: 'A camp run by a college where its coaches evaluate recruits directly.' },
  { term: 'Showcase', def: 'A tournament many college coaches attend to scout players.' },
  { term: 'Highlight Video', def: 'A short film (3–5 minutes) of your best clips. Best plays first; identify yourself.' },
  { term: 'Hudl', def: 'The video platform most teams use to share film with coaches.' },
  { term: 'Recruiting Profile', def: 'Your online profile with athletic and academic information — the link you share with every coach.' },
  { term: 'Exposure', def: 'Opportunities for coaches to see you play — events, film, and social media.' },
  { term: 'Evaluation Period', def: 'When coaches can watch recruits compete in person.' },
  { term: 'Contact Period', def: 'When coaches can communicate directly with recruits.' },
  { term: 'Dead Period', def: 'When coaches cannot have in-person recruiting contact.' },
  { term: 'Transfer Portal', def: 'Database college athletes enter to transfer schools — it affects roster openings for recruits too.' },
  { term: 'Recruiting Class', def: 'The group of athletes a program recruits for the same graduation year.' },
  { term: 'Depth Chart', def: 'A coach’s ranking of players at each position.' },
  { term: 'NCAA Eligibility Center', def: 'The organization that verifies academic and amateur eligibility for D1/D2. Register sophomore year.' },
  { term: 'Core Courses', def: 'The 16 specific high school classes required by the NCAA (4 English, 3 Math, 2 Science, 2 Social Science, 5 additional).' },
  { term: 'Core GPA', def: 'Your GPA calculated only from NCAA core courses — the number that matters for eligibility.' },
  { term: 'Amateur Status', def: 'Confirmation you have not been paid to play. Protect it; ask before accepting anything.' },
  { term: 'Fit', def: 'How well a school matches you athletically, academically, socially, and financially. The whole decision.' },
]

export interface Resource {
  title: string
  org: string
  url: string
  blurb: string
}

export const OFFICIAL_RESOURCES: Resource[] = [
  { title: 'NCAA Eligibility Center', org: 'NCAA', url: 'https://web3.ncaa.org/ecwr3/', blurb: 'Register (sophomore year), track core courses, and check certification status. Required for D1/D2.' },
  { title: 'Guide for the College-Bound Student-Athlete', org: 'NCAA', url: 'https://www.ncaa.org/sports/2015/1/8/guide-for-the-college-bound-student-athlete.aspx', blurb: 'The official rulebook for recruiting, eligibility, and amateurism.' },
  { title: 'NCAA Recruiting Calendars', org: 'NCAA', url: 'https://www.ncaa.org/sports/2013/11/27/recruiting-calendars.aspx', blurb: 'When coaches can call, text, and watch you — by division and sport.' },
  { title: 'Play Division I / II / III Soccer', org: 'NCAA', url: 'https://www.ncaa.org/sports/2014/10/16/want-to-play-college-sports.aspx', blurb: 'Division-by-division overview of what it takes and what to expect.' },
  { title: 'NFHS — High School Athletics', org: 'NFHS', url: 'https://www.nfhs.org/', blurb: 'High school eligibility rules and resources from the national federation.' },
  { title: 'NFHS Learn — Free Courses', org: 'NFHS', url: 'https://nfhslearn.com/', blurb: 'Free courses on sportsmanship, captaincy, and student-athlete leadership.' },
  { title: 'NAIA Eligibility Center', org: 'NAIA', url: 'https://play.mynaia.org/', blurb: 'The NAIA path: separate eligibility process, real scholarships, later timelines.' },
]

export const PARENT_GUIDE = {
  title: 'The Parent Playbook',
  sections: [
    {
      heading: 'Recruiting reality',
      body: 'Very few soccer athletes receive full athletic scholarships. Most are partial and combined with academic aid — academics often create the largest financial opportunities. Exposure and communication drive everything else.',
    },
    {
      heading: 'Your role',
      body: 'Support your athlete but let them communicate directly with coaches — coaches want to hear from the player, not the parents. Your lane: travel, logistics, organization, and encouraging strong academics.',
    },
    {
      heading: 'Financial planning',
      body: 'Plan for college assuming athletics may not cover full costs. Research academic scholarships and financial aid, and evaluate the TOTAL cost of attendance at each school — not just the athletic money.',
    },
    {
      heading: 'The decision',
      body: 'The best college decision balances athletics, academics, financial fit, and overall student experience. Help your athlete weigh all four — and ask: would this school still be right if soccer ended?',
    },
  ],
}

export interface DirectorySchool {
  name: string
  city: string
  division: string
  program: string
  coachTwitter: string
}

// Florida women's programs directory (from Elizabeth's list, 2021 —
// coach handles should be verified before use).
export const FL_DIRECTORY: DirectorySchool[] = [
  { name: 'University of Florida', city: 'Gainesville', division: 'D1', program: '@GatorsSoccer', coachTwitter: '@SarahLowdon' },
  { name: 'Florida State University', city: 'Tallahassee', division: 'D1', program: '@FSUSoccer', coachTwitter: '@MkrikorianFSU' },
  { name: 'University of Central Florida', city: 'Orlando', division: 'D1', program: '@UCF_WSoccer', coachTwitter: '@Trsahaydak' },
  { name: 'University of South Florida', city: 'Tampa', division: 'D1', program: '@USFWSOC', coachTwitter: '@IbanLopez' },
  { name: 'University of Miami', city: 'Miami', division: 'D1', program: '@UMiamiSoccer', coachTwitter: '@CoachSBarnes' },
  { name: 'Florida International University', city: 'Miami', division: 'D1', program: '@FIUWSoccer', coachTwitter: '@CoachGarbar' },
  { name: 'Florida Atlantic University', city: 'Boca Raton', division: 'D1', program: '@FAUWSoccer', coachTwitter: '@BakesSoulJam' },
  { name: 'Florida Gulf Coast University', city: 'Fort Myers', division: 'D1', program: '@FGCU_WSoccer', coachTwitter: '@Brock_Duckworth' },
  { name: 'University of North Florida', city: 'Jacksonville', division: 'D1', program: '@OspreyWSoc', coachTwitter: '@CoachZVosec' },
  { name: 'Stetson University', city: 'DeLand', division: 'D1', program: '@stetsonwsoccer', coachTwitter: '@LucasZicher' },
  { name: 'University of West Florida', city: 'Pensacola', division: 'D2', program: '@uwfwsoc', coachTwitter: '@DCSmith1376' },
  { name: 'Barry University', city: 'Miami', division: 'D2', program: '@BarryUWSoccer', coachTwitter: '@DbrollyDenise' },
  { name: 'Lynn University', city: 'Boca Raton', division: 'D2', program: '@Lynn_Athletics', coachTwitter: '@jmjkcblazer' },
  { name: 'Palm Beach Atlantic University', city: 'West Palm Beach', division: 'D2', program: '@SailfishWS', coachTwitter: '@cgnehm13' },
  { name: 'Florida Institute of Technology', city: 'Melbourne', division: 'D2', program: '@FT_Athletics', coachTwitter: '@RyanMoon1' },
  { name: 'Rollins College', city: 'Winter Park', division: 'D2', program: '@RollinsWSoccer', coachTwitter: '@JessicaDeese' },
  { name: 'Flagler College', city: 'St. Augustine', division: 'D2', program: '@FlaglerWSoccer', coachTwitter: '@AshleyJMartin27' },
  { name: 'Eastern Florida State College', city: 'Cocoa', division: 'JUCO', program: '@EFSCWomenSoccer', coachTwitter: '' },
  { name: 'Polk State College', city: 'Winter Haven', division: 'JUCO', program: '@Polk_Athletics', coachTwitter: '@rvbelli' },
]
