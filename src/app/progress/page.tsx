'use client';

import Sidebar from '@/components/Sidebar';
import ScoreRing from '@/components/ScoreRing';
import { useEffect, useState } from 'react';

export default function ProgressPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const progress = data?.progress || {};
  const logs = data?.recentLogs || [];
  const sessions = data?.recentSpeaking || [];
  const evals = data?.evaluations || [];

  const streak = progress.streak || 0;
  const totalMin = progress.total_minutes || 0;
  const avgScore = parseFloat(progress.average_speaking_score || '0');
  const level = progress.current_level || 'A2';
  const totalVocab = progress.total_vocab_learned || 0;
  const totalSessions = progress.total_speaking_sessions || 0;

  const heatmapCells = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const log = logs.find((l: any) => l.date?.split('T')[0] === dateStr);
    const mins = (log?.listening_minutes || 0) + (log?.speaking_minutes || 0);
    let level = 0;
    if (mins > 0 && mins < 15) level = 1;
    else if (mins >= 15 && mins < 30) level = 2;
    else if (mins >= 30 && mins < 45) level = 3;
    else if (mins >= 45) level = 4;
    return { level, date: dateStr };
  });

  const getLevelRing = (l: string) => {
    const levels: Record<string, { color: string; next: string; pct: number }> = {
      A2: { color: 'var(--level-a2)', next: 'B1', pct: 25 },
      B1: { color: 'var(--level-b1)', next: 'B2', pct: 50 },
      B2: { color: 'var(--level-b2)', next: 'C1', pct: 75 },
      C1: { color: 'var(--level-c1)', next: 'C2', pct: 95 },
    };
    return levels[l] || levels.A2;
  };
  const levelInfo = getLevelRing(level);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">📊 Progress & Stats</h1>
          <p className="page-subtitle">
            So'nggi 30 kunlik taraqqiyotingiz va kuchli-zaif tomonlaringiz
          </p>
        </div>

        {loading ? (
          <div className="grid-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stats row */}
            <div className="grid-4">
              <div className="stat-card animate-fadeUp stagger-1">
                <div style={{ fontSize: 28 }}>🔥</div>
                <div className="stat-value" style={{ background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {streak}
                </div>
                <div className="stat-label">Kun streak</div>
              </div>
              <div className="stat-card animate-fadeUp stagger-2">
                <div style={{ fontSize: 28 }}>⏱️</div>
                <div className="stat-value" style={{ background: 'var(--grad-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {totalMin}
                </div>
                <div className="stat-label">Jami daqiqa</div>
              </div>
              <div className="stat-card animate-fadeUp stagger-3">
                <div style={{ fontSize: 28 }}>🎤</div>
                <div className="stat-value" style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {Math.round(avgScore)}
                </div>
                <div className="stat-label">O'rt. speaking ball</div>
              </div>
              <div className="stat-card animate-fadeUp stagger-4">
                <div style={{ fontSize: 28 }}>📖</div>
                <div className="stat-value" style={{ background: 'var(--grad-success)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {totalVocab}
                </div>
                <div className="stat-label">O'rganilgan so'zlar</div>
              </div>
            </div>

            {/* Level + Activity Heatmap */}
            <div className="grid-2">
              {/* Level card */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <ScoreRing
                  score={levelInfo.pct}
                  size={120}
                  color={levelInfo.color}
                  label={level}
                  sublabel={`→ ${levelInfo.next}`}
                />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Hozirgi daraja
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: levelInfo.color }}>
                    {level}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Keyingi maqsad: <strong style={{ color: 'var(--text-secondary)' }}>{levelInfo.next}</strong>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${levelInfo.pct}%`, background: levelInfo.color }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      CEFR progressi
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity heatmap */}
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>📅 30 Kunlik Faollik</div>
                <div className="heatmap-row">
                  {heatmapCells.map((cell, i) => (
                    <div
                      key={i}
                      className={`heatmap-cell ${cell.level > 0 ? `level-${cell.level}` : ''}`}
                      title={cell.date}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  {[
                    { color: 'var(--bg-elevated)', label: 'Faollik yo\'q' },
                    { color: 'rgba(67,233,123,0.25)', label: '< 15 daqiqa' },
                    { color: 'rgba(67,233,123,0.5)', label: '15-30 daqiqa' },
                    { color: 'rgba(67,233,123,0.75)', label: '30-45 daqiqa' },
                    { color: 'var(--status-success)', label: '45+ daqiqa' },
                  ].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent speaking sessions */}
            {sessions.length > 0 && (
              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">🎤 So'nggi Speaking Sessiyalar</div>
                    <div className="section-subtitle">{totalSessions} ta jami sessiya</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.map((s: any, i: number) => {
                    const fb = s.feedback || {};
                    const overall = Math.round(fb.overall || 0);
                    const color = overall >= 80 ? 'var(--status-success)' : overall >= 60 ? 'var(--status-warning)' : 'var(--status-error)';
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '14px 16px',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: `${color}22`,
                            border: `2px solid ${color}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: 15,
                            color,
                            flexShrink: 0,
                          }}
                        >
                          {overall}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.prompt || 'Speaking sessiyasi'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {s.date?.split('T')[0]} • {s.audio_seconds || 0}s
                          </div>
                        </div>
                        {fb.scores && (
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {['fluency', 'grammar', 'vocabulary'].map((k) => (
                              <div key={k} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                  {Math.round(fb.scores[k] || 0)}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.slice(0, 3)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent evaluations */}
            {evals.length > 0 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom: 14 }}>🧪 So'nggi Baholashlar</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {evals.map((e: any, i: number) => {
                    const res = e.result || {};
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: 24 }}>{e.kind === 'mini_test' ? '🧪' : '💼'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {e.kind === 'mini_test' ? 'Mini Test' : 'Mock Interview'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.date?.split('T')[0]}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {res.estimated_level && (
                            <span className={`level-badge level-${res.estimated_level.toLowerCase()}`}>
                              {res.estimated_level}
                            </span>
                          )}
                          {res.overall_score != null && (
                            <span className="badge badge-primary">{Math.round(res.overall_score || res.overall_readiness_score || 0)} ball</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {sessions.length === 0 && evals.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  Hali ma'lumot yo'q
                </div>
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  Birinchi speaking sessiyani bajaring va progressingiz bu yerda ko'rinadi.
                </div>
                <a href="/speaking" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                  🎤 Birinchi sessiyani boshlash
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
