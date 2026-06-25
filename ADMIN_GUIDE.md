# Adams Homes Onboarding Dashboard - Complete Admin Guide

**Site Live:** https://adams-homes-dashboard.vercel.app

---

## QUICK START FOR ADMINS

### Admin Login
1. Go to: https://adams-homes-dashboard.vercel.app
2. Click "Admin Login →" (bottom of page)
3. Enter your admin email and password
4. Access the full admin dashboard with 4 tabs

---

## SECTION 1: ADDING NEW USERS (3 Methods)

### METHOD 1️⃣: Add Single User (Recommended for 1-2 users)

**Steps:**
1. Go to Admin Dashboard → **Sales Associates** tab
2. Click **"+ Add User"** button
3. Fill in the form:
   - **Email** * (required) - e.g., john@adamshomes.com
   - **Name** * (required) - Full name as they want it displayed
   - **Division** - Office/location name
   - **Hire Date** - Start date (optional)
   - **Lasso Username** - Lasso CRM login
   - **Lasso Password** - Lasso CRM password
   - **Email Login** - Work email username
   - **Email Password** - Work email password
   - **FPG Training URL** - Link to their FPG training portal
4. Click **"Add User"**
5. **IMPORTANT:** System generates a temporary password - Share this with the employee
6. Employee logs in with their email + temporary password
7. Employee sets their own permanent password on first login

---

### METHOD 2️⃣: Bulk Import (For 3+ users at once)

**Steps:**
1. Go to Admin Dashboard → **Sales Associates** tab
2. Click **"📤 Bulk Import"** button
3. Prepare your data in this format (comma-separated):
   ```
   email,name,division,hireDate,lassoLogin,lassoPassword,emailLogin,emailPassword,fpgTrainingUrl
   john@example.com,John Doe,Sales Division,2026-06-01,john_lasso,lasso123,john@work.com,work123,https://fpg.example.com
   jane@example.com,Jane Smith,Marketing,2026-06-05,jane_lasso,lasso456,jane@work.com,work456,https://fpg.example.com
   ```
4. Paste the data into the text area (one line per user)
5. Click **"Import Users"**
6. System shows how many imported successfully and any errors
7. Each imported user gets a temporary password (track this!)

**CSV Field Order (EXACT):**
1. Email
2. Name
3. Division
4. Hire Date (YYYY-MM-DD format or leave blank)
5. Lasso Login username
6. Lasso password
7. Email login
8. Email password  
9. FPG Training URL

---

### METHOD 3️⃣: Employee Self-Signup

**For situations where you want employees to register themselves:**
1. Share the dashboard URL: https://adams-homes-dashboard.vercel.app
2. Employee clicks **"Sign Up"**
3. Employee enters email, password (they choose), name, division, hire date
4. Employee can start onboarding immediately
5. **NOTE:** You can still update their credentials later via the Admin Dashboard

---

## SECTION 2: MANAGING USERS AFTER CREATION

### Viewing All Users

1. Admin Dashboard → **Sales Associates** tab
2. Click **"📊 List View"** (shown by default)
3. See table with:
   - Name
   - Email
   - Division
   - Status (Active)

---

### Updating User Credentials

**Coming Soon:** Direct edit interface in the dashboard

