import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

let databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:AdamsHomes1991%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?schema=public'

console.log('[DB] DATABASE_URL env:', !!process.env.DATABASE_URL)
console.log('[DB] NODE_ENV:', process.env.NODE_ENV)

// Handle password encoding - ensure special characters are URL-encoded
if (databaseUrl.includes('AdamsHomes1991!')) {
  databaseUrl = databaseUrl.replace('AdamsHomes1991!', 'AdamsHomes1991%21')
}

// Add SSL mode if not present - use prefer to allow non-SSL if needed
if (!databaseUrl.includes('sslmode=')) {
  databaseUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=prefer'
}

console.log('[DB] Final URL host:', databaseUrl.split('@')[1]?.split(':')[0])
console.log('[DB] Final URL port:', databaseUrl.match(/:(\d+)(?:[/?]|$)/)?.[1])

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  globalForPrisma.prisma = prisma
}
