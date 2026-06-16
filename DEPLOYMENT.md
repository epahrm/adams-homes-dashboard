# Deployment Guide

## Deploying to Vercel (Recommended)

### Step 1: Connect Repository
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Vercel will auto-detect Next.js

### Step 2: Set Environment Variables
In Vercel dashboard, add:
```
DATABASE_URL = your-postgresql-url
NEXTAUTH_SECRET = generate-with: openssl rand -base64 32
NEXTAUTH_URL = https://your-domain.com
```

### Step 3: Switch Database to PostgreSQL
Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 4: Deploy
```bash
git push
```

Vercel will automatically deploy on push.

## Switching from SQLite to PostgreSQL

### Option A: Use Supabase (Free Tier Available)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string to `DATABASE_URL` in `.env.local`
4. Run `npm run db:push`

### Option B: Use Railway, PlanetScale, or Other Providers
Each has similar connection string format.

## Production Checklist

- [ ] Switch to PostgreSQL database
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Update resource URLs in `prisma/seed.ts`
- [ ] Test login/signup with real email validation
- [ ] Set up error monitoring (Sentry, DataDog)
- [ ] Enable HTTPS
- [ ] Set up backups
- [ ] Configure admin dashboard for managing milestones

## Environment Variables Reference

```
# Required for production
DATABASE_URL=              # PostgreSQL connection string
NEXTAUTH_SECRET=           # Secure random string (32+ chars)
NEXTAUTH_URL=              # Your production URL

# Optional
NODE_ENV=production
```

## Monitoring

Add error tracking to `app/layout.tsx`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Scaling Considerations

- Database: PostgreSQL handles 10k+ concurrent users
- API rate limiting: Add middleware if needed
- CDN: Enable Vercel Edge for static content
- Sessions: Currently stored in database

## Need to Add Authentication Features?

Current implementation uses simple email/password. To add:
- Email verification: Add verified flag to User model
- Password reset: Add token-based flow
- OAuth (Google, GitHub): Use NextAuth.js providers
- Two-factor authentication: Add TOTP support

## Contact & Support

For deployment assistance, contact your development team.
