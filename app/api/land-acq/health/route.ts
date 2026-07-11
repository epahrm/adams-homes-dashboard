import { NextRequest, NextResponse } from 'next/server';

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
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { error } = await supabase.from('land_acq_lots').select('count()', { count: 'exact', head: true });

      if (error) {
        checks.database.status = 'error';
        checks.database.error = error.message;
      } else {
        checks.database.status = 'connected';
      }
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
