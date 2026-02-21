import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import sql from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS homework_sessions (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      level TEXT NOT NULL DEFAULT 'B1',
      type TEXT NOT NULL,
      title TEXT,
      instructions TEXT,
      exercises JSONB DEFAULT '[]',
      user_answers JSONB DEFAULT '{}',
      feedback JSONB,
      score INTEGER,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET(req: NextRequest) {
  try {
    await ensureTables();
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    const rows = await sql`
      SELECT * FROM homework_sessions WHERE date = ${date} ORDER BY created_at DESC LIMIT 1
    `;

    if (rows.length > 0) {
      return NextResponse.json({ session: rows[0] });
    }
    return NextResponse.json({ session: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const body = await req.json();
    const { action, level, type, sessionId, answers } = body;

    if (action === 'generate') {
      const hwType = type || ['grammar', 'reading', 'vocabulary_quiz', 'translation'][Math.floor(Math.random() * 4)];

      const prompt = `You are an English homework creator for a ${level} level student.
Create a homework assignment of type: "${hwType}".

Return ONLY valid JSON:
{
  "type": "${hwType}",
  "title": "Grammar Challenge: Past Perfect Tense",
  "instructions": "Complete the following exercises. Read each question carefully.",
  "exercises": [
    {
      "id": "q1",
      "type": "fill_blank",
      "question": "By the time she arrived, we _____ (finish) the meeting.",
      "answer": "had finished",
      "explanation": "We use past perfect for actions completed before another past action.",
      "hint": "Think about which action happened first"
    },
    {
      "id": "q2", 
      "type": "multiple_choice",
      "question": "Which sentence is grammatically correct?",
      "options": ["She have been working here for 5 years.", "She has been working here for 5 years.", "She had worked here since 5 years."],
      "answer": "She has been working here for 5 years.",
      "explanation": "Present perfect continuous is used for ongoing actions started in the past.",
      "hint": "Look for the time expression 'for'"
    }
  ],
  "estimatedMinutes": 15,
  "skillFocus": "Grammar"
}

Rules:
- Create exactly 6 exercises
- Mix types: fill_blank, multiple_choice, true_false, translation
- For translation type: translate English→Uzbek or Uzbek→English
- Difficulty appropriate for ${level}
- Include helpful hints and clear explanations
- For multiple_choice: provide 3-4 options in the "options" array`;

      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      });

      const data = JSON.parse(res.choices[0].message.content || '{}');
      const today = new Date().toISOString().split('T')[0];

      const inserted = await sql`
        INSERT INTO homework_sessions (date, level, type, title, instructions, exercises)
        VALUES (${today}, ${level}, ${data.type || hwType}, ${data.title}, ${data.instructions}, ${JSON.stringify(data.exercises)})
        RETURNING *
      `;

      return NextResponse.json({ session: inserted[0] });
    }

    if (action === 'submit' && sessionId && answers) {
      // Get session
      const rows = await sql`SELECT * FROM homework_sessions WHERE id = ${sessionId}`;
      if (rows.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const session = rows[0];
      const exercises = session.exercises as Array<{
        id: string;
        answer: string;
        explanation: string;
        question: string;
        type: string;
      }>;

      // Auto-grade
      let correct = 0;
      const feedback: Record<string, { correct: boolean; explanation: string; correctAnswer: string }> = {};

      for (const ex of exercises) {
        const userAnswer = (answers[ex.id] || '').toString().trim().toLowerCase();
        const correctAnswer = ex.answer.toString().trim().toLowerCase();
        const isCorrect = userAnswer === correctAnswer ||
          correctAnswer.includes(userAnswer) ||
          userAnswer.includes(correctAnswer);

        feedback[ex.id] = {
          correct: isCorrect,
          explanation: ex.explanation,
          correctAnswer: ex.answer,
        };
        if (isCorrect) correct++;
      }

      const score = Math.round((correct / exercises.length) * 100);

      await sql`
        UPDATE homework_sessions 
        SET user_answers = ${JSON.stringify(answers)}, 
            feedback = ${JSON.stringify(feedback)}, 
            score = ${score}, 
            completed = true
        WHERE id = ${sessionId}
      `;

      return NextResponse.json({ score, feedback, correct, total: exercises.length });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
