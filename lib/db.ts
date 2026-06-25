import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

let databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:AdamsHomes1991!@db.tbzuajwitwonwojqshew.supabase.co:5432/postgres'

// Handle password encoding - ensure special characters are URL-encoded
if (databaseUrl.includes('AdamsHomes1991!')) {
  databaseUrl = databaseUrl.replace('AdamsHomes1991!', 'AdamsHomes1991%21')
}

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
