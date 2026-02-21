'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface Exercise {
  id: string;
  type: 'fill_blank' | 'multiple_choice' | 'true_false' | 'translation';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  hint?: string;
}

interface HomeworkSession {
  id: number;
  date: string;
  level: string;
  type: string;
  title: string;
  instructions: string;
  exercises: Exercise[];
  user_answers: Record<string, string>;
  feedback: Record<string, { correct: boolean; explanation: string; correctAnswer: string }>;
  score: number | null;
  completed: boolean;
}

interface SubmitResult {
  score: number;
  correct: number;
  total: number;
  feedback: Record<string, { correct: boolean; explanation: string; correctAnswer: string }>;
}

const HW_TYPES = [
  { value: 'grammar', label: '📝 Grammar', desc: 'Gap to\'ldirish va xato tuzatish' },
  { value: 'vocabulary_quiz', label: '📖 Vocabulary Quiz', desc: 'So\'zlarni tekshirish' },
  { value: 'reading', label: '📚 Reading Comprehension', desc: 'Matn tushunish' },
  { value: 'translation', label: '🌐 Translation', desc: 'Tarjima mashqlari' },
];

function scoreColor(score: number) {
  if (score >= 80) return 'var(--status-success)';
  if (score >= 60) return '#38b4ff';
  if (score >= 40) return 'var(--status-warning)';
  return 'var(--status-error)';
}

function scoreEmoji(score: number) {
  if (score >= 90) return '🏆';
  if (score >= 80) return '⭐';
  if (score >= 60) return '👍';
  if (score >= 40) return '💪';
  return '📚';
}

