'use client';

import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

type EvalType = 'mini_test' | 'mock_interview';
type Phase = 'select' | 'running' | 'result';

export default function EvaluationPage() {
  const [evalType, setEvalType] = useState<EvalType>('mini_test');
  const [phase, setPhase] = useState<Phase>('select');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runEval = async () => {
    setLoading(true);
    setError('');
    setPhase('running');

    try {
      const endpoint = evalType === 'mini_test' ? '/api/mini-test' : '/api/mock';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setPhase('result');
    } catch (e) {
      setError(String(e));
      setPhase('select');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase('select');
    setResult(null);
    setError('');
  };

  const getColor = (score: number) => {
    if (score >= 80) return 'var(--status-success)';
    if (score >= 60) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">🧪 Evaluation Engine</h1>
          <p className="page-subtitle">
            Davriy testlar va mock intervyular orqali darajangizni aniqang
          </p>
        </div>

        {phase === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadeUp">
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            {/* Eval type selection */}
            <div className="grid-2">
              <div
                id="eval-mini-test"
                className={`card`}
                style={{
                  cursor: 'pointer',
                  border: evalType === 'mini_test' ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
                  background: evalType === 'mini_test' ? 'rgba(108,99,255,0.08)' : 'var(--bg-surface)',
                  transition: 'all 0.2s',
                }}
                onClick={() => setEvalType('mini_test')}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>🧪</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Mini Test</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Har 14 kunda. Listening, Grammar, Vocabulary va Writing testlari.
                  CEFR darajasini baholaydi.
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Listening', 'Grammar', 'Vocabulary', 'Writing'].map((s) => (
                    <span key={s} className="badge badge-primary">{s}</span>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  ⏱ Taxminan 15 daqiqa
                </div>
              </div>

              <div
                id="eval-mock-interview"
                className={`card`}
                style={{
                  cursor: 'pointer',
                  border: evalType === 'mock_interview' ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
                  background: evalType === 'mock_interview' ? 'rgba(108,99,255,0.08)' : 'var(--bg-surface)',
                  transition: 'all 0.2s',
                }}
                onClick={() => setEvalType('mock_interview')}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Mock Interview</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Har 30 kunda. Texnik va behavioral savollar.
                  Interview tayyorligini baholaydi va 2 haftalik plan beradi.
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Technical', 'Behavioral', 'Communication'].map((s) => (
                    <span key={s} className="badge badge-info">{s}</span>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  ⏱ Taxminan 25 daqiqa
                </div>
              </div>
            </div>

            <button
              id="start-eval-btn"
              className="btn btn-primary btn-lg"
              style={{ alignSelf: 'flex-start' }}
              onClick={runEval}
            >
              🚀 Baholashni Boshlash
            </button>

            {/* Schedule reminder */}
            <div className="card" style={{ background: 'var(--bg-elevated)' }}>
              <div className="section-title" style={{ marginBottom: 14 }}>📅 Baholash Jadvali</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '🧪', label: 'Mini Test', freq: 'Har 14 kunda', desc: 'CEFR daraja baholashi + ko\'rsatmalar' },
                  { icon: '💼', label: 'Mock Interview', freq: 'Har 30 kunda', desc: 'Interview tayyorligi + 2 haftalik plan' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.label} — <span style={{ color: 'var(--brand-primary)' }}>{item.freq}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Running */}
        {phase === 'running' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '80px 0' }}
            className="animate-fadeIn"
          >
            <div className="spinner" style={{ width: 64, height: 64, borderWidth: 6 }} />
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {evalType === 'mini_test' ? '🧪 Mini Test' : '💼 Mock Interview'} bajarilmoqda...
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              AI savollar va baholash kriteriyalarini tayyorlamoqda
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-scaleIn">
            {/* Header */}
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: 28,
                border: '1px solid var(--bg-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `${getColor(result.overall_score || result.overall_readiness_score || 0)}22`,
                  border: `3px solid ${getColor(result.overall_score || result.overall_readiness_score || 0)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 900, color: getColor(result.overall_score || result.overall_readiness_score || 0) }}>
                  {Math.round(result.overall_score || result.overall_readiness_score || 0)}
                </span>
              </div>
              <div>
                {evalType === 'mini_test' ? (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>CEFR Darajasi</div>
                    <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4 }}>
                      <span className={`level-badge level-${(result.estimated_level || 'a2').toLowerCase()}`}>
                        {result.estimated_level || 'A2'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Interview Tayyorligi</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{result.readiness_label || 'Needs Work'}</div>
                  </>
                )}
              </div>
            </div>

            <div className="grid-2">
              {/* Skill breakdown */}
              {result.skill_breakdown && (
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 14 }}>📊 Ko'nikmalar</div>
                  {Object.entries(result.skill_breakdown).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 80, fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}</div>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${v}%`, background: getColor(v as number) }} />
                      </div>
                      <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: getColor(v as number), textAlign: 'right' }}>{v as number}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Weaknesses */}
              {(result.weaknesses || result.weakness_report) && (
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 14 }}>⚠️ Zaif tomonlar</div>
                  {result.weaknesses?.map((w: string, i: number) => (
                    <div key={i} className="alert alert-warning" style={{ marginBottom: 8 }}>
                      <span>•</span> <span style={{ fontSize: 13 }}>{w}</span>
                    </div>
                  ))}
                  {result.weakness_report?.critical?.map((w: string, i: number) => (
                    <div key={i} className="alert alert-error" style={{ marginBottom: 8 }}>
                      <span>🔴</span> <span style={{ fontSize: 13 }}>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Questions generated */}
            {result.sections?.grammar?.questions?.length > 0 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 14 }}>📝 Grammar Savollari</div>
                {result.sections.grammar.questions.map((q: any, i: number) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--bg-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{i + 1}. {q.question}</div>
                    {q.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {q.options.map((o: string, j: number) => (
                          <div
                            key={j}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              fontSize: 13,
                              background: o.startsWith(q.correct?.charAt(0)) ? 'rgba(67,233,123,0.1)' : 'var(--bg-elevated)',
                              color: o.startsWith(q.correct?.charAt(0)) ? 'var(--status-success)' : 'var(--text-secondary)',
                              border: `1px solid ${o.startsWith(q.correct?.charAt(0)) ? 'rgba(67,233,123,0.3)' : 'var(--bg-border)'}`,
                            }}
                          >
                            {o}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.explanation && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💡 {q.explanation}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Technical questions (mock) */}
            {result.sections?.technical?.questions?.length > 0 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 14 }}>💻 Texnik Savollar</div>
                {result.sections.technical.questions.map((q: any, i: number) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--bg-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{i + 1}. {q.question}</div>
                    {q.vocabulary_to_use?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {q.vocabulary_to_use.map((v: string, j: number) => (
                          <span key={j} className="badge badge-info">{v}</span>
                        ))}
                      </div>
                    )}
                    {q.ideal_answer_points?.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        ✓ {q.ideal_answer_points.join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Improvement plan */}
            {result.improvement_plan && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 14 }}>🗓️ 2 Haftalik Reja</div>
                <div className="grid-2">
                  {Object.entries(result.improvement_plan).map(([week, tasks]) => (
                    <div key={week}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-primary)', marginBottom: 10, textTransform: 'uppercase' }}>
                        {week === 'week_1' ? '1-hafta' : '2-hafta'}
                      </div>
                      {(tasks as string[]).map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          <span style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>→</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="alert alert-info" style={{ flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 700 }}>💡 Tavsiyalar</div>
                {result.recommendations.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: 13 }}>• {r}</div>
                ))}
              </div>
            )}

            <button id="eval-reset-btn" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={reset}>
              ← Yangi baholash
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
