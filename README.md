# ⚡ DevEnglish OS — AI English Mentor Platform

> Autonomous AI English mentor for software developers. Daily plans, speaking practice, evaluations, and adaptive learning.

---

## 🚀 Quick Start

### 1. Install dependencies (already done)

```bash
npm install
```

### 2. Set up environment variables

Open `.env.local` and fill in your real API keys:

```env
OPENAI_API_KEY=sk-...your_openai_key...
POSTGRES_URL=postgresql://...your_neon_connection_string...
```

**Getting your keys:**

- **OpenAI**: https://platform.openai.com/api-keys
- **Neon Postgres** (free tier available): https://neon.tech → create project → copy Connection String

### 3. Initialize the database

Once keys are set, start the server: `npm run dev`  
The app auto-calls `/api/init-db` on first Dashboard load.  
OR manually: `curl -X POST http://localhost:3000/api/init-db`

### 4. Open the app

```
http://localhost:3000
```

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                       # 🏠 Dashboard (Control Center)
│   ├── practice/page.tsx              # 📚 Practice Engine
│   ├── speaking/page.tsx              # 🎤 Speaking Engine
│   ├── writing/page.tsx               # ✍️ Writing Homework
│   ├── progress/page.tsx              # 📊 Progress & Stats
│   ├── evaluation/page.tsx            # 🧪 Evaluation Engine
│   └── api/
│       ├── init-db/route.ts           # Database schema init
│       ├── today-plan/route.ts        # AI daily plan (gpt-4o-mini)
│       ├── transcribe/route.ts        # Audio → Text (whisper-1)
│       ├── speaking-feedback/route.ts # Speaking AI scorer
│       ├── writing-feedback/route.ts  # Writing AI scorer
│       ├── mini-test/route.ts         # 14-day CEFR test
│       ├── mock/route.ts              # 30-day mock interview
│       └── progress/route.ts          # Stats read/write
├── components/
│   ├── Sidebar.tsx                    # Navigation + streak badge
│   ├── SpeakingEngine.tsx             # Record → Transcribe → Score
│   └── ScoreRing.tsx                  # SVG circular score ring
└── lib/
    ├── db.ts                          # Neon Postgres client + initDB()
    └── openai.ts                      # OpenAI client (server-side only)
```

---

## 🧠 System Modules

| Module                | Spec Section | Description                                              |
| --------------------- | ------------ | -------------------------------------------------------- |
| **Control Center**    | §1           | Today's plan, mission checklist, guided sequential flow  |
| **Daily Plan Engine** | §2           | AI generates adaptive plan based on history & weaknesses |
| **Practice Engine**   | §3           | Listening log, vocabulary builder, writing task redirect |
| **Speaking Engine**   | §4           | Browser MediaRecorder → Whisper → AI feedback            |
| **Writing Engine**    | §3.3         | Text submission → grammar/structure/vocab AI feedback    |
| **Evaluation Engine** | §5           | Mini Test (14-day) + Mock Interview (30-day)             |
| **Progress Engine**   | §6           | Streak, heatmap, skill breakdown, sessions log           |
| **Habit Control**     | §7           | Minimal mode, reduced load, drop-off prevention          |

---

## 🗄️ Database Tables

| Table               | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `daily_logs`        | Per-day listening/speaking minutes, vocab, completion |
| `speaking_sessions` | Full speaking records + AI JSON feedback              |
| `evaluations`       | Mini test + mock interview results                    |
| `progress_stats`    | Streak, total minutes, avg score, CEFR level          |

---

## 🔑 API Reference

| Endpoint                 | Method | Description                       |
| ------------------------ | ------ | --------------------------------- |
| `/api/init-db`           | POST   | Create all DB tables (run once)   |
| `/api/today-plan`        | GET    | AI-generated adaptive daily plan  |
| `/api/transcribe`        | POST   | Audio file → text transcript      |
| `/api/speaking-feedback` | POST   | Transcript → scores + corrections |
| `/api/writing-feedback`  | POST   | Text → grammar/structure feedback |
| `/api/mini-test`         | POST   | 14-day CEFR evaluation            |
| `/api/mock`              | POST   | 30-day mock interview evaluation  |
| `/api/progress`          | GET    | Full progress dashboard data      |
| `/api/progress`          | POST   | Log completed mission             |

---

## 🚢 Deploy to Vercel

```bash
npx vercel
```

Add in Vercel Dashboard → Settings → Environment Variables:

- `OPENAI_API_KEY`
- `POSTGRES_URL`

---

## 📋 Language Rules (per spec)

- 🇺🇿 **Explanations, motivations, descriptions**: Uzbek
- 🇬🇧 **Exercises, tasks, writing prompts**: English

---

## 🔐 Security

- All OpenAI calls are **server-side only** (Next.js API routes)
- API key is **never** sent to the browser
- Environment variables loaded from `.env.local` only
