# Soft Launch Readiness Checklist

**Target**: Ready to share with managers for soft launch testing  
**Status**: IN PROGRESS  
**Date**: June 16, 2026

---

## CRITICAL FIXES (Must Complete Before Launch)

### ✅ Terminology: "Employee" → "Sales Associate"
- [ ] app/page.tsx (login page) - FIXED
- [ ] app/dashboard/page.tsx  
- [ ] app/admin/page.tsx
- [ ] app/admin-login/page.tsx
- [ ] components/* (all components)
- [ ] All markdown documentation
- [ ] API response messages
- [ ] Email templates

### ⚠️ Image Loading Issues
- [ ] Logo not displaying in header
- [ ] Milestone thumbnails not showing
- [ ] Solution: Use verified image URLs or local images in public/

### Module Completion Requirements  
- [ ] Prevent marking modules complete until prerequisites done
- [ ] Add logic to sequence onboarding flow

### Admin Setup Page
- [ ] Create admin page showing AdminSetupChecklist
- [ ] Wire up to admin dashboard

---

## IMPORTANT FEATURES (Must Have for Soft Launch)

- [x] Logo in header (code ready, needs image)
- [x] Profile info display (name, division, hire date, manager)
- [x] Credentials section
- [x] 543 Training schedule
- [x] Progress legend
- [x] Milestone cards with thumbnails
- [x] Marketing lessons section
- [x] Certificate of completion
- [x] Progress tracking

---

## KNOWN ISSUES TO FIX

1. **Image URLs not loading**
   - Unsplash URLs may not be accessible
   - Logo path needs public/logo.png
   - Solution: Use verified working images

2. **Thumbnails missing on milestones**
   - Code is there but images not loading
   - Status: Code ready, needs image URLs

3. **FPG Training section** 
   - Shows "Contact manager" when not configured
   - Correct behavior

4. **Module sequencing**
   - Currently all modules independent
   - Should prevent completion until previous done?
   - NEEDS USER INPUT on requirements

---

## DEPLOYMENT PREP

- [ ] Deploy to Vercel (free tier)
- [ ] Test on deployed URL
- [ ] Create shareable link for managers
- [ ] Final QA testing

---

## SOFT LAUNCH DELIVERABLE

When complete, user will receive:
- ✅ Web link to dashboard (Vercel hosting)
- ✅ Admin setup checklist
- ✅ Working demo account
- ✅ Manager testing instructions
- ✅ All terminology fixed to "Sales Associate"

---

## DEPENDENCIES

- [ ] Adams Homes logo file (public/logo.png)
- [ ] Clarification on module prerequisites
- [ ] Working image URLs for thumbnails
