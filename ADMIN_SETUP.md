# Adams Homes Sales Associate Onboarding Dashboard
## Admin Setup & Operations Guide

**Live URL:** https://adams-homes-dashboard.vercel.app

---

## 🔐 Admin Access

### Admin Login
- **URL:** https://adams-homes-dashboard.vercel.app/admin-login
- **Username (Email):** Contact Elizabeth for credentials
- **Password:** Contact Elizabeth for credentials

### Employee Login  
- **URL:** https://adams-homes-dashboard.vercel.app
- **Demo Account:** demo@example.com / password123

---

## 📋 Admin Dashboard Features

### 1. Dashboard Tab
- View employee progress across all 8 milestones
- See completion statistics
- Monitor training progress in real-time

### 2. Questions Tab
- View questions submitted by employees
- Provide responses to employee questions
- Mark questions as answered

### 3. Associates Tab
- **Add Single Employee:**
  - Email
  - Full Name
  - Division (e.g., "Austin, TX")
  - Hire Date (optional)
  - Lasso Login credentials (optional)
  - Email Login credentials (optional)
  - FPG Training URL (optional)

- **Bulk Import Employees (CSV):**
  - Upload CSV file with multiple employees
  - Columns: email, name, division, hireDate, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl
  - Returns: Temporary passwords for each new employee
  - Share temp passwords with employees securely

### 4. Settings Tab
- Configure training video URLs for each of 8 milestones
- Configure resource URLs for each milestone
- Configure marketing lesson video URLs and durations
- Changes apply immediately to all employees

---

## 👥 Employee Management Workflow

### Adding a Single Employee
1. Go to **Associates** tab
2. Click **"Add New Employee"**
3. Fill in required fields:
   - Email (required)
   - Name (required)
   - Division
   - Hire Date
   - Optional: Lasso/Email credentials, FPG Training URL
4. System generates temporary password
5. Share temp password with employee via secure channel
6. Employee logs in and creates their own password

### Bulk Adding Employees (CSV)
1. Prepare CSV file with columns:
   ```
   email,name,division,hireDate,lassoLogin,lassoPassword,emailLogin,emailPassword,fpgTrainingUrl
   jane.doe@example.com,Jane Doe,Austin TX,2026-06-24,lasso_user,lasso_pass,jane@email.com,email_pass,https://fpg.example.com
   ```
2. Go to **Associates** tab → **Bulk Import**
3. Upload CSV file
4. System displays:
   - How many imported successfully
   - Temporary passwords for each
   - Any errors with row numbers
5. Export results and share passwords with employees

### Viewing Employee Information
- Click employee name in Associates tab to see:
  - Profile details
  - Milestone progress
  - Hired date
  - Associated credentials (masked)

---

## 🎓 Training Configuration

### Setting Up Milestone Training

**8 Milestones to Configure:**
1. Orientation & Company Culture
2. Sales Process & Systems
3. Product Knowledge
4. CRM & Tools Training
5. Client Communication
6. Compliance & Regulations
7. Advanced Sales Techniques
8. Performance Metrics & Reporting

**For Each Milestone:**
1. Go to **Settings** tab
2. Enter **Video URL** (YouTube/Vimeo link)
3. Enter **Resource URL** (PDF, document, or web link)
4. Click Save
5. Changes appear immediately for all employees

### Marketing Lessons
- Configure separate video URLs for marketing training
- Set video duration (e.g., "15 minutes")
- Employees access from dashboard

---

## 📞 Common Admin Tasks

### Task: Check Employee Progress
1. Go to **Dashboard** tab
2. View employee completion % by milestone
3. Identify employees who need follow-up

### Task: Answer Employee Questions
1. Go to **Questions** tab
2. Read pending employee questions
3. Type response
4. Mark as "Answered"
5. Employee receives notification

### Task: Update Training Resources
1. Go to **Settings** tab
2. Find the milestone
3. Update Video URL or Resource URL
4. Save
5. All employees see updated resource immediately

### Task: Add Missing Employee Info
1. Go to **Associates** tab
2. Click employee name
3. Click "Edit" button
4. Update fields (Lasso login, Email login, FPG Training URL)
5. Save
6. Changes apply immediately

### Task: Deactivate Employee (Future Feature)
- Currently: Employees remain in system but can deactivate their own account
- Contact Elizabeth for deactivation management

---

## 🔒 Data & Security

### Employee Data Stored
- Email, Name, Division, Hire Date
- Optional: Lasso login, Email login, FPG Training URL
- Milestone completion status
- Question submissions
- Password (hashed, never shown)

### Passwords
- Employee passwords are hashed (never shown to admins)
- Temporary passwords generated randomly (12 characters)
- Share via secure channel only
- Employees create their own permanent password on first login

### Access Control
- Admin accounts: Only admins can manage users
- Employee accounts: Only see their own milestones
- No cross-employee data visibility

---

## ⚠️ Important Notes

### Before Going Live
- [ ] Test with demo account: demo@example.com / password123
- [ ] Configure all 8 milestone video URLs
- [ ] Configure all 8 milestone resource URLs
- [ ] Add all current employees (single or bulk import)
- [ ] Test password reset/employee login flow
- [ ] Verify milestone descriptions are clear
- [ ] Set up response templates for common questions
- [ ] Brief employee team on login process

### Ongoing Maintenance
- Check **Questions** tab weekly
- Monitor **Dashboard** for employees falling behind
- Update training resources as needed
- Add new employees within 24 hours of hire

### Support Contact
- For technical issues: Contact Elizabeth
- For login/password reset: Verify employee email, reset in system
- For feature requests: Contact Elizabeth

---

## 🆘 Troubleshooting

### Employee Can't Login
1. Verify email address is correct (case-sensitive)
2. Check if password is correct (case-sensitive)
3. If forgotten: Admin can generate new temp password in Associates tab
4. Share new temp password via secure channel

### Missing Employee Data
1. Go to Associates tab
2. Click employee name
3. Click Edit
4. Fill in missing fields (Lasso, Email, FPG URLs)
5. Save

### Video/Resource URL Not Showing
1. Go to Settings tab
2. Verify URL is correct (starts with http:// or https://)
3. Test URL in new browser tab
4. Save again
5. Refresh employee browser (Ctrl+Shift+R for full refresh)

### Questions Not Showing
- Check if questions have been answered
- Filter by "Pending" to see unanswered only
- Refresh page (Ctrl+R)

---

## 📊 CSV Format Reference

For bulk importing employees, use this CSV format:

```csv
email,name,division,hireDate,lassoLogin,lassoPassword,emailLogin,emailPassword,fpgTrainingUrl
john.smith@email.com,John Smith,Austin TX,2026-06-15,jsmith_lasso,lassoPass123,john.smith@email.com,emailPass456,https://fpg.training.com/john
jane.doe@email.com,Jane Doe,Dallas TX,2026-06-20,jdoe_lasso,lassoPass789,jane.doe@email.com,emailPass012,https://fpg.training.com/jane
```

**Notes:**
- Email and Name are required (others optional)
- Dates should be in YYYY-MM-DD format
- If no data for optional field, leave empty (don't delete column)
- Passwords are hashed on import, never stored in plain text
- System generates temporary password for each employee

---

**Last Updated:** June 24, 2026
**Version:** 1.0
**Status:** Production Ready
