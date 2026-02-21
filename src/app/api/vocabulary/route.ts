import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import sql from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS vocabulary_sessions (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      level TEXT NOT NULL DEFAULT 'B1',
      topic TEXT,
      words JSONB DEFAULT '[]',
      learned_ids JSONB DEFAULT '[]',
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
      SELECT * FROM vocabulary_sessions WHERE date = ${date} ORDER BY created_at DESC LIMIT 1
    `;

    if (rows.length > 0) {
      return NextResponse.json({ session: rows[0] });
    }

    // No session for today — need to generate
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
    const { action, level, topic, sessionId, learnedIds } = body;

    if (action === 'generate') {
      // Generate new vocabulary session via AI
      const prompt = `You are an English vocabulary teacher. Generate 10 words for a ${level} English learner.
Topic/Theme: ${topic || 'everyday life and common situations'}

Return ONLY valid JSON:
{
  "topic": "Everyday Conversations",
  "words": [
    {
      "id": "w1",
      "word": "resilient",
      "pronunciation": "/rɪˈzɪliənt/",
      "partOfSpeech": "adjective",
      "meaning": "able to recover quickly from difficulties",
      "uzbekMeaning": "bardoshli, qiyinchiliklardan tez tiklanadigan",
      "example": "She was resilient enough to keep going despite the setbacks.",
      "exampleUz": "U to'siqlariga qaramay, davom etish uchun yetarli bardoshli edi.",
      "difficulty": "medium",
      "synonyms": ["tough", "strong", "hardy"],
      "tip": "Think of a rubber band that bounces back to its shape"
    }
  ]
}

Rules:
- Mix easy (3), medium (4), and hard (3) words appropriate for ${level} level
- Always include uzbekMeaning for each word  
- Make examples practical and relatable for an Uzbek developer
- Include a memory tip for harder words
- difficulty must be: "easy", "medium", or "hard"`;

      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const data = JSON.parse(res.choices[0].message.content || '{}');
      const today = new Date().toISOString().split('T')[0];

      const inserted = await sql`
        INSERT INTO vocabulary_sessions (date, level, topic, words, learned_ids)
        VALUES (${today}, ${level}, ${data.topic}, ${JSON.stringify(data.words)}, '[]')
        RETURNING *
      `;

      return NextResponse.json({ session: inserted[0] });
    }

    if (action === 'markLearned' && sessionId && learnedIds) {
      await sql`
        UPDATE vocabulary_sessions SET learned_ids = ${JSON.stringify(learnedIds)} WHERE id = ${sessionId}
      `;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
