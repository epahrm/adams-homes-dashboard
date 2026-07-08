// Standard milestone plans and teaching modules.
// Source material: Elizabeth's "Ultimate Soccer Recruiting Playbook",
// "Elite Recruiting Workbook", and "College Recruiting Questions".

export interface SeedTask {
  band: 'PRE_HS' | 'GRADE_9_10' | 'GRADE_11' | 'GRADE_12'
  title: string
  detail: string
}

export const STANDARD_TASKS: SeedTask[] = [
  // ---- Pre-High School: foundations & habits ----
  { band: 'PRE_HS', title: 'Fall in love with the game — touches every day', detail: 'Recruiting starts years away. Right now the job is skill development: first touch, both feet, 1v1 confidence.' },
  { band: 'PRE_HS', title: 'Play at the most competitive level available to you', detail: 'Coaches recruit from competitive club environments. Find the best level where you still get real minutes.' },
  { band: 'PRE_HS', title: 'Build the student habit now', detail: 'NCAA eligibility is built on high school core courses — and the habits that earn strong grades start in middle school.' },
  { band: 'PRE_HS', title: 'Watch college soccer and learn the levels', detail: 'D1, D2, D3, NAIA, JUCO — watch matches, notice positions and speed of play, and start imagining where you might fit.' },
  { band: 'PRE_HS', title: 'Start a simple training planner', detail: 'Use the weekly training planner: day, focus, duration, done. Consistency is the first thing college coaches ask about.' },
  { band: 'PRE_HS', title: 'Meet with your advisor to set your starting goals', detail: 'Define what excites you about college soccer and set 2–3 development goals for the year.' },

  // ---- 9th–10th: development, film & first outreach ----
  { band: 'GRADE_9_10', title: 'Focus on skill development and strength training', detail: 'Speed and athleticism matter to coaches. Build a consistent training program alongside club play.' },
  { band: 'GRADE_9_10', title: 'Keep your grades strong — core courses count now', detail: 'Every semester counts toward your NCAA core GPA (16 core courses: 4 English, 3 Math, 2 Science, 2 Social Science, 5 additional).' },
  { band: 'GRADE_9_10', title: 'Begin collecting game film', detail: 'Ask parents or teammates to film matches. You need raw footage before you can cut highlights.' },
  { band: 'GRADE_9_10', title: 'Play at the highest competitive level possible', detail: 'Club, ECNL, high school varsity — coaches evaluate the level you compete at.' },
  { band: 'GRADE_9_10', title: 'Research potential colleges and build your first list', detail: 'Start your target school list: dream / target / safety. Consider academics, location, division, and team culture.' },
  { band: 'GRADE_9_10', title: 'Create your highlight video (3–5 minutes)', detail: 'Best plays first, identify yourself before each clip, 10–15 seconds per clip. A coach decides in the first 60 seconds.' },
  { band: 'GRADE_9_10', title: 'Build your recruiting profile', detail: 'Complete your profile here: position, club, GPA, highlight link. This becomes the page you share with every coach.' },
  { band: 'GRADE_9_10', title: 'Register with the NCAA Eligibility Center', detail: 'Register during sophomore year at eligibilitycenter.org. Required for D1/D2.' },
  { band: 'GRADE_9_10', title: 'Research programs and coaching staffs', detail: 'For each target school, learn the coach’s name, the team’s style, and recent recruiting classes.' },
  { band: 'GRADE_9_10', title: 'Begin emailing coaches with your highlight video', detail: 'Coaches can’t respond before June 15 after sophomore year (D1/D2), but they can watch you and follow your progress.' },
  { band: 'GRADE_9_10', title: 'Mark June 15 — the contact window opens', detail: 'June 15 after sophomore year, D1/D2 coaches may contact you directly. Have your film, list, and profile ready before that day.' },

  // ---- 11th: the push year ----
  { band: 'GRADE_11', title: 'Update your highlight video regularly', detail: 'Refresh with junior-season film. Coaches want recent, full-speed footage.' },
  { band: 'GRADE_11', title: 'Email coaches before every tournament and showcase', detail: 'Send your schedule, jersey number, and field so coaches can plan to watch you.' },
  { band: 'GRADE_11', title: 'Attend showcases and ID camps strategically', detail: 'Go where coaches already know you. Communicate before attending; follow up within 48 hours after.' },
  { band: 'GRADE_11', title: 'Take campus visits', detail: 'Unofficial visits any time; official visits can begin August 1 before junior year. Prepare your questions for coaches.' },
  { band: 'GRADE_11', title: 'Communicate consistently with coaches', detail: 'Reply promptly and professionally. Share new film, season results, and academic updates.' },
  { band: 'GRADE_11', title: 'Protect your NCAA core GPA', detail: 'Junior year grades weigh heavily. Verify your core-course progress with your counselor.' },
  { band: 'GRADE_11', title: 'Build your official-visit shortlist', detail: 'Score each school on academics, playing opportunity, coaching style, culture, and cost.' },

  // ---- 12th: decide & sign ----
  { band: 'GRADE_12', title: 'Take your official visits', detail: 'Up to 48 hours on campus, paid by the college. Meet the team, watch training, ask your prepared questions.' },
  { band: 'GRADE_12', title: 'Evaluate your college options carefully', detail: 'Balance athletics, academics, financial fit, and overall student experience — the best decision weighs all four.' },
  { band: 'GRADE_12', title: 'Understand every offer before you answer', detail: 'Scholarship offer vs. roster spot vs. preferred walk-on vs. non-committable offer — know exactly what is being offered.' },
  { band: 'GRADE_12', title: 'Commit to a program if offered', detail: 'A verbal commitment is non-binding, but treat it seriously and communicate clearly with every coach involved.' },
  { band: 'GRADE_12', title: 'Sign your National Letter of Intent', detail: 'The signing window opens in November. The NLI makes it official.' },
  { band: 'GRADE_12', title: 'Complete admissions, financial aid, and enrollment', detail: 'Apply, finish FAFSA and scholarship paperwork, and complete every enrollment step.' },
  { band: 'GRADE_12', title: 'Finish your final NCAA eligibility review', detail: 'Request final amateurism certification and have your final transcript sent to the Eligibility Center.' },
]

