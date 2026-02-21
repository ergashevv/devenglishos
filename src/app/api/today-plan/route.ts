import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import openai from '@/lib/openai';
import { format, subDays } from 'date-fns';

export async function GET() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Check if today's plan already exists in daily_logs
    const [existingLog] = await sql`
      SELECT * FROM daily_logs WHERE date = ${today}
    `;

    // Fetch context data
    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const recentLogs = await sql`
      SELECT * FROM daily_logs ORDER BY date DESC LIMIT 7
    `;
    const recentSpeaking = await sql`
      SELECT * FROM speaking_sessions ORDER BY date DESC LIMIT 5
    `;
    const lastEval = await sql`
      SELECT * FROM evaluations ORDER BY date DESC LIMIT 1
    `;

    // Calculate skip days for habit control
    const lastActivity = progress?.last_activity_date;
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : 0;

    const streak = progress?.streak || 0;
    const avgScore = parseFloat(progress?.average_speaking_score || '0');
    const level = progress?.current_level || 'A2';

    // Determine grammar/fluency weaknesses
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

    const systemPrompt = `You are DevEnglish OS — an AI English mentor for a Uzbek software developer.
Generate a personalized daily English learning plan.
Return ONLY valid JSON, no markdown, no explanation.

Context:
- Today: ${today}
- Current level: ${level}
- Streak: ${streak} days
- Days since last activity: ${daysSinceActivity}
- Average speaking score: ${avgScore}
- Weaknesses identified: ${weaknesses.join(', ') || 'none'}
- Average grammar score (recent): ${avgGrammar.toFixed(0)}
- Average fluency score (recent): ${avgFluency.toFixed(0)}
- Minimal mode needed: ${isMinimalDay}
- Target minutes: ${targetMinutes}
- Last evaluation: ${lastEval[0] ? JSON.stringify(lastEval[0].result).slice(0, 200) : 'none'}

Rules:
1. Focus on weaknesses if identified
2. If minimal mode: only assign 1 micro-task (2 min vocab + 1 sentence)
3. Speaking prompt MUST be tech/developer related (e.g., explain a concept, describe a project)
4. Vocab: 3-5 words relevant to software development or professional English
5. Writing: short practical task (email, message, explanation)
6. IMPORTANT: task explanations in Uzbek, actual exercises in English

Return this EXACT JSON structure:
{
  "date": "${today}",
  "focus": ["Listening", "Speaking"],
  "targetMinutes": ${targetMinutes},
  "missions": [
    {
      "id": "listening",
      "type": "listening",
      "title": "Listening Practice",
      "description": "...(uzbek description)...",
      "task": "...(english instructions)...",
      "durationMinutes": 10,
      "completed": false
    },
    {
      "id": "vocab",
      "type": "vocabulary",
      "title": "Vocabulary Building",
      "description": "...",
      "words": [{"word": "...", "meaning": "...(uzbek)", "example": "...(english)"}],
      "durationMinutes": 10,
      "completed": false
    },
    {
      "id": "speaking",
      "type": "speaking",
      "title": "Speaking Practice",
      "description": "...",
      "durationMinutes": 15,
      "completed": false
    },
    {
      "id": "writing",
      "type": "writing",
      "title": "Writing Homework",
      "description": "...",
      "task": "...(english writing prompt)...",
      "durationMinutes": 10,
      "completed": false
    }
  ],
  "speaking_prompt": "...(English prompt for speaking practice)...",
  "vocab": [{"word": "...", "meaning": "...(uzbek)", "example": "...(english sentence)"}],
  "homework": {
    "type": "writing",
    "prompt": "...(english task)...",
    "hint": "...(uzbek hint)..."
  },
  "minimal_mode": {
    "active": ${isMinimalDay},
    "task": "...(1 micro-task in English)...",
    "description": "...(uzbek motivation)..."
  },
  "motivational_message": "...(uzbek motivational message based on streak)...",
  "streak_bonus": ${streak >= 5 ? 'true' : 'false'}
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const planText = completion.choices[0].message.content || '{}';
    const plan = JSON.parse(planText);

    // Store or update today's log placeholder
    if (!existingLog) {
      await sql`
        INSERT INTO daily_logs (date) VALUES (${today})
        ON CONFLICT (date) DO NOTHING
      `;
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('today-plan error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
