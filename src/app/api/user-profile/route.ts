import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      level TEXT DEFAULT 'A2',
      confidence INTEGER DEFAULT 0,
      strengths JSONB DEFAULT '[]',
      weaknesses JSONB DEFAULT '[]',
      summary TEXT,
      recommended_goal TEXT,
      estimated_weeks INTEGER DEFAULT 12,
      assessment_done BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT * FROM user_profile WHERE id = 1`;
    if (rows.length === 0) {
      return NextResponse.json({ profile: null });
    }
    return NextResponse.json({ profile: rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const {
      name,
      level,
      confidence,
      strengths,
      weaknesses,
      summary,
      recommended_goal,
      estimated_weeks,
    } = body;

    await sql`
      INSERT INTO user_profile (id, name, level, confidence, strengths, weaknesses, summary, recommended_goal, estimated_weeks, assessment_done, updated_at)
      VALUES (1, ${name || ''}, ${level}, ${confidence}, ${JSON.stringify(strengths)}, ${JSON.stringify(weaknesses)}, ${summary}, ${recommended_goal}, ${estimated_weeks}, true, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        level = EXCLUDED.level,
        confidence = EXCLUDED.confidence,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        summary = EXCLUDED.summary,
        recommended_goal = EXCLUDED.recommended_goal,
        estimated_weeks = EXCLUDED.estimated_weeks,
        assessment_done = true,
        updated_at = NOW()
    `;

    // Also update progress_stats with the new level
    await sql`
      UPDATE progress_stats SET current_level = ${level}, updated_at = NOW() WHERE id = 1
    `.catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureTable();
    await sql`DELETE FROM user_profile WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
