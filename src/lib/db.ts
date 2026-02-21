import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export default sql;

export async function initDB() {
  // daily_logs: tracks each day's activity
  await sql`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      listening_minutes INTEGER DEFAULT 0,
      speaking_minutes INTEGER DEFAULT 0,
      vocab JSONB DEFAULT '[]',
      notes TEXT,
      completed BOOLEAN DEFAULT FALSE,
      minimal_mode_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // speaking_sessions: stores each speaking practice session
  await sql`
    CREATE TABLE IF NOT EXISTS speaking_sessions (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      prompt TEXT,
      transcript TEXT,
      feedback JSONB,
      audio_seconds INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // evaluations: mini-tests and mock interviews
  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      kind TEXT NOT NULL,
      result JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // progress_stats: single-row table tracking overall stats
  await sql`
    CREATE TABLE IF NOT EXISTS progress_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      streak INTEGER DEFAULT 0,
      total_minutes INTEGER DEFAULT 0,
      average_speaking_score NUMERIC(5,2) DEFAULT 0,
      last_activity_date DATE,
      total_speaking_sessions INTEGER DEFAULT 0,
      total_vocab_learned INTEGER DEFAULT 0,
      current_level TEXT DEFAULT 'A2',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed a single progress_stats row if not exists
  await sql`
    INSERT INTO progress_stats (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `;

  return { ok: true };
}
