# To-Do List - Next Revision

## Priority 1: Terminology Updates

### Change "Employee" to "Sales Associate"
- [ ] Update all references from "employee" to "Adams Homes Sales Associate"
- [ ] Check these files:
  - [ ] `app/page.tsx` - Login/signup page
  - [ ] `app/dashboard/page.tsx` - Dashboard header & messages
  - [ ] `app/admin/page.tsx` - Admin dashboard text
  - [ ] `components/MilestoneCard.tsx` - Card labels
  - [ ] `README.md` - Documentation
  - [ ] `QUICKSTART.md` - Setup guide
  - [ ] All other documentation files
  - [ ] Error messages
  - [ ] Email templates in `lib/email.ts`
  - [ ] Database comments/descriptions

### Examples of changes needed:
```
CHANGE FROM          →    CHANGE TO
"Employee"           →    "Sales Associate"
"employee dashboard" →    "Sales Associate Dashboard"
"all employees"      →    "all Sales Associates"
"new employee"       →    "new Sales Associate"
"your employees"     →    "your Sales Associates"
```

---

## Priority 2: UI/UX Improvements

- [ ] Add Adams Homes logo to header
- [ ] Add president's welcome video section on dashboard
- [ ] Credentials section display (Email, Lasso, FPG Training)
- [ ] Progress legend at top with checkmarks
- [ ] Hire date display on dashboard
- [ ] Division name display on dashboard

---

## Priority 3: Admin Dashboard

- [ ] Complete admin dashboard (currently 30% done)
- [ ] Build Analytics tab with charts
- [ ] Build Sales Associates management tab
- [ ] Add search/filter functionality
- [ ] Create manager dashboard (view their team)

---

## Priority 4: Email Integration

- [ ] Test SendGrid integration with real API key
- [ ] Verify manager notifications sending correctly
- [ ] Test question submission emails
- [ ] Create email templates (HTML)
- [ ] Test welcome emails for new accounts

---

## Priority 5: Bug Fixes

- [ ] Fix html2canvas dependency issue (currently removed - use print function)
- [ ] Verify all API endpoints work correctly
- [ ] Test with multiple concurrent users
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

---

## Priority 6: Production Readiness

- [ ] Add logo.png to public folder
- [ ] Configure president's welcome video URL
- [ ] Set up SendGrid API key
- [ ] Switch database to PostgreSQL for production
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Create production environment file (.env.production)
- [ ] Set up error logging/monitoring
- [ ] Performance optimization
- [ ] Security audit

---

## Priority 7: Testing

- [ ] Unit tests for API endpoints
- [ ] Integration tests for user flows
- [ ] Load testing (concurrent users)
- [ ] UAT with actual Sales Associates
- [ ] Admin UAT with managers
- [ ] Mobile device testing

---

## Notes

**Date Created:** June 16, 2026  
**Last Updated:** [Date]  
**Status:** Pending revision  

---

## Completed Items (Don't change these)

✅ Core onboarding milestones (8 topics)  
✅ Progress tracking  
✅ Marketing lessons (YouTube integration)  
✅ Certificate generation  
✅ Admin login & dashboard  
✅ Question submission system  
✅ 34 divisions configured  
✅ Manager email integration  
✅ Responsive design  
✅ Documentation  

---

## Questions for Next Session

1. Should we implement an admin approval system for questions before sending to managers?
2. Do we need to add role-based permissions (Super Admin vs Division Admin)?
3. Should Sales Associates be able to edit their profile after signup?
4. Do we need compliance/audit logging?
5. Should there be a "manager approval" step before Sales Associate completes training?

---

## Revision Schedule

- **v1.0.0** (Current) - MVP with core features
- **v1.1.0** - Fix terminology, add logo/videos, complete admin dashboard
- **v1.2.0** - Email integration, testing, production setup
- **v2.0.0** - Advanced features (analytics, manager portal, integrations)
