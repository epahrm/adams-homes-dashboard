# Quick Start Guide - Adams Homes Onboarding Dashboard

Get the dashboard running in 5 minutes!

## Step 1: Install Dependencies (1 min)

Open PowerShell or Command Prompt in the project folder and run:

```
npm install
```

## Step 2: Set Up Database (1 min)

```
npm run db:push
npm run db:seed
```

This creates the database and populates it with sample milestones.

## Step 3: Start the Development Server (1 min)

```
npm run dev
```

You should see:
```
> next dev

▲ Next.js 15.1.0
  - Local:        http://localhost:3000
```

## Step 4: Access the Dashboard

Open your browser and go to: **http://localhost:3000**

## Step 5: Log In with Demo Account

Use these credentials:
- **Email**: demo@example.com
- **Password**: password123

## What You'll See

✅ Welcome page with login/signup  
✅ Dashboard with 8 onboarding milestones  
✅ Progress tracking with percentage  
✅ Expandable milestone details  
✅ Ability to mark milestones complete  

## Next Steps

### Update Resource Links

Edit `prisma/seed.ts` and change the `resourceUrl` and `videoUrl` fields to point to your actual:
- Checklist links
- Video training URLs
- Brand kit links

Example:
```typescript
resourceUrl: 'https://your-domain.com/checklists',
videoUrl: 'https://your-domain.com/training-video',
```

After updating, re-seed the database:
```
npm run db:seed
```

### Create Your Own Account

Click "Sign Up" on the login page to create a new employee account.

### Deploy to Production

When ready to deploy:
1. Switch from SQLite to PostgreSQL (edit `prisma/schema.prisma`)
2. Set production environment variables
3. Run `npm run build` then `npm start`

## Troubleshooting

**"Port 3000 already in use?"**
```
npm run dev -- -p 3001
```

**"Database errors?"**
```
rm dev.db
npm run db:push
npm run db:seed
```

**"Changes not showing?"**
Hard refresh the browser (Ctrl+Shift+R on Windows)

## File Structure

- `app/page.tsx` - Login/signup page
- `app/dashboard/page.tsx` - Main dashboard
- `components/MilestoneCard.tsx` - Milestone component
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Milestone data

## Database Commands

- `npm run db:push` - Sync schema with database
- `npm run db:studio` - Open visual database editor
- `npm run db:seed` - Populate with sample data

## Questions?

Check README.md for detailed documentation.
