import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import openai from '@/lib/openai';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const today = format(new Date(), 'yyyy-MM-dd');

    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const level = progress?.current_level || 'A2';

    const systemPrompt = `You are a CEFR English evaluator for a Uzbek software developer.
Conduct a 14-day mini English test. Return ONLY valid JSON.

Current estimated level: ${level}
Test components: listening comprehension, grammar, writing, vocabulary

Return EXACTLY this JSON:
{
  "test_type": "mini_test",
  "date": "${today}",
  "sections": {
    "listening": {
      "score": <0-100>,
      "questions": [
        {
          "question": "...(English question about a listening activity)...",
          "correct_answer": "...",
          "tips": "...(uzbek tip)..."
        }
      ]
    },
    "grammar": {
      "score": <0-100>,
      "questions": [
        {
          "question": "...(fill in the blank or multiple choice in English)...",
          "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
          "correct": "...",
          "explanation": "...(uzbek explanation)..."
        }
      ]
    },
    "vocabulary": {
      "score": <0-100>,
      "words_tested": ["word1", "word2", "word3"],
      "feedback": "...(uzbek vocabulary feedback)..."
    },
    "writing": {
      "prompt": "...(English writing prompt)...",
      "evaluation_tips": ["...", "..."]
    }
  },
  "overall_score": <0-100>,
  "estimated_level": "A2|B1|B2|C1",
  "skill_breakdown": {
    "grammar": <0-100>,
    "vocabulary": <0-100>,
    "listening": <0-100>,
    "speaking": <0-100>
  },
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...(uzbek recommendation)...", "..."],
  "next_focus_areas": ["grammar", "fluency"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const resultText = completion.choices[0].message.content || '{}';
    const result = JSON.parse(resultText);

    // Store evaluation
    await sql`
      INSERT INTO evaluations (date, kind, result)
      VALUES (${today}, 'mini_test', ${JSON.stringify(result)})
    `;

    // Update level in progress stats
    if (result.estimated_level) {
      await sql`
        UPDATE progress_stats
        SET current_level = ${result.estimated_level}, updated_at = NOW()
        WHERE id = 1
      `;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Mini test error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
