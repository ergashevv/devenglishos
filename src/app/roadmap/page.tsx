'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface RoadmapPhase {
  phase: number;
  title: string;
  weeks: string;
  focus: string;
  color: string;
  emoji: string;
  skills: Array<{
    name: string;
    description: string;
    weeklyGoal: string;
    resources: string[];
  }>;
  milestones: string[];
  weeklySchedule: Record<string, string>;
}

interface Roadmap {
  currentLevel: string;
  targetLevel: string;
  totalWeeks: number;
  dailyMinutes: number;
  phases: RoadmapPhase[];
  tips: string[];
  resources: {
    apps: string[];
    websites: string[];
    youtube: string[];
  };
}

interface UserProfile {
  name: string;
  level: string;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommended_goal: string;
  estimated_weeks: number;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<string, string> = {
  Monday: 'Dushanba', Tuesday: 'Seshanba', Wednesday: 'Chorshanba',
  Thursday: 'Payshanba', Friday: 'Juma', Saturday: 'Shanba', Sunday: 'Yakshanba'
};

export default function RoadmapPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'schedule' | 'resources'>('roadmap');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/user-profile');
        const data = await res.json();
        if (!data.profile || !data.profile.assessment_done) {
          router.push('/assessment');
          return;
        }
        setProfile(data.profile);