export default function HomeworkPage() {
  const [session, setSession] = useState<HomeworkSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('grammar');
  const [userLevel, setUserLevel] = useState('B1');
  const [showHints, setShowHints] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const res = await fetch('/api/homework').then(r => r.json());
        if (res.session) {
          setSession(res.session);
          setAnswers(res.session.user_answers || {});
          if (res.session.completed && res.session.feedback) {
            setResult({
              score: res.session.score,
              correct: Object.values(res.session.feedback as Record<string, { correct: boolean }>).filter(f => f.correct).length,
              total: res.session.exercises?.length || 0,
              feedback: res.session.feedback,
            });
          }
        }
      } catch {}
      setLoading(false);
    }

    async function init() {
      try {
        const pr = await fetch('/api/user-profile').then(r => r.json());
        if (pr.profile?.level) setUserLevel(pr.profile.level);
      } catch {}
      await loadSession();
    }
    init();
  }, []);

  async function generateHomework() {
    setGenerating(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', level: userLevel, type: selectedType }),
      }).then(r => r.json());
      setSession(res.session);
    } catch {}
    setGenerating(false);
  }

  async function submitHomework() {
    if (!session) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', sessionId: session.id, answers }),
      }).then(r => r.json());
      setResult(res);
    } catch {}
    setSubmitting(false);
  }

  const allAnswered = session?.exercises?.every(ex => answers[ex.id]?.trim()) ?? false;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">✍️ Homework</h1>
              <p className="page-subtitle">Kunlik mashqlar — real ingliz tili kursidek</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className={`level-badge level-${userLevel.toLowerCase()}`}>{userLevel}</div>
              {session && (
                <button className="btn btn-ghost btn-sm" onClick={generateHomework} disabled={generating}>
                  🔄 Yangi mashq
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RESULT SCREEN */}
        {result && session && (
          <div className="hw-result animate-fadeUp">
            <div className="hw-result-header">
              <div className="hw-score-circle" style={{ borderColor: scoreColor(result.score) }}>
                <div className="hw-score-emoji">{scoreEmoji(result.score)}</div>
                <div className="hw-score-num" style={{ color: scoreColor(result.score) }}>{result.score}%</div>
                <div className="hw-score-label">{result.correct}/{result.total} to&apos;g&apos;ri</div>
              </div>
              <div className="hw-result-text">
                <div className="hw-result-title">
                  {result.score >= 80 ? 'Ajoyib natija! 🎉' :
                   result.score >= 60 ? 'Yaxshi ish! 👍' :
                   result.score >= 40 ? 'Amaliyot kerak 💪' : 'Qayta urinib ko\'ring 📚'}
                </div>
                <div className="hw-result-desc">
                  {result.score >= 80
                    ? "Siz bu mavzuni yaxshi o'zlashtirdingiz!"
                    : "Ko'proq mashq qilish kerak. Tushuntirishlarni o'qing."}
                </div>
              </div>
            </div>

            {/* Per-question feedback */}
            <div className="hw-feedback-list">
              {session.exercises.map((ex, i) => {
                const fb = result.feedback[ex.id];
                return (
                  <div key={ex.id} className={`hw-feedback-item ${fb?.correct ? 'correct' : 'wrong'}`}>
                    <div className="hw-feedback-num">
                      {fb?.correct ? '✓' : '✗'}
                    </div>
                    <div className="hw-feedback-content">
                      <div className="hw-feedback-q">
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}.</span> {ex.question}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                        {!fb?.correct && (
                          <div style={{ fontSize: 13, color: 'var(--status-error)' }}>
                            Sizning javob: <strong>{answers[ex.id] || '(javob yo\'q)'}</strong>
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--status-success)' }}>
                          To&apos;g&apos;ri javob: <strong>{fb?.correctAnswer}</strong>
                        </div>
                      </div>
                      <div className="hw-feedback-explanation">{fb?.explanation}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn btn-primary" onClick={generateHomework} disabled={generating}>
              {generating ? '⏳ Yangi mashq...' : '📝 Yangi Mashq Boshlash'}
            </button>
          </div>
        )}

        {/* GENERATE PANEL */}
        {!session && !loading && !result && (
          <div className="hw-generate-panel animate-fadeUp">
            <div className="hw-gen-icon">✍️</div>
            <div className="hw-gen-title">Bugungi uy vazifasi</div>
            <div className="hw-gen-desc">
              AI sizning darajangizga mos 6 ta mashq tayyorlaydi
            </div>

            <div className="hw-type-grid">
              {HW_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`hw-type-card ${selectedType === t.value ? 'active' : ''}`}
                  onClick={() => setSelectedType(t.value)}
                >
                  <div className="hw-type-label">{t.label}</div>
                  <div className="hw-type-desc">{t.desc}</div>
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={generateHomework}
              disabled={generating}
              style={{ marginTop: 24 }}
            >
              {generating ? '⏳ AI mashq tayyorlamoqda...' : '✨ Mashq Yaratish'}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* HOMEWORK EXERCISES */}
        {session && !loading && !result && (
          <div>
            {/* Session info */}
            <div className="hw-session-header animate-fadeUp">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  {session.type} · {session.level} · {session.exercises?.length || 0} savol
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{session.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                  {session.instructions}
                </div>
              </div>
              <div className="hw-progress-mini">
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 6 }}>
                  {Object.keys(answers).filter(k => answers[k]?.trim()).length}/{session.exercises?.length || 0} javob
                </div>
                <div className="progress-track" style={{ width: 120, height: 4 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(Object.keys(answers).filter(k => answers[k]?.trim()).length / (session.exercises?.length || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(session.exercises || []).map((ex, i) => (
                <div key={ex.id} className="hw-exercise-card animate-fadeUp" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="hw-exercise-header">
                    <div className="hw-exercise-num">{i + 1}</div>
                    <div className="hw-exercise-type-badge">
                      {ex.type === 'fill_blank' ? '📝 Gap to\'ldirish' :
                       ex.type === 'multiple_choice' ? '🔘 Javob tanlash' :
                       ex.type === 'true_false' ? '✅ To\'g\'ri/Noto\'g\'ri' :
                       '🌐 Tarjima'}
                    </div>
                    {ex.hint && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 10px', marginLeft: 'auto' }}
                        onClick={() => {
                          const next = new Set(showHints);
                          if (next.has(ex.id)) next.delete(ex.id);
                          else next.add(ex.id);
                          setShowHints(next);
                        }}
                      >
                        💡 Ko&apos;rsatma
                      </button>
                    )}
                  </div>

                  <div className="hw-question">{ex.question}</div>

                  {showHints.has(ex.id) && ex.hint && (
                    <div className="hw-hint animate-fadeUp">💡 {ex.hint}</div>
                  )}

                  {/* Answer input */}
                  {ex.type === 'multiple_choice' && ex.options ? (
                    <div className="hw-mc-options">
                      {ex.options.map((opt, j) => (
                        <button
                          key={j}
                          className={`hw-mc-option ${answers[ex.id] === opt ? 'selected' : ''}`}
                          onClick={() => setAnswers(prev => ({ ...prev, [ex.id]: opt }))}
                        >
                          <div className="hw-mc-letter">{String.fromCharCode(65 + j)}</div>
                          <div className="hw-mc-text">{opt}</div>
                        </button>
                      ))}
                    </div>
                  ) : ex.type === 'true_false' ? (
                    <div style={{ display: 'flex', gap: 12 }}>
                      {["True", "False"].map(opt => (
                        <button
                          key={opt}
                          className={`hw-tf-btn ${answers[ex.id] === opt ? 'selected' : ''}`}
                          style={{
                            background: answers[ex.id] === opt
                              ? (opt === 'True' ? 'rgba(67,233,123,0.2)' : 'rgba(255,101,132,0.2)')
                              : 'var(--bg-elevated)',
                            borderColor: answers[ex.id] === opt
                              ? (opt === 'True' ? 'var(--status-success)' : 'var(--status-error)')
                              : 'var(--bg-border)',
                          }}
                          onClick={() => setAnswers(prev => ({ ...prev, [ex.id]: opt }))}
                        >
                          {opt === 'True' ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      className="form-input hw-text-input"
                      placeholder={ex.type === 'translation' ? 'Tarjimangizni yozing...' : 'Javobingizni yozing...'}
                      value={answers[ex.id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="hw-submit-area">
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {allAnswered ? '✅ Barcha savollar javoblandi' : `⚠️ ${(session.exercises?.length || 0) - Object.keys(answers).filter(k => answers[k]?.trim()).length} ta savol javobsiz`}
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={submitHomework}
                disabled={submitting || !allAnswered}
              >
                {submitting ? '⏳ Tekshirilmoqda...' : '📊 Topshirish va Natijani Ko\'rish'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
