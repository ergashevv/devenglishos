import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { level, strengths, weaknesses, estimatedWeeks, name } = await req.json();

  const prompt = `You are an expert English language teacher creating a personalized learning roadmap.

Student Profile:
- Name: ${name || 'Student'}
- Current Level: ${level}
- Strengths: ${strengths?.join(', ') || 'not specified'}
- Weaknesses: ${weaknesses?.join(', ') || 'not specified'}
- Target timeline: ${estimatedWeeks} weeks

Create a detailed, week-by-week roadmap to help them progress to the next CEFR level. 
Return ONLY valid JSON in this exact format:

{
  "currentLevel": "${level}",
  "targetLevel": "B2",
  "totalWeeks": ${estimatedWeeks},
  "dailyMinutes": 45,
  "phases": [
    {
      "phase": 1,
      "title": "Foundation Building",
      "weeks": "1-4",
      "focus": "Grammar fundamentals + Core vocabulary",
      "color": "#6c63ff",
      "emoji": "🏗️",
      "skills": [
        {
          "name": "Grammar",
          "description": "Master tenses, articles, prepositions",
          "weeklyGoal": "2 grammar exercises per day",
          "resources": ["BBC Learning English", "Grammarly exercises"]
        },
        {
          "name": "Vocabulary",
          "description": "Learn 10 new words daily",
          "weeklyGoal": "70 new words per week",
          "resources": ["Anki flashcards", "Word of the day"]
        }
      ],
      "milestones": ["Complete 50 grammar exercises", "Learn 200 new words"],
      "weeklySchedule": {
        "Monday": "Grammar focus — 30 min",
        "Tuesday": "Vocabulary + Reading — 45 min",
        "Wednesday": "Listening practice — 30 min",
        "Thursday": "Writing practice — 45 min",
        "Friday": "Speaking practice — 30 min",
        "Saturday": "Review + Mini test — 60 min",
        "Sunday": "Rest or light reading"
      }
    }
  ],
  "tips": [
    "Consistency beats intensity — 30 min daily is better than 3 hours once a week",
    "Watch English movies/series with subtitles",
    "Think in English, not in your native language"
  ],
  "resources": {
    "apps": ["Duolingo for vocabulary", "Speechling for pronunciation", "Anki for flashcards"],
    "websites": ["BBC Learning English", "TED Talks", "ESL Pod"],
    "youtube": ["English with Lucy", "Rachel's English", "BBC Learning English channel"]
  }
}

Make the roadmap realistic, motivating, and specific to their weaknesses. 
Create 3-4 phases. Each phase should build on the previous one.
The targetLevel should be the next CEFR level after ${level}.
Calibrate dailyMinutes and weeklySchedule based on the timeline.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const roadmap = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json({ roadmap });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
