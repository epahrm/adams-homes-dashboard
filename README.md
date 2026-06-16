# Adams Homes Employee Onboarding Dashboard

A modern, interactive onboarding dashboard for Adams Homes employees to track and complete their onboarding milestones.

## Features

- 🔐 User authentication with secure login/signup
- 📋 8 comprehensive onboarding milestones
- ✅ Progress tracking and completion status
- 📊 Visual progress bar
- 📱 Responsive design
- 🎨 Professional branding with Adams Homes colors

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js with Next.js API routes
- **Database**: SQLite (Prisma ORM)
- **Authentication**: Custom JWT-based auth with bcrypt

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Installation

1. Clone or navigate to the project directory:
```bash
cd "C:\Users\elizp\OneDrive\Documents\Claude Lot Dashboard"
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database and seed with demo data:
```bash
npm run db:push
npm run db:seed
```

### Running the Application

Development mode:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Demo Credentials

Use these credentials to test the application:
- **Email**: demo@example.com
- **Password**: password123

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/route.ts          # Authentication endpoints
│   │   └── milestones/route.ts    # Milestone CRUD endpoints
│   ├── dashboard/
│   │   └── page.tsx               # Main dashboard page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Login/signup page
├── components/
│   └── MilestoneCard.tsx           # Milestone component
├── lib/
│   ├── auth.ts                    # Authentication utilities
│   └── db.ts                      # Database client
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed script for demo data
└── package.json
```

## Onboarding Milestones

1. **SSP and Warrior Standards** - Sales planning and company standards
2. **CRM – Lasso** - Customer relationship management system
3. **Our Website** - Digital presence and maintenance
4. **MLS for Success** - Real estate listing optimization
5. **Social Media & Marketing** - Brand guidelines and strategies
6. **Google (& Bing) Business Listings** - Search engine optimization
7. **Customer Experience Expectations** - Service standards
8. **Prevent Lead Leakage** - Lead management and tracking

## Environment Variables

Update `.env.local` with your configuration:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Building for Production

```bash
npm run build
npm start
```

## Adding New Milestones

Edit `prisma/seed.ts` and add new milestones to the array, then:

```bash
npm run db:seed
```

## Customization

### Update Resource Links

Edit the milestone data in `prisma/seed.ts` to add actual resource URLs:
- `resourceUrl` - Link to checklists and materials
- `videoUrl` - Link to video training

### Update Branding Colors

Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#1a5490',    // Adams Homes blue
  secondary: '#f39200',  // Adams Homes orange
}
```

## Troubleshooting

### Database Issues
If you encounter database issues:
```bash
rm dev.db
npm run db:push
npm run db:seed
```

### Port Already in Use
Change the port:
```bash
npm run dev -- -p 3001
```

## Support

For issues or questions, contact the development team.