export interface SeedLesson {
  title: string
  kind: 'READ' | 'VIDEO' | 'TEMPLATE' | 'WORKSHEET' | 'CALL'
  content: string
}

export interface SeedModule {
  slug: string
  title: string
  description: string
  band: string
  lessons: SeedLesson[]
}

export const MODULES: SeedModule[] = [
  {
    slug: 'tournament-showcase',
    title: 'Preparing for a Tournament Showcase',
    description: 'Showcases put you in front of dozens of coaches at once. This module covers the before, during, and after.',
    band: 'ALL',
    lessons: [
      { title: 'Why showcases matter', kind: 'READ', content: `Showcases provide exposure to many college coaches at one event — often dozens of programs on one weekend.\n\nThe athletes who benefit most are the ones coaches **already planned to watch**. A showcase is not where coaches discover you; it is where they confirm what your film promised.\n\n**Your showcase formula:**\n1. Build a target-coach list for the event\n2. Email those coaches your schedule before the event\n3. Compete — coaches watch everything, including body language\n4. Follow up within 48 hours` },
      { title: 'Build your target-coach list for the event', kind: 'WORKSHEET', content: `Before any showcase, list every school attending that is on (or could be on) your target list.\n\nFor each one record:\n- School and division\n- Coach name and email\n- Whether you have contacted them before\n- Your one-line reason they should watch you\n\nBring the list to your advisor call before the event — we will prioritize it together.` },
      { title: 'The pre-tournament email that gets coaches to your field', kind: 'TEMPLATE', content: `Subject: **[Grad year] [Position] — [Your name] at [Event], [Dates]**\n\nCoach [Last name],\n\nMy name is [name], class of [grad year], [position] with [club] ([league]). I'll be playing at [event] in [city] on [dates]:\n\n- [Date, time] — Field [#] vs [opponent] — #[jersey] in [color]\n- [Date, time] — Field [#] vs [opponent]\n\nHighlights: [link] · GPA: [GPA] · NCAA ID: [#]\n\nI'm very interested in [school] because [one specific, true reason]. I'd love for you to see me play.\n\nThank you,\n[Name] · [phone] · [profile link]\n\n**Rules:** keep it short, get the coach's name right, one specific reason per school — never a mass email blast.` },
      { title: 'Game day: what coaches on the sideline actually notice', kind: 'READ', content: `Coaches evaluate athletic ability, mentality, and potential — not just goals.\n\n**What they watch:**\n- Your first touch under pressure and speed of play\n- What you do the 88 minutes you don't have the ball\n- Body language after a mistake — this is the big one\n- How you warm up, how you treat teammates and referees\n- Whether you take coaching on the sideline\n\nOne bad game won't sink you. Visible bad attitude will.` },
      { title: 'The 48-hour follow-up', kind: 'TEMPLATE', content: `Within 48 hours of the event, email every coach on your target list who attended:\n\nSubject: **Thank you — [name], [grad year] [position] at [event]**\n\nCoach [Last name],\n\nThank you for coming out to [event]. My team went [result summary]. Here's a short clip from the weekend: [10–20 second clip link].\n\nI remain very interested in [school] and would welcome the chance to talk. My updated highlights and schedule are here: [profile link].\n\n[Name]\n\n**Then log it:** record every email in your school tracker so we can see response patterns.` },
      { title: 'Showcase debrief with your advisor', kind: 'CALL', content: `Schedule a 20-minute debrief within a week of the event.\n\nWe'll cover: how you played, which coaches watched, who to follow up with again, and what changes for the next event.` },
    ],
  },
  {
    slug: 'college-id-camp',
    title: 'Going to a College ID Camp',
    description: 'ID camps let a staff evaluate you up close for a full day. Picking the right ones is the whole game.',
    band: 'ALL',
    lessons: [
      { title: 'How to pick the right ID camps', kind: 'READ', content: `An ID camp is run by a college program so its coaches can evaluate recruits directly.\n\n**The golden rule: attend camps where coaches already know you.** A camp where you're anonymous is expensive training; a camp where the staff asked to see you is an audition.\n\nPick camps by:\n- Schools genuinely on your target list\n- Programs that replied to your emails or viewed your film\n- Divisions that match your realistic level (be honest)\n- Multi-school camps early on — more staffs, one fee` },
      { title: 'Email the staff before you register', kind: 'TEMPLATE', content: `Subject: **[Grad year] [Position] — attending your [date] ID camp**\n\nCoach [Last name],\n\nI'm [name], class of [grad year], [position] with [club]. I've registered for your ID camp on [date] and wanted to introduce myself first.\n\nHighlights: [link] · GPA: [GPA]\n\n[School] is high on my list because [specific reason]. I'm looking forward to learning from your staff in person.\n\n[Name] · [profile link]\n\nCoaches pay far more attention to campers they exchanged emails with beforehand.` },
      { title: 'What happens at camp — and how to stand out', kind: 'READ', content: `Expect training sessions, small-sided games, and full matches, all run by the college staff.\n\n**Stand out by:**\n- Introducing yourself to the staff (firm handshake, eye contact, thank them)\n- Playing YOUR game — do the things your film shows\n- Being the loudest communicator on the field\n- Sprinting between drills; coaches notice effort between the whistles\n- Asking one good question at the end` },
      { title: 'The post-camp follow-up', kind: 'TEMPLATE', content: `Within 48 hours:\n\nCoach [Last name],\n\nThank you for this weekend's camp — I especially enjoyed [specific drill/session moment]. It confirmed how interested I am in [school].\n\nI'd appreciate any feedback on my performance and what you'd want to see me improve. My updated film and schedule: [profile link].\n\n[Name]\n\nA feedback request shows coachability — the trait every staff says they want.` },
      { title: 'Log the camp in your school tracker', kind: 'WORKSHEET', content: `Add a "Camp / showcase" entry to each school involved in the camp, with your honest self-assessment and any staff feedback. This is how we build the picture of which programs are warm.` },
    ],
  },
  {
    slug: 'high-school-season',
    title: 'Preparing for High School Soccer Season',
    description: 'Fitness benchmarks, tryout mindset, and balancing school ball with club and academics.',
    band: 'ALL',
    lessons: [
      { title: 'Pre-season fitness: earn the season before it starts', kind: 'READ', content: `Strength training improves recruiting potential — speed and athleticism are on every coach's evaluation sheet.\n\n**6 weeks out:** build your aerobic base (3 runs/week) and start 2 strength sessions weekly.\n**3 weeks out:** shift to sprint intervals, agility ladders, and ball work at speed.\n**Week of tryouts:** taper — sharp, rested, and touching the ball daily.\n\nUse the weekly training planner and check off every session.` },
      { title: 'Tryout mindset', kind: 'READ', content: `Coaches pick attitude as much as ability.\n\n- Arrive early, stay late, hustle between every drill\n- Be vocal — quiet players are invisible players\n- Compete for every ball but never play dirty\n- Treat every scrimmage shift as your best film opportunity\n- If you make a mistake: next play. Nothing else.` },
      { title: 'Balancing club, school ball, and academics', kind: 'READ', content: `The season stacks fast: school training, matches, club, homework.\n\n- Grades come first — your NCAA core GPA doesn't pause for the season\n- Plan your week Sunday night: trainings, matches, study blocks\n- Sleep is a performance tool; protect it\n- Tell your advisor early if the load is slipping — we adjust the plan, not the standards` },
      { title: 'Using high school season for recruiting', kind: 'READ', content: `Club film usually leads your highlight reel, but high school season adds value:\n- Varsity honors and captaincies go on your résumé\n- Local media coverage is shareable content\n- It's fresh film in a different context\n- Coaches love multi-season durability\n\nGet someone to film every match. You can't cut what wasn't recorded.` },
      { title: 'Season goals worksheet', kind: 'WORKSHEET', content: `Set your season targets and share them with your advisor:\n- One team goal (e.g., district final)\n- Two performance goals (e.g., 8 assists, 80% pass completion in film review)\n- One leadership goal (e.g., voted captain, lead warm-ups)\n- One academic goal for the semester` },
    ],
  },
  {
    slug: 'social-media',
    title: 'Marketing Yourself on Social Media',
    description: 'Coaches scout on X/Twitter. Build a clean, searchable recruiting presence — and avoid the posts that get recruits dropped.',
    band: 'ALL',
    lessons: [
      { title: 'Why X (Twitter) matters more than Instagram for recruiting', kind: 'READ', content: `Many college coaches use X as a primary discovery tool:\n\n- Coaches search terms like **"2027 Forward highlight"** or **"2028 Center Back"** — if your clips include grad year and position, they can find you\n- Coaches can instantly repost your clip to their staff\n- Many coaches recruit in public: "Looking for 2027 midfielders" — players who reply with film get evaluated\n- Short 10–20 second clips let a coach evaluate many players while scrolling\n\nInstagram mostly reaches people who already follow you. X reaches coaches searching for you.` },
      { title: 'Build the perfect recruiting profile', kind: 'TEMPLATE', content: `Your bio is your recruiting résumé in 4 lines:\n\n> [Name] | [Grad year] | [Position]\n> [City, State]\n> [High school] | [Club team]\n> GPA: [#] · Hudl: [link]\n\n**Profile photo:** clear headshot or action photo of YOU (not a team photo), in uniform, face visible.\n\n**Pinned post:** your best 15-second clip with the same identity line.` },
      { title: 'The perfect recruiting post formula', kind: 'TEMPLATE', content: `Every highlight post should include:\n1. Grad year + position ("2028 CM")\n2. A 10–20 second clip, full speed, you clearly identified\n3. Your club and high school\n4. Your Hudl/profile link\n5. Tag the event and (sparingly) relevant programs\n\n> 2028 CM | Merritt Island, FL\n> GPA: 3.9\n> Highlight from this weekend's showcase ⚽\n> [clip]\n> Hudl: [link]\n\nPost consistently during season — coaches value seeing development over time.` },
      { title: 'What gets recruits dropped', kind: 'READ', content: `Coaches check your whole account before offering. Programs have quietly dropped recruits over:\n- Trash talk, profanity, or arguing with officials/opponents\n- Anything touching alcohol, drugs, or harassment\n- Mocking teammates or coaches — even "jokes"\n- Reposting toxic content (a repost reads as an endorsement)\n\n**The test:** would you want the coach's athletic director reading it aloud on your official visit? Clean it up now — deleted posts screenshot forever.` },
      { title: 'Your 30-minute account cleanup', kind: 'WORKSHEET', content: `1. Search your own name + handles the way a coach would\n2. Delete or archive anything that fails the AD test\n3. Rewrite your bio with the recruiting formula\n4. Pin your best clip\n5. Follow the programs on your target list\n6. Send your advisor the link for a final review` },
    ],
  },
  {
    slug: 'writing-to-coaches',
    title: 'Writing to College Coaches',
    description: 'The intro email, the follow-up cadence, and sounding like yourself — not a template.',
    band: 'ALL',
    lessons: [
      { title: 'How coaches read email (and why yours gets skipped)', kind: 'READ', content: `Coaches receive hundreds of recruit emails. They skim for four things in ten seconds:\n\n1. **Grad year and position** in the subject line\n2. **Film link** — one click, no login\n3. **GPA** — can you get in and stay eligible?\n4. **A real reason** you want THEIR school\n\nKeep emails concise and professional. If your email is a wall of text or an obvious mass blast, it's deleted. Athletes must take ownership — coaches want to hear from YOU, not your parents.` },
      { title: 'The introduction email', kind: 'TEMPLATE', content: `Subject: **[Grad year] [Position] — [Name], [Club]**\n\nCoach [Last name],\n\nMy name is [name] and I'm a [grad year] [position] at [high school] playing club for [club] in [league].\n\n- Highlights: [link]\n- GPA: [#] ([#] AP/honors courses)\n- Height: [#] · NCAA ID: [#]\n\nI'm interested in [school] because [specific: their major + style of play + something true about the program]. My upcoming schedule:\n[event, date, location]\n\nThank you for your time — I'd love to know what you look for in a [position].\n\n[Name] · [phone] · [profile link]` },
      { title: 'The follow-up cadence', kind: 'READ', content: `Silence is normal — persistence (not pestering) wins.\n\n- **Before June 15 (soph year):** D1/D2 coaches can't reply, but they read. Email film updates every 6–8 weeks anyway.\n- **After June 15:** if no reply in 2–3 weeks, follow up once with something NEW (new film, results, grades)\n- **Before every event:** schedule email to warm and cold coaches alike\n- **After meaningful contact:** thank-you within 48 hours\n\nEvery send gets logged in your school tracker — patterns tell us where the real interest is.` },
      { title: 'Sound like yourself', kind: 'READ', content: `Templates are scaffolding, not scripts. Before sending any email:\n- Read it out loud — would you actually say this?\n- Swap formal filler ("I am writing to express my interest") for plain speech ("I want to play for you — here's why")\n- Keep ONE specific detail per school that proves you did your homework\n- Let your advisor review your first three emails; after that, you fly solo` },
      { title: 'Be ready to talk about yourself', kind: 'WORKSHEET', content: `When a coach calls, they'll ask about YOU. Prepare short, honest answers:\n1. What are your current performance levels?\n2. What kind of work ethic do you bring?\n3. What are your strengths? What do you struggle with?\n4. What role do you want to play on a college team — starter as a freshman, or grow into the lineup?\n5. What do you think you can contribute?\n6. How strong of a student are you?\n\nWrite your answers, practice them aloud, and bring them to your next advisor call.` },
    ],
  },
  {
    slug: 'highlight-video',
    title: 'Building Your Highlight Video',
    description: 'A coach decides in the first 60 seconds. Structure, position-specific clips, and the storyboard worksheet.',
    band: 'ALL',
    lessons: [
      { title: 'The 60-second rule and video structure', kind: 'READ', content: `A college coach should be able to evaluate your ability within the **first 60 seconds** of your video.\n\n**Structure:**\n1. Intro slide: name, position, grad year, GPA, school, club, contact (5 seconds, no music montage)\n2. Your best 4–5 plays FIRST\n3. 10–20 additional clips showing range\n4. End slide with contact info and full-film link\n\n**Rules:** 3–5 minutes total · 10–15 seconds per clip · arrow or circle to identify yourself · start clips just before the play · full-speed gameplay only. Simple tools like CapCut or iMovie are fine.` },
      { title: 'Best clips by position', kind: 'READ', content: `Coaches evaluate positions differently. Lead with the skills for YOUR role:\n\n| Position | Show first |\n|---|---|\n| Forward | Goals, attacking runs, finishing, beating defenders, creating chances |\n| Midfielder | Assists, through balls, vision, ball control, transitions |\n| Defender | Tackles, interceptions, aerial wins, positioning, building play |\n| Goalkeeper | Saves, reactions, distribution, command of the box, communication |\n\nShow 3–4 different skills, not the same play ten times.` },
      { title: 'Storyboard your video', kind: 'WORKSHEET', content: `Before editing, plan 15 clips on paper. For each:\n- Clip # and match/date\n- What happens in the play\n- Which position skill it demonstrates\n\nThen order them: best 5 first, the rest grouped by skill. Cut anything where a stranger couldn't spot you in 2 seconds.` },
      { title: 'Advisor film review', kind: 'CALL', content: `Before your video goes to any coach, we review it together: clip selection, order, length, identification, and the intro slide. Book 30 minutes and bring the draft link.` },
    ],
  },
  {
    slug: 'ncaa-eligibility',
    title: 'NCAA Eligibility 101',
    description: 'Core courses, the Eligibility Center, amateurism — built on official NCAA resources.',
    band: 'ALL',
    lessons: [
      { title: 'The three levels: D1, D2, D3 (and NAIA/JUCO)', kind: 'READ', content: `- **Division I** — highest level, athletic scholarships, biggest time commitment\n- **Division II** — competitive, scholarships, often better athletics/life balance\n- **Division III** — no athletic scholarships but strong academics and real financial aid packages\n- **NAIA & JUCO** — legitimate paths with scholarships and later recruiting timelines\n\n**Reality check from your advisor:** very few soccer players get full rides. Most offers are partial and stack with academic money — which is why your GPA is a recruiting weapon.` },
      { title: 'The 16 core courses', kind: 'READ', content: `NCAA D1/D2 eligibility requires 16 core courses across high school:\n\n- 4 years of English\n- 3 years of Math (Algebra I or higher)\n- 2 years of Science\n- 2 years of Social Science\n- 5 additional academic courses\n\nYour core GPA is calculated ONLY from these classes. Verify with your counselor each year that you're on track — some electives don't count.` },
      { title: 'Register with the Eligibility Center', kind: 'READ', content: `Register at **eligibilitycenter.org** during sophomore year.\n\nYou'll need: personal info, school history, and sports participation history. You'll get an NCAA ID — put it in your profile and your coach emails.\n\nAlso maintain **amateur status**: don't sign with an agent or accept prize money beyond expenses without checking the rules first. When in doubt, ask your advisor BEFORE accepting anything.` },
      { title: 'Your eligibility timeline', kind: 'READ', content: `- **9th–10th:** take the right core courses, protect the GPA\n- **Sophomore year:** register with the Eligibility Center\n- **June 15 after sophomore year:** D1/D2 coaches may contact you\n- **Junior year:** request your transcript be sent; take SAT/ACT if required by target schools\n- **Senior year:** final amateurism certification + final transcript after graduation` },
    ],
  },
  {
    slug: 'choosing-the-right-college',
    title: 'Choosing the Right College',
    description: 'The evaluation framework: academics, athletics, atmosphere, cost — and the questions to ask every coach.',
    band: 'GRADE_11',
    lessons: [
      { title: 'The four-factor evaluation', kind: 'READ', content: `The best college decision balances four things:\n\n1. **Academics** — do they have your major? How strong is the program? Graduation rate? Internships?\n2. **Athletics** — your goals (starter? conference champion?), team culture, facilities, coaching style, sports medicine\n3. **Atmosphere** — city vs. small town, distance from family, class sizes, dorms, campus safety, health services\n4. **Cost** — tuition, room & board, scholarships, TOTAL cost of attendance across 4 years\n\nWould you still choose this school if soccer ended tomorrow? That's the safety net question.` },
      { title: '16 questions to ask every coach', kind: 'WORKSHEET', content: `Bring these to visits and calls:\n1. Do you have performance standards to be considered for the team?\n2. What is your coaching philosophy?\n3. What core values drive your program?\n4. How many of your athletes graduate?\n5. How many complete all four years? How many transfer out?\n6. Given your current roster, what role do you see me playing?\n7. What are your expectations on and off the field?\n8. What academic support do athletes get?\n9. What does the training week look like?\n10. How do you develop leaders?\n11. Do athletes live together?\n12. Can I speak with current players?\n13. How strong is alumni support?\n14. What are the strongest parts of your program?\n15. What are you hoping to improve?\n16. Do you expect coaching staff changes before I graduate?` },
      { title: 'Reading an offer: know the language', kind: 'READ', content: `- **Scholarship offer** — includes athletic money (usually partial in soccer)\n- **Roster spot offer** — a place on the team, no athletic money\n- **Preferred walk-on** — guaranteed roster spot, no scholarship initially\n- **Non-committable offer** — depends on other recruits' decisions; NOT a promise\n- **Verbal commitment** — non-binding both ways until you sign\n- **National Letter of Intent** — the binding, official signing\n\nAsk directly: "Is this offer committable today, and what exactly does it include?" Then call your advisor before answering.` },
      { title: 'Score your shortlist', kind: 'WORKSHEET', content: `For each finalist school, score 1–5 on: academics for MY major, realistic playing time, coaching style fit, team culture, campus feel, 4-year affordability.\n\nTotal the scores, then sanity-check against your gut. Review the grid with your advisor and family before any commitment.` },
    ],
  },
]
