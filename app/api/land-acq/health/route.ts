import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');

  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      ADMIN_KEY_SET: !!process.env.ADMIN_KEY,
    },
    database: { status: 'unknown', error: null as string | null },
  };

  // Try to connect to database
  if (process.env.DATABASE_URL) {
    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      checks.database.status = 'connected';
    } catch (err: any) {
      checks.database.status = 'error';
      checks.database.error = err.message;
    }
  } else {
    checks.database.status = 'skipped';
    checks.database.error = 'DATABASE_URL not set';
  }

  return NextResponse.json(checks);
}
