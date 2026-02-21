import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import openai from '@/lib/openai';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [progress] = await sql`SELECT * FROM progress_stats WHERE id = 1`;
    const level = progress?.current_level || 'A2';
    const avgScore = parseFloat(progress?.average_speaking_score || '0');

    const systemPrompt = `You are a mock technical English interview coach for a Uzbek software developer.
Conduct a comprehensive mock interview evaluation. Return ONLY valid JSON.

Developer profile:
- English level: ${level}
- Average speaking score: ${avgScore}

Return EXACTLY this JSON:
{
  "interview_type": "mock_interview",
  "date": "${today}",
  "sections": {
    "technical": {
      "questions": [
        {
          "question": "...(technical English question about programming/software)...",
          "ideal_answer_points": ["...", "..."],
          "vocabulary_to_use": ["...", "..."]
        }
      ],
      "score": <0-100>,
      "feedback": "...(uzbek feedback)..."
    },
    "behavioral": {
      "questions": [
        {
          "question": "...(behavioral English question, STAR format)...",
          "ideal_structure": "...",
          "tips": "...(uzbek tip)..."
        }
      ],
      "score": <0-100>,
      "feedback": "...(uzbek feedback)..."
    },
    "communication": {
      "score": <0-100>,
      "strengths": ["...", "..."],
      "improvements": ["...", "..."]
    }
  },
  "overall_readiness_score": <0-100>,
  "readiness_label": "Not Ready|Needs Work|Almost Ready|Interview Ready",
  "weakness_report": {
    "critical": ["...(uzbek critical weakness)..."],
    "moderate": ["...(uzbek moderate weakness)..."],
    "minor": ["..."]
  },
  "improvement_plan": {
    "week_1": ["...(daily task in English)..."],
    "week_2": ["...(daily task in English)..."]
  },
  "daily_practice_tasks": [
    {
      "day": 1,
      "task": "...(English task)...",
      "duration": "15 min"
    }
  ],
  "motivation": "...(uzbek motivational message)..."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const resultText = completion.choices[0].message.content || '{}';
    const result = JSON.parse(resultText);

    // Store evaluation
    await sql`
      INSERT INTO evaluations (date, kind, result)
      VALUES (${today}, 'mock_interview', ${JSON.stringify(result)})
    `;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Mock interview error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
