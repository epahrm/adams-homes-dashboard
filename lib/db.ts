import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:AdamsHomes1991!@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

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
