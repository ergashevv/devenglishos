import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import openai from '@/lib/openai';
import { format } from 'date-fns';

export async function GET() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // 1. Check if today's plan already exists (Caching)
    const [existingLog] = await sql`
      SELECT * FROM daily_logs WHERE date = ${today}
    `;

    if (existingLog?.plan) {
      return NextResponse.json(existingLog.plan);
    }

    // 2. Fetch context data for AI
    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const recentSpeaking = await sql`
      SELECT * FROM speaking_sessions ORDER BY date DESC LIMIT 5
    `;
    const [lastEval] = await sql`
      SELECT * FROM evaluations ORDER BY date DESC LIMIT 1
    `;

    // 3. Calculate metrics
    const lastActivity = progress?.last_activity_date;
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : 0;

    const streak = progress?.streak || 0;
    const avgScore = parseFloat(progress?.average_speaking_score || '0');
    const level = progress?.current_level || 'A2';

    // Grammar/fluency trends
    const grammarScores = recentSpeaking
      .map((s: any) => s.feedback?.scores?.grammar || 0)
      .filter((v: number) => v > 0);
    const fluencyScores = recentSpeaking
      .map((s: any) => s.feedback?.scores?.fluency || 0)
      .filter((v: number) => v > 0);

    const avgGrammar = grammarScores.length
      ? grammarScores.reduce((a: number, b: number) => a + b, 0) / grammarScores.length
      : 70;
    const avgFluency = fluencyScores.length
      ? fluencyScores.reduce((a: number, b: number) => a + b, 0) / fluencyScores.length
      : 70;

    const weaknesses: string[] = [];
    if (avgGrammar < 60) weaknesses.push('grammar');
    if (avgFluency < 50) weaknesses.push('fluency');

    const isMinimalDay = daysSinceActivity >= 2;
    const targetMinutes = isMinimalDay ? 15 : daysSinceActivity === 1 ? 30 : 45;

    // 4. Generate AI Plan
    const systemPrompt = `You are DevEnglish OS — an AI English mentor for a Uzbek software developer.
Generate a personalized daily English learning plan.
Return ONLY valid JSON.

Context:
- Level: ${level}
- Streak: ${streak} days
- Weaknesses: ${weaknesses.join(', ') || 'none'}
- Minimal mode: ${isMinimalDay}
- Target: ${targetMinutes} mins

Rules:
1. Tech/Dev related speaking prompt
2. Vocab: 3-5 tech/professional words
3. Task explanations in Uzbek, exercises in English

Return JSON:
{
  "date": "${today}",
  "focus": ["Listening", "Speaking"],
  "targetMinutes": ${targetMinutes},
  "missions": [
    {
      "id": "listening",
      "type": "listening",
      "title": "Listening Practice",
      "description": "Dev podkast eshitish (uzbek)",
      "task": "Listen to Syntax.fm (english)",
      "durationMinutes": 10,
      "completed": false
    },
    {
      "id": "vocab",
      "type": "vocabulary",
      "title": "Vocabulary Building",
      "description": "Yangi so'zlar",
      "words": [{"word": "resilient", "meaning": "bardoshli", "example": "System is resilient."}],
      "durationMinutes": 10,
      "completed": false
    }
  ],
  "speaking_prompt": "Explain how a React component works",
  "vocab": [{"word": "...", "meaning": "...", "example": "..."}],
  "homework": { "type": "writing", "prompt": "Write a PR description", "hint": "PR haqida (uzbek)" },
  "minimal_mode": { "active": ${isMinimalDay}, "task": "1 micro-task", "description": "Motivation (uzbek)" },
  "motivational_message": "Keep going! (uzbek)",
  "streak_bonus": ${streak >= 5}
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const plan = JSON.parse(completion.choices[0].message.content || '{}');

    // 5. Store in Cache (daily_logs)
    await sql`
      INSERT INTO daily_logs (date, plan) VALUES (${today}, ${JSON.stringify(plan)})
      ON CONFLICT (date) DO UPDATE SET plan = EXCLUDED.plan
    `;

    return NextResponse.json(plan);
  } catch (error) {
    console.error('today-plan error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
