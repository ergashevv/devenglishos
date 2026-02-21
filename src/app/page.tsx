'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { format } from 'date-fns';

interface Mission {
  id: string;
  type: string;
  title: string;
  description: string;
  task?: string;
  words?: Array<{ word: string; meaning: string; example: string }>;
  durationMinutes: number;
  completed: boolean;
}

interface DailyPlan {
  date: string;
  focus: string[];
  targetMinutes: number;
  missions: Mission[];
  speaking_prompt: string;
  vocab: Array<{ word: string; meaning: string; example: string }>;
  homework: { type: string; prompt: string; hint: string };
  minimal_mode: { active: boolean; task: string; description: string };
  motivational_message: string;
  streak_bonus: boolean;
}

const MISSION_ICONS: Record<string, string> = {
  listening: '🎧',
  vocabulary: '📖',
  speaking: '🎤',
  writing: '✍️',
};

const MISSION_COLORS: Record<string, string> = {
  listening: 'rgba(56,180,255,0.15)',
  vocabulary: 'rgba(255,215,0,0.15)',
  speaking: 'rgba(108,99,255,0.15)',
  writing: 'rgba(67,233,123,0.15)',
};

export default function DashboardPage() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [dbStatus, setDbStatus] = useState<'ok' | 'error' | 'checking'>('checking');
  const [progressData, setProgressData] = useState<any>(null);

  const today = format(new Date(), 'EEEE, dd MMMM yyyy');

  // Initialize DB and load data
  useEffect(() => {
    async function init() {
      // Init DB silently
      try {
        await fetch('/api/init-db', { method: 'POST' });
        setDbStatus('ok');
      } catch {
        setDbStatus('error');
      }

      // Load progress
      try {
        const pr = await fetch('/api/progress').then((r) => r.json());
        setProgressData(pr.progress);
      } catch {}

      // Load today plan
      try {
        const data = await fetch('/api/today-plan').then((r) => r.json());
        setPlan(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const completeMission = useCallback(
    async (mission: Mission) => {
      if (completedSet.has(mission.id)) return;

      const next = new Set(completedSet);
      next.add(mission.id);
      setCompletedSet(next);

      // Log to DB
      const payload: any = { missionType: mission.type };
      if (mission.type === 'listening') payload.listeningMinutes = mission.durationMinutes;
      if (mission.type === 'speaking') payload.speakingMinutes = mission.durationMinutes;
      if (mission.type === 'vocabulary') payload.vocab = mission.words?.map((w) => w.word) || [];

      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});

      // Auto-advance to next mission
      const missions = plan?.missions || [];
      const currentIdx = missions.findIndex((m) => m.id === mission.id);
      if (currentIdx < missions.length - 1) {
        setActiveMission(missions[currentIdx + 1].id);
      } else {
        setActiveMission(null);
      }
    },
    [completedSet, plan]
  );

  const totalCompleted = completedSet.size;
  const totalMissions = plan?.missions?.length || 0;
  const isValidPlan = !!(plan?.missions?.length && plan?.focus);
  const progressPct = totalMissions > 0 ? (totalCompleted / totalMissions) * 100 : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">🧠 Control Center</h1>
              <p className="page-subtitle">{today}</p>
            </div>
            {progressData && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="badge badge-gold">🔥 {progressData.streak || 0} kun streak</div>
                <span className={`level-badge level-${(progressData.current_level || 'a2').toLowerCase()}`}>
                  {progressData.current_level || 'A2'}
                </span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, color: 'var(--text-muted)' }}>
              <div className="spinner" />
              AI kunlik rejaingizni tuzmoqda...
            </div>
          </div>
        ) : !isValidPlan ? (
          <div className="alert alert-error">
            ⚠️ Rejayi yuklab bo&apos;lmadi. API kalitlarini tekshiring: OPENAI_API_KEY va POSTGRES_URL
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Minimal Mode Banner */}
            {plan.minimal_mode?.active && (
              <div className="minimal-banner animate-fadeUp">
                <span style={{ fontSize: 28 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--status-warning)' }}>
                    Minimal Rejim Faol
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {plan.minimal_mode.description}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 8, fontWeight: 600 }}>
                    📌 {plan.minimal_mode.task}
                  </div>
                </div>
              </div>
            )}

            {/* Motivational Message */}
            {plan.motivational_message && (
              <div className="alert alert-info animate-fadeUp">
                <span>✨</span>
                <span style={{ fontSize: 14 }}>{plan.motivational_message}</span>
              </div>
            )}

            {/* Today Hero */}
            <div className="today-hero animate-fadeUp">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Bugungi maqsad
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {plan.targetMinutes} daqiqalik ta'lim
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(plan.focus ?? []).map((f) => (
                      <span key={f} className="badge badge-primary">
                        {f}
                      </span>
                    ))}
                    {plan.streak_bonus && (
                      <span className="badge badge-gold">🎯 Bonus Task!</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--brand-primary)' }}>
                    {totalCompleted}/{totalMissions}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>bajarildi</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-track" style={{ height: 8 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {Math.round(progressPct)}% bajarildi
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {totalMissions - totalCompleted} ta qoldi
                </span>
              </div>
            </div>

            {/* Missions List */}
            <div>
              <div className="section-header">
                <div>
                  <div className="section-title">📋 Bugungi Missiyalar</div>
                  <div className="section-subtitle">
                    Ketma-ket bajaring — har bir missiya keyingisini ochadi
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(plan.missions ?? []).map((mission, idx) => {
                  const isCompleted = completedSet.has(mission.id);
                  const isActive = activeMission === mission.id || (idx === 0 && !activeMission && !isCompleted);
                  const isLocked = !isCompleted && !isActive && idx > 0 &&
                    !completedSet.has(plan.missions[idx - 1]?.id);

                  return (
                    <div
                      key={mission.id}
                      id={`mission-${mission.id}`}
                      className={`mission-item animate-fadeUp stagger-${Math.min(idx + 1, 5)} ${
                        isCompleted ? 'completed' : isActive ? 'active' : isLocked ? 'locked' : ''
                      }`}
                      onClick={() => {
                        if (!isLocked) setActiveMission(isActive ? null : mission.id);
                      }}
                    >
                      {/* Checkbox */}
                      <div className={`mission-checkbox ${isCompleted ? 'done' : ''}`}>
                        {isCompleted && <span style={{ fontSize: 12, color: 'white' }}>✓</span>}
                      </div>

                      {/* Type icon */}
                      <div
                        className="mission-type-icon"
                        style={{ background: MISSION_COLORS[mission.type] || 'var(--bg-elevated)' }}
                      >
                        {MISSION_ICONS[mission.type] || '📌'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{mission.title}</span>
                          {isLocked && (
                            <span className="badge badge-warning">🔒 Qulflangan</span>
                          )}
                          {isActive && !isCompleted && (
                            <span className="badge badge-primary">▶ Faol</span>
                          )}
                          {isCompleted && (
                            <span className="badge badge-success">✅ Bajarildi</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {mission.description}
                        </div>

                        {/* Expanded content when active */}
                        {isActive && !isCompleted && (
                          <div
                            style={{
                              marginTop: 16,
                              borderTop: '1px solid var(--bg-border)',
                              paddingTop: 16,
                            }}
                            className="animate-fadeUp"
                          >
                            {/* Mission-specific content */}
                            {mission.task && (
                              <div
                                style={{
                                  background: 'var(--bg-base)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '14px 16px',
                                  fontSize: 14,
                                  color: 'var(--text-primary)',
                                  lineHeight: 1.7,
                                  marginBottom: 12,
                                  fontStyle: 'italic',
                                }}
                              >
                                📌 {mission.task}
                              </div>
                            )}

                            {/* Vocabulary cards */}
                            {mission.type === 'vocabulary' && mission.words && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                                {mission.words.map((w, i) => (
                                  <div key={i} className="vocab-card">
                                    <div className="vocab-word">{w.word}</div>
                                    <div className="vocab-meaning">{w.meaning}</div>
                                    <div className="vocab-example">{w.example}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Speaking — link to speaking page */}
                            {mission.type === 'speaking' && (
                              <a href="/speaking" className="btn btn-primary btn-sm" style={{ marginBottom: 12 }}>
                                🎤 Speaking sahifasiga o'tish →
                              </a>
                            )}

                            {/* Complete button */}
                            <button
                              id={`complete-${mission.id}`}
                              className="btn btn-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                completeMission(mission);
                              }}
                            >
                              ✅ Bajarildi deb belgilash
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                        ⏱ {mission.durationMinutes} min
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom two columns */}
            <div className="grid-2">
              {/* Vocab section */}
              {plan.vocab?.length > 0 && (
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 14 }}>
                    📖 Bugungi So'zlar
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.vocab.map((v, i) => (
                      <div key={i} className="vocab-card">
                        <div className="vocab-word">{v.word}</div>
                        <div className="vocab-meaning">{v.meaning}</div>
                        <div className="vocab-example">{v.example}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Homework section */}
              {plan.homework && (
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 14 }}>✍️ Uy Vazifasi</div>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                      marginBottom: 12,
                    }}
                  >
                    {plan.homework.prompt}
                  </div>
                  {plan.homework.hint && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      💡 Maslahat: {plan.homework.hint}
                    </div>
                  )}
                  <a href="/writing" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>
                    ✍️ Writing sahifasida yozish →
                  </a>
                </div>
              )}
            </div>

            {/* Speaking Prompt */}
            {plan.speaking_prompt && (
              <div className="card-glow">
                <div className="section-title" style={{ marginBottom: 10 }}>
                  🎤 Bugungi Speaking Mavzu
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                  }}
                >
                  "{plan.speaking_prompt}"
                </div>
                <a href="/speaking" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                  🎤 Amaliyot qilish →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