**For Now:** You can:
- Re-add the user with correct info (system won't create duplicate if email exists)
- Contact your developer to update specific fields in the database

---

## SECTION 3: DASHBOARD TAB (Monitoring Progress)

**What you see:**
- **Total Sales Associates** - Number of employees in system
- **Completed Onboarding** - Employees who finished all 8 milestones
- **In Progress** - Currently onboarding employees
- **Questions Pending** - Unanswered employee questions

**Why it matters:** Quick overview of overall onboarding status

---

## SECTION 4: RESPONDING TO EMPLOYEE QUESTIONS

### View Questions
1. Admin Dashboard → **Questions** tab
2. See all employee questions with:
   - Employee name
   - Division
   - Question text
   - Status (Pending/Answered)
   - Date submitted

### Respond to Questions
1. Find the pending question
2. Click **"Respond"** button
3. Type your response in the text area
4. Click **"Send Response"**
5. Question marked as "Answered" with your response visible
6. Employee sees your response in their dashboard

**Response Tips:**
- Keep responses clear and actionable
- Use professional but friendly tone
- Reference specific resources if helpful

---

## SECTION 5: CONFIGURING TRAINING RESOURCES

### Adding Training Videos & Documents

1. Admin Dashboard → **Settings** tab
2. See two sections:
   - **Onboarding Milestones** (8 total)
   - **Marketing Lessons** (up to 10)

### For Each Milestone:
1. Click **"Edit"** next to the milestone
2. Add:
   - **Video URL** - Link to training video (YouTube, Vimeo, etc.)
   - **Resource URL** - Link to handbook, PDF, or documentation
3. Click **"Save"**
4. Employees see these links in their milestone cards

### For Marketing Lessons:
1. Click **"Edit"** next to each lesson
2. Add **Video URL** - Training video link
3. Click **"Save"**

---

## SECTION 6: THE 8 ONBOARDING MILESTONES

Every employee must complete these in order:

1. **SSP and Warrior Standards** - Sales plan basics and company standards
2. **CRM – Lasso** - Customer relationship management tool
3. **Our Website** - Digital properties and maintenance
4. **MLS for Success** - Real estate listing best practices
5. **Social Media & Marketing** - Brand guidelines and content
6. **Google (& Bing) Business Listings** - Local search optimization
7. **Customer Experience Expectations** - Service standards
8. **Prevent Lead Leakage** - Lead tracking and syndication

---

## SECTION 7: EMPLOYEE WORKFLOW (What They See)

### First Time Login:
1. Employee goes to https://adams-homes-dashboard.vercel.app
2. Click **"Sign Up"** OR is given their temporary password
3. If using temporary password:
   - Logs in with email + temp password
   - System prompts to set permanent password
4. See their dashboard with:
   - Welcome message
   - Profile info
   - Progress tracker (0/8 milestones)
   - All 8 milestone cards

### Completing Milestones:
1. Click on milestone card
2. Watch training video (if linked)
3. Review key points
4. Read documentation (if linked)
5. Mark as "Complete" when done
6. Progress bar updates
7. Once all 8 complete → Certificate of completion shows

### Asking Questions:
1. Click **"Questions"** section
2. Type their question
3. Submit
4. Admin sees it in the Questions tab
5. Admin responds
6. Employee gets notification and sees response

---

## SECTION 8: SECURITY & ACCESS CONTROL

### Admin Access Levels:
- **Full Admin** (current system)
  - Add/manage all users
  - Respond to questions
  - Configure resources
  - View all progress

### User Access Levels:
- **Employees** (read-only view of their own progress)
  - Cannot see other employees
  - Cannot access admin features
  - Can only modify their own password

### Password Security:
- All passwords encrypted in database
- Temporary passwords generated randomly
- Employees set their own permanent password on first login
- No passwords visible in admin interface

---

## SECTION 9: TROUBLESHOOTING

### "User already exists" error when importing
- **Cause:** Email already in system
- **Fix:** Remove that line from CSV or update the existing user instead

### Temporary password not working
- **Check:** Are you using the exact temporary password from the confirmation message?
- **Fix:** Refresh page, try again. Contact admin if persists.

### Video URLs not showing for employees
- **Check:** Is the URL correct and publicly accessible?
- **Fix:** Make sure it's a direct link to the video (not a page with the video)

### Employee can't log in
- **Check 1:** Is their email correct?
- **Check 2:** Are they using the temporary password or their own password?
- **Check 3:** Have they already set a permanent password?
- **Fix:** Have them reset via login page (coming soon) or contact admin

---

## SECTION 10: RECOMMENDED SETUP CHECKLIST

### Before Going Live:

- [ ] Add all employees (using one of the 3 methods above)
- [ ] Share the dashboard URL: https://adams-homes-dashboard.vercel.app
- [ ] Add training video URLs for all 8 milestones
- [ ] Add resource URLs (handbooks, guides) for milestones
- [ ] Add marketing lesson video URLs
- [ ] Test as an employee (create test account)
- [ ] Verify all links work from employee view
- [ ] Set up calendar reminder to check questions daily
- [ ] Brief your team on expectations (10-15 hours total over 1-2 weeks)

---

## SECTION 11: ONGOING MAINTENANCE

### Daily Tasks:
- Check Questions tab for pending questions
- Respond to questions same day
- Monitor new submissions

### Weekly Tasks:
- Review Dashboard overview
- Identify employees falling behind
- Send encouragement/check-ins to struggling employees
- Update any resource URLs if needed

### Monthly Tasks:
- Review overall completion rates
- Identify common questions/confusion
- Update training materials if needed
- Plan for new hires

---

## SECTION 12: SUPPORT & CONTACT

**Technical Issues:** Contact your developer
**Questions about process:** Refer to this guide
**Onboarding strategy:** Discuss with your team

---

## QUICK REFERENCE: URL & CREDENTIALS

**Dashboard URL:** https://adams-homes-dashboard.vercel.app
**Admin Login:** Yes, after entering credentials
**Employee Login:** Email + temporary password (first time) or their chosen password

---

**Last Updated:** June 25, 2026
**Version:** 2.0 - Full Admin Control
