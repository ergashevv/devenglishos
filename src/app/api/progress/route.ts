import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { format } from 'date-fns';

// POST: Log completion of a mission/task
export async function POST(req: NextRequest) {
  try {
    const { missionType, listeningMinutes, speakingMinutes, vocab, notes, minimalMode } =
      await req.json();

    const today = format(new Date(), 'yyyy-MM-dd');

    // Upsert today's daily log
    await sql`
      INSERT INTO daily_logs (date, listening_minutes, speaking_minutes, vocab, notes, minimal_mode_used)
      VALUES (
        ${today},
        ${listeningMinutes || 0},
        ${speakingMinutes || 0},
        ${JSON.stringify(vocab || [])},
        ${notes || ''},
        ${minimalMode || false}
      )
      ON CONFLICT (date) DO UPDATE SET
        listening_minutes = daily_logs.listening_minutes + EXCLUDED.listening_minutes,
        speaking_minutes = daily_logs.speaking_minutes + EXCLUDED.speaking_minutes,
        vocab = daily_logs.vocab || EXCLUDED.vocab,
        notes = COALESCE(EXCLUDED.notes, daily_logs.notes),
        minimal_mode_used = EXCLUDED.minimal_mode_used OR daily_logs.minimal_mode_used,
        completed = TRUE
    `;

    // Update progress_stats
    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const lastDate = progress?.last_activity_date;
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    let newStreak = progress?.streak || 0;

    if (!lastDate || lastDate === yesterday || lastDate === today) {
      // Continuing streak
      if (lastDate !== today) {
        newStreak = newStreak + 1;
      }
    } else {
      // Streak broken — reset
      newStreak = 1;
    }

    const totalVocab = (progress?.total_vocab_learned || 0) + (vocab?.length || 0);

    await sql`
      UPDATE progress_stats SET
        streak = ${newStreak},
        total_minutes = total_minutes + ${(listeningMinutes || 0) + (speakingMinutes || 0)},
        last_activity_date = ${today},
        total_vocab_learned = ${totalVocab},
        updated_at = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({ ok: true, streak: newStreak, today });
  } catch (error) {
    console.error('Log progress error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET: Fetch progress dashboard data
export async function GET() {
  try {
    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const recentLogs = await sql`
      SELECT * FROM daily_logs ORDER BY date DESC LIMIT 30
    `;
    const recentSpeaking = await sql`
      SELECT * FROM speaking_sessions ORDER BY date DESC LIMIT 10
    `;
    const evaluations = await sql`
      SELECT * FROM evaluations ORDER BY date DESC LIMIT 5
    `;

    return NextResponse.json({
      progress,
      recentLogs,
      recentSpeaking,
      evaluations,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
