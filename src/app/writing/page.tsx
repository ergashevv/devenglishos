'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';

export default function WritingPage() {
  const [prompt, setPrompt] = useState('');
  const [submission, setSubmission] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'write' | 'feedback'>('write');
  const [loadingPrompt, setLoadingPrompt] = useState(true);

  useEffect(() => {
    fetch('/api/today-plan')
      .then((r) => r.json())
      .then((data) => {
        if (data.homework?.prompt) setPrompt(data.homework.prompt);
        else if (data.missions) {
          const w = data.missions.find((m: any) => m.type === 'writing');
          if (w?.task) setPrompt(w.task);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrompt(false));
  }, []);

  const submit = async () => {
    if (!submission.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/writing-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission, prompt }),
      });
      const data = await res.json();
      setFeedback(data);
      setPhase('feedback');

      // Log completion
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionType: 'writing' }),
      });
    } catch (e) {
      alert('Xatolik: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase('write');
    setFeedback(null);
    setSubmission('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--status-success)';
    if (score >= 60) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  const wordCount = submission.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">✍️ Writing Homework</h1>
          <p className="page-subtitle">
            Yozing, topshiring — AI grammatika, tuzilma va lug'atni baholaydi
          </p>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Write phase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Prompt */}
            <div className="card-glow">
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Bugungi vazifa
              </div>
              {loadingPrompt ? (
                <div className="skeleton" style={{ height: 40 }} />
              ) : (
                <div style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
                  {prompt || 'Write a short paragraph about a technical problem you recently solved and how you communicated it to your team.'}
                </div>
              )}
            </div>

            {/* Text area */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="section-title">📝 Javobingiz</div>
                <div style={{ fontSize: 12, color: wordCount >= 50 ? 'var(--status-success)' : 'var(--text-muted)' }}>
                  {wordCount} so'z {wordCount < 50 && '(min 50)'}
                </div>
              </div>
              <textarea
                id="writing-submission"
                className="form-input"
                rows={12}
                placeholder="Write your answer in English here... Minimum 50 words for best feedback."
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                disabled={phase === 'feedback'}
                style={{ lineHeight: 1.8 }}
              />
              {phase === 'write' && (
                <button
                  id="submit-writing-btn"
                  className="btn btn-primary w-full"
                  style={{ marginTop: 14 }}
                  onClick={submit}
                  disabled={loading || wordCount < 10}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> AI tahlil qilmoqda...</>
                  ) : (
                    '📤 Topshirish'
                  )}
                </button>
              )}
              {phase === 'feedback' && (
                <button id="writing-reset-btn" className="btn btn-ghost w-full" style={{ marginTop: 14 }} onClick={reset}>
                  ✏️ Yangi yozish
                </button>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {phase === 'feedback' && feedback ? (
              <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Overall */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${getScoreColor(feedback.overall || 0)}44`,
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Umumiy Writing Bahosi</div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: getScoreColor(feedback.overall || 0), lineHeight: 1 }}>
                    {Math.round(feedback.overall || 0)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>/ 100</div>
                </div>

                {/* Score breakdown */}
                {feedback.scores && (
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 14 }}>Batafsil baholar</div>
                    <div className="score-grid">
                      {Object.entries(feedback.scores).map(([key, val]) => (
                        <div key={key} className="score-item">
                          <div className="score-item-label">{key}</div>
                          <div className="score-item-value" style={{ color: getScoreColor(val as number) }}>
                            {Math.round(val as number)}
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${val}%`, background: getScoreColor(val as number) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improved version */}
                {feedback.improved_version && (
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>✨ Yaxshilangan versiya</div>
                    <div className="improved-text">{feedback.improved_version}</div>
                  </div>
                )}

                {/* Mistakes */}
                {feedback.mistakes?.length > 0 && (
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>⚠️ Xatolar</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {feedback.mistakes.map((m: any, i: number) => (
                        <div key={i} className="mistake-item">
                          <div className="mistake-original">✗ {m.original}</div>
                          <div className="mistake-correction">✓ {m.correction}</div>
                          {m.explanation && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                              {m.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {feedback.tips?.length > 0 && (
                  <div className="alert alert-info">
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>💡 Maslahatlar</div>
                      {feedback.tips.map((t: string, i: number) => (
                        <div key={i} style={{ fontSize: 13, marginTop: 4 }}>• {t}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>📋 Yaxshi Writing uchun</div>
                {[
                  { icon: '🏗️', title: 'Tuzilma', desc: 'Introduction → Body → Conclusion' },
                  { icon: '🔗', title: 'Bog\'lovchilar', desc: 'However, Moreover, Therefore, In addition...' },
                  { icon: '📏', title: 'Hajm', desc: '50-150 so\'z — ideal mashq uchun' },
                  { icon: '🎯', title: 'Konkretlik', desc: 'Aniq misollar va raqamlar ishlating' },
                  { icon: '⏰', title: 'Davomiylik', desc: 'Har kuni yozish — 30 kunda dramatic yaxshilanish' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 4 ? '1px solid var(--bg-border)' : 'none' }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
