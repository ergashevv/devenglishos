import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import openai from '@/lib/openai';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { transcript, prompt, audio_seconds } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert English speaking coach for a Uzbek software developer.
Analyze the following speaking sample and return ONLY valid JSON feedback.

Speaking Prompt: "${prompt || 'General speaking practice'}"
Transcript: "${transcript}"

Score each dimension strictly (0-100):
- fluency: smoothness, pace, lack of hesitation
- grammar: correctness of grammar structures
- vocabulary: range and appropriateness of vocabulary
- clarity: pronunciation clarity, understandability

Return EXACTLY this JSON:
{
  "scores": {
    "fluency": <number 0-100>,
    "grammar": <number 0-100>,
    "vocabulary": <number 0-100>,
    "clarity": <number 0-100>
  },
  "overall": <average of 4 scores>,
  "mistakes": [
    {
      "original": "...",
      "correction": "...",
      "explanation": "...(uzbek explanation)..."
    }
  ],
  "improved_version": "...(rewritten improved version of their speech in English)...",
  "strengths": ["...", "..."],
  "next_tasks": [
    {
      "focus": "grammar",
      "task": "...(specific English practice task)..."
    }
  ],
  "motivation": "...(short motivational message in Uzbek)..."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const feedbackText = completion.choices[0].message.content || '{}';
    const feedback = JSON.parse(feedbackText);

    const today = format(new Date(), 'yyyy-MM-dd');

    // Store speaking session
    await sql`
      INSERT INTO speaking_sessions (date, prompt, transcript, feedback, audio_seconds)
      VALUES (${today}, ${prompt || ''}, ${transcript}, ${JSON.stringify(feedback)}, ${audio_seconds || 0})
    `;

    // Update progress stats
    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const totalSessions = (progress?.total_speaking_sessions || 0) + 1;
    const currentAvg = parseFloat(progress?.average_speaking_score || '0');
    const newAvg = ((currentAvg * (totalSessions - 1)) + feedback.overall) / totalSessions;

    await sql`
      UPDATE progress_stats
      SET
        average_speaking_score = ${newAvg.toFixed(2)},
        total_speaking_sessions = ${totalSessions},
        total_minutes = total_minutes + ${Math.ceil((audio_seconds || 0) / 60)},
        updated_at = NOW()
      WHERE id = 1
    `;

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Speaking feedback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
