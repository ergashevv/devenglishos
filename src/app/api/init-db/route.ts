import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';

export async function POST() {
  try {
    await initDB();
    return NextResponse.json({ ok: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('DB Init error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
