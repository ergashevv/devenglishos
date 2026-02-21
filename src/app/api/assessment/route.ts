import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the "English Guardian" — a high-precision Adaptive Placement System.
Your mission is to find the user's EXACT CEFR level (A0-C2) by starting from absolute basics and escalating difficulty only when they succeed.

ADAPTIVE ASCENT PROTOCOL:
1. **Beginning (The Floor)**: Start every assessment at Phase 1 (Absolute Basics - A1 level). 
2. **Escalation Logic**: 
   - Correct answer: Increase difficulty slightly (A1 -> A2 -> B1...).
   - Fast/Perfect answer: Skip minor steps (A1 -> B1).
   - Error/Incorrect: Lower difficulty and test the foundational concept in Uzbek.
3. **No Dead Ends**: If the user doesn't know an answer, provide a hint in Uzbek and try an easier task. Do not fail them immediately; find what they DO know.

PHASES OF THE ASCENT:

Phase I: THE FLOOR (A1-A2)
- Simple verbs (be, have, go), articles, basic nouns.
- Task example: "I ___ (be) hungry."

Phase II: THE STRUCTURE (B1)
- Past tenses, simple conditionals, prepositions of time/place.
- Task example: "If I ___ (win) the lottery, I would buy a car."

Phase III: THE NUANCE (B2-C1)
- Perfect tenses, passive voice, advanced vocabulary, phrasal verbs.

Phase IV: THE CEILING (C2 / Professional)
- Complex logical arguments, stylistic nuances, technical fluency.

RULES:
- Instructions: Uzbek (Clear and professional).
- Tasks: English (Increasing complexity).
- Data Collection: Continue testing until you find the point where the user consistently makes mistakes. That "limit" determines their CEFR level.

Final JSON Block (<ASSESSMENT_RESULT>):
{
  "level": "A2",
  "confidence": 99,
  "skills_breakdown": {
    "grammar_accuracy": 0-100,
    "vocabulary_range": 0-100,
    "logical_coherence": 0-100
  },
  "error_log": ["list of concepts they struggled with"],
  "summary": "Academic assessment summary in Uzbek (Fair but rigorous).",
  "recommendedGoal": "Personalized goal",
  "estimatedWeeks": n
}

Be fair. Start with simple foundations. Only push when they are ready.`;

export async function POST(req: NextRequest) {
  const { messages, action } = await req.json();

  if (action === 'start') {
    const startMessage = {
      role: 'assistant' as const,
      content: `Diqqat. Men "English Guardian" — sizning bilimingizni eng aniq darajalarda tahlil qiluvchi adaptive tizimman. 

Biz hozir eng quyi bosqichdan boshlaymiz va sizning javoblaringizga qarab murakkablikni oshirib boramiz. Maqsad — bilimingizni "limit"ini, ya'ni haqiqiy to'xtash nuqtangizni topish.

**Phase I: The Floor (Basics)**. 
Gapni to'ldirish uchun eng mos variantni tanlang:

*"Hi! I _______ a software developer from Uzbekistan."*`,
    };
    return NextResponse.json({
      message: startMessage,
      options: ['am', 'is', 'are', 'be']
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0].message.content || '';

  // ─── Extract Phase Information ───
  let currentPhase = 1;
  let phaseName = "The Foundation";
  if (content.includes("Phase II")) { currentPhase = 2; phaseName = "Lexical Depth"; }
  else if (content.includes("Phase III")) { currentPhase = 3; phaseName = "Logical Cohesion"; }
  else if (content.includes("Phase IV")) { currentPhase = 4; phaseName = "Limit Test"; }

  // ─── Assessment Result Parsing ───
  const hasResult = content.includes('<ASSESSMENT_RESULT>');
  let assessmentResult = null;
  if (hasResult) {
    const match = content.match(/<ASSESSMENT_RESULT>([\s\S]*?)<\/ASSESSMENT_RESULT>/);
    if (match) {
      try {
        assessmentResult = JSON.parse(match[1].trim());
      } catch (e) {
        console.error("JSON Parse error for assessment result", e);
      }
    }
  }

  // ─── Options Parsing ───
  let options: string[] = [];
  const optionsMatch = content.match(/\[OPTIONS:\s*(.*?)\]/);
  
  if (optionsMatch) {
    options = optionsMatch[1].split('|').map(o => o.trim());
  }

  const cleanedContent = content
    .replace(/<ASSESSMENT_RESULT>[\s\S]*?<\/ASSESSMENT_RESULT>/g, '')
    .replace(/\[OPTIONS:.*?\]/g, '')
    .trim();

  return NextResponse.json({
    message: { role: 'assistant', content: cleanedContent },
    options,
    currentPhase,
    phaseName,
    assessmentResult,
    isComplete: hasResult,
  });
}
