import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import openai from '@/lib/openai';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { submission, prompt } = await req.json();

    if (!submission) {
      return NextResponse.json({ error: 'Submission required' }, { status: 400 });
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    const systemPrompt = `You are an English writing coach for a Uzbek software developer.
Evaluate the following writing submission and return ONLY valid JSON.

Writing Prompt: "${prompt || 'General writing task'}"
Submission: "${submission}"

Return EXACTLY this JSON:
{
  "scores": {
    "grammar": <0-100>,
    "structure": <0-100>,
    "vocabulary": <0-100>,
    "clarity": <0-100>
  },
  "overall": <average>,
  "mistakes": [
    {
      "original": "...",
      "correction": "...",
      "explanation": "...(uzbek explanation)..."
    }
  ],
  "improved_version": "...(polished version of their writing in English)...",
  "strengths": ["...", "..."],
  "tips": ["...(uzbek tip)...", "..."]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    const feedbackText = completion.choices[0].message.content || '{}';
    const feedback = JSON.parse(feedbackText);

    // Store in daily log notes
    await sql`
      UPDATE daily_logs
      SET notes = ${JSON.stringify({ writing_submission: submission, feedback })}
      WHERE date = ${today}
    `;

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Writing feedback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