        // Generate roadmap
        setGenerating(true);
        const rm = await fetch('/api/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: data.profile.level,
            strengths: data.profile.strengths,
            weaknesses: data.profile.weaknesses,
            estimatedWeeks: data.profile.estimated_weeks,
            name: data.profile.name,
          }),
        });
        const rmData = await rm.json();
        setRoadmap(rmData.roadmap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    }
    load();
  }, [router]);

  if (loading || generating) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="roadmap-loading">
            <div className="roadmap-loading-icon">🗺️</div>
            <div className="roadmap-loading-title">
              {generating ? 'AI Roadmap tuzmoqda...' : "Ma'lumotlar yuklanmoqda..."}
            </div>
            <div className="roadmap-loading-desc">
              Darajangizga mos shaxsiy yo&apos;l haritasi yaratilmoqda
            </div>
            <div className="roadmap-loading-bars">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile || !roadmap) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="alert alert-error">Roadmap topilmadi. <a href="/assessment" className="btn btn-primary btn-sm">Assessment boshlash →</a></div>
        </main>
      </div>
    );
  }

  const currentPhase = roadmap.phases[activePhase];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">🗺️ Shaxsiy Roadmap</h1>
              <p className="page-subtitle">
                {profile.name ? `${profile.name}ning ` : ''}
                {profile.level} → {roadmap.targetLevel} sayohati · {roadmap.totalWeeks} hafta
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className={`level-badge level-${profile.level.toLowerCase()}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                {profile.level}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/assessment')}>
                🔄 Qayta test
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="roadmap-stats-row">
          <div className="roadmap-stat animate-fadeUp">
            <div className="roadmap-stat-value">{roadmap.totalWeeks}</div>
            <div className="roadmap-stat-label">📅 Hafta</div>
          </div>
          <div className="roadmap-stat animate-fadeUp stagger-2">
            <div className="roadmap-stat-value">{roadmap.dailyMinutes}</div>
            <div className="roadmap-stat-label">⏱ Kun/daqiqa</div>
          </div>
          <div className="roadmap-stat animate-fadeUp stagger-3">
            <div className="roadmap-stat-value">{roadmap.phases.length}</div>
            <div className="roadmap-stat-label">🎯 Bosqich</div>
          </div>
          <div className="roadmap-stat animate-fadeUp stagger-4">
            <div className="roadmap-stat-value">{roadmap.targetLevel}</div>
            <div className="roadmap-stat-label">🏆 Maqsad</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          {(['roadmap', 'schedule', 'resources'] as const).map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'roadmap' ? '🗺️ Bosqichlar' : tab === 'schedule' ? '📅 Haftalik jadval' : '📚 Resurslar'}
            </button>
          ))}
        </div>

        {/* TAB: Roadmap Phases */}
        {activeTab === 'roadmap' && (
          <div className="roadmap-content">
            {/* Phase Timeline */}
            <div className="phase-timeline">
              {roadmap.phases.map((phase, i) => (
                <button
                  key={i}
                  className={`phase-timeline-item ${activePhase === i ? 'active' : ''}`}
                  onClick={() => setActivePhase(i)}
                  style={{
                    borderColor: activePhase === i ? phase.color : 'transparent',
                    background: activePhase === i ? `${phase.color}22` : 'var(--bg-elevated)',
                  }}
                >
                  <div className="phase-timeline-emoji">{phase.emoji}</div>
                  <div className="phase-timeline-info">
                    <div className="phase-timeline-title">Bosqich {phase.phase}</div>
                    <div className="phase-timeline-weeks">{phase.weeks}-hafta</div>
                  </div>
                  {activePhase === i && <div className="phase-timeline-active-dot" style={{ background: phase.color }} />}
                </button>
              ))}
            </div>

            {/* Active Phase Detail */}
            {currentPhase && (
              <div className="phase-detail animate-fadeUp">
                {/* Phase header */}
                <div className="phase-detail-header" style={{ borderColor: currentPhase.color + '44' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="phase-detail-icon" style={{ background: currentPhase.color + '22', fontSize: 32 }}>
                      {currentPhase.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                        Bosqich {currentPhase.phase} · {currentPhase.weeks}-hafta
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {currentPhase.title}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {currentPhase.focus}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="phase-skills-grid">
                  {currentPhase.skills.map((skill, i) => (
                    <div key={i} className="phase-skill-card">
                      <div className="phase-skill-name">{skill.name}</div>
                      <div className="phase-skill-desc">{skill.description}</div>
                      <div className="phase-skill-goal">
                        <span>🎯</span> {skill.weeklyGoal}
                      </div>
                      <div className="phase-skill-resources">
                        {skill.resources.map((r, j) => (
                          <span key={j} className="resource-chip">{r}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Milestones */}
                <div className="card" style={{ marginTop: 20 }}>
                  <div className="section-title" style={{ marginBottom: 14 }}>🏁 Bu bosqich milestones</div>
                  <div className="milestones-list">
                    {currentPhase.milestones.map((m, i) => (
                      <div key={i} className="milestone-item">
                        <div className="milestone-check" style={{ background: currentPhase.color + '33', borderColor: currentPhase.color }}>
                          <span style={{ color: currentPhase.color, fontSize: 12 }}>✓</span>
                        </div>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  {activePhase > 0 && (
                    <button className="btn btn-ghost" onClick={() => setActivePhase(activePhase - 1)}>
                      ← Oldingi bosqich
                    </button>
                  )}
                  {activePhase < roadmap.phases.length - 1 && (
                    <button className="btn btn-primary" onClick={() => setActivePhase(activePhase + 1)}>
                      Keyingi bosqich →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Weekly Schedule */}
        {activeTab === 'schedule' && currentPhase && (
          <div className="weekly-schedule animate-fadeUp">
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 6 }}>📅 Haftalik jadval</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Bosqich {currentPhase.phase}: {currentPhase.title} · {roadmap.dailyMinutes} daqiqa/kun
              </div>
            </div>

            <div className="schedule-grid">
              {DAYS_ORDER.map((day) => {
                const task = currentPhase.weeklySchedule?.[day];
                const isWeekend = day === 'Saturday' || day === 'Sunday';
                return (
                  <div key={day} className={`schedule-day-card ${isWeekend ? 'weekend' : ''}`}>
                    <div className="schedule-day-name">
                      {isWeekend ? '🌞 ' : '⚡ '}{DAY_SHORT[day]}
                    </div>
                    <div className="schedule-day-task">{task || 'Dam olish'}</div>
                    {!isWeekend && (
                      <div className="schedule-day-mins">
                        ⏱ {roadmap.dailyMinutes} min
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            <div className="card" style={{ marginTop: 20 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>💡 Mentordan maslahatlar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {roadmap.tips.map((tip, i) => (
                  <div key={i} className="tip-item">
                    <div className="tip-number">{i + 1}</div>
                    <div className="tip-text">{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Resources */}
        {activeTab === 'resources' && roadmap.resources && (
          <div className="resources-content animate-fadeUp">
            <div className="resources-grid">
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>📱 Ilovalar</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roadmap.resources.apps?.map((app, i) => (
                    <div key={i} className="resource-item">
                      <span className="resource-icon">📱</span>
                      <span className="resource-name">{app}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>🌐 Websaytlar</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roadmap.resources.websites?.map((site, i) => (
                    <div key={i} className="resource-item">
                      <span className="resource-icon">🌐</span>
                      <span className="resource-name">{site}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>▶️ YouTube Kanallar</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roadmap.resources.youtube?.map((yt, i) => (
                    <div key={i} className="resource-item">
                      <span className="resource-icon">▶️</span>
                      <span className="resource-name">{yt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile summary */}
            <div className="card-glow" style={{ marginTop: 20 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>🧠 Sizning profilingiz</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                {profile.summary}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-success">💪 {profile.strengths?.join(' · ')}</span>
                <span className="badge badge-warning">🎯 {profile.weaknesses?.join(' · ')}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
