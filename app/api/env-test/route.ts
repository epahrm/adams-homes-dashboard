import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasDBUrl: !!process.env.DATABASE_URL,
    dbUrlStart: process.env.DATABASE_URL?.substring(0, 80),
    nodeEnv: process.env.NODE_ENV,
    hasPool: process.env.DATABASE_URL?.includes('pooler'),
  })
}
