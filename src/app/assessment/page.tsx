'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssessmentResult {
  level: string;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendedGoal: string;
  estimatedWeeks: number;
}

const LEVEL_INFO: Record<string, { color: string; gradient: string; label: string; emoji: string }> = {
  A1: { color: '#ff6584', gradient: 'linear-gradient(135deg, #ff6584, #ff8c42)', label: 'Beginner', emoji: '🌱' },
  A2: { color: '#ff8c42', gradient: 'linear-gradient(135deg, #ff8c42, #ffd700)', label: 'Elementary', emoji: '🌿' },
  B1: { color: '#38b4ff', gradient: 'linear-gradient(135deg, #38b4ff, #6c63ff)', label: 'Intermediate', emoji: '🌳' },
  B2: { color: '#6c63ff', gradient: 'linear-gradient(135deg, #6c63ff, #a855f7)', label: 'Upper-Intermediate', emoji: '⭐' },
  C1: { color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b, #38b4ff)', label: 'Advanced', emoji: '🏆' },
  C2: { color: '#ffd700', gradient: 'linear-gradient(135deg, #ffd700, #43e97b)', label: 'Mastery', emoji: '👑' },
};

function TypingIndicator() {
  return (
    <div className="typing-bubble">
      <div className="typing-dot" style={{ animationDelay: '0ms' }} />
      <div className="typing-dot" style={{ animationDelay: '150ms' }} />
      <div className="typing-dot" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [phaseName, setPhaseName] = useState("The Foundation");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [savingName, setSavingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startAssessment = async () => {
    setIsStarted(true);
    setIsLoading(true);
    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', messages: [] }),
    });
    const data = await res.json();
    setMessages([data.message]);
    if (data.options) setCurrentOptions(data.options);
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setCurrentOptions([]); // Reset options
    setIsLoading(true);
    setMessageCount((c) => c + 1);

    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });
    const data = await res.json();

    if (data.message) {
      setMessages((prev) => [...prev, data.message]);
    }
    if (data.currentPhase) {
      setCurrentPhase(data.currentPhase);
      setPhaseName(data.phaseName);
    }
    if (data.options) {
      setCurrentOptions(data.options);
    }
    if (data.assessmentResult) {
      setAssessmentResult(data.assessmentResult);
    }
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveAndContinue = async () => {
    if (!assessmentResult) return;
    setIsSaving(true);

    await fetch('/api/user-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: savingName,
        ...assessmentResult,
        estimated_weeks: assessmentResult.estimatedWeeks,
        recommended_goal: assessmentResult.recommendedGoal,
      }),
    });

    setIsSaving(false);
    router.push('/roadmap');
  };

  const levelInfo = assessmentResult ? LEVEL_INFO[assessmentResult.level] || LEVEL_INFO['B1'] : null;

  // ─── Landing ──────────────────────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="assessment-landing-card">
            {/* Top badge */}
            <div className="assessment-hero-badge">✨ AI Assessment</div>

            <h1 className="assessment-hero-title">
              Ingliz tilida<br />
              <span className="gradient-text">qaysi darajadasiz?</span>
            </h1>
            <p className="assessment-hero-desc">
              AI mentor bilan 5-10 daqiqalik suhbat — savol va javob orqali aniqlaymiz
            </p>

            {/* Steps */}
            <div className="assessment-steps">
              {[
                { emoji: '💬', title: 'Suhbat', desc: '8-10 savolga javob' },
                { emoji: '🧠', title: 'AI Tahlil', desc: 'Daraja aniqlanadi' },
                { emoji: '🗺️', title: 'Roadmap', desc: 'Shaxsiy rejangiz' },
              ].map((step, i) => (
                <div key={i} className="assessment-step-card">
                  <div className="assessment-step-emoji">{step.emoji}</div>
                  <div className="assessment-step-title">{step.title}</div>
                  <div className="assessment-step-desc">{step.desc}</div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-lg assessment-start-btn" onClick={startAssessment}>
              ✨ Boshlash — Bepul
            </button>

            {/* Level chips */}
            <div className="assessment-levels-preview">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
                const info = LEVEL_INFO[lvl];
                return (
                  <div key={lvl} className="level-chip" style={{ background: `${info.color}18`, borderColor: `${info.color}35`, color: info.color }}>
                    {info.emoji} {lvl}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (assessmentResult) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40 }}>
          <div className="assessment-result-inner">
            <div className="result-confetti">🎉</div>
            <h2 className="result-title">Barakallo! Sizning darajangiz:</h2>

            <div className="result-level-card" style={{ background: levelInfo?.gradient }}>
              <div className="result-level-emoji">{levelInfo?.emoji}</div>
              <div className="result-level-code">{assessmentResult.level}</div>
              <div className="result-level-label">{levelInfo?.label}</div>
              <div className="result-confidence">{assessmentResult.confidence}% ishonch bilan</div>
            </div>

            <div className="result-summary-text" style={{ fontStyle: 'italic', borderLeft: '4px solid var(--brand-primary)', paddingLeft: 16 }}>
              {assessmentResult.summary}
            </div>

            {/* Strict Assessment Skills Breakdown */}
            {assessmentResult.skills_breakdown && (
              <div className="result-skills-grid">
                {Object.entries(assessmentResult.skills_breakdown).map(([skill, score]: [string, any]) => (
                  <div key={skill} className="skill-stat-card">
                    <div className="skill-stat-label">{skill.replace('_', ' ').toUpperCase()}</div>
                    <div className="skill-stat-bar-bg">
                      <div className="skill-stat-bar-fill" style={{ width: `${score}%` }} />
                    </div>
                    <div className="skill-stat-value">{score}%</div>
                  </div>
                ))}
              </div>
            )}

            <div className="result-sw-grid">
              <div className="result-sw-card result-strengths">
                <div className="result-sw-title">✅ ACADEMIC STRENGTHS</div>
                {assessmentResult.strengths?.map((s: string, i: number) => (
                  <div key={i} className="result-sw-item">{s}</div>
                ))}
              </div>
              <div className="result-sw-card result-weaknesses" style={{ borderColor: '#ff4d4d' }}>
                <div className="result-sw-title" style={{ color: '#ff4d4d' }}>❌ CRITICAL WEAKNESSES</div>
                {assessmentResult.weaknesses?.map((w: string, i: number) => (
                  <div key={i} className="result-sw-item">{w}</div>
                ))}
              </div>
            </div>

            {/* Error Log - Brutal Honesty */}
            {assessmentResult.error_log && assessmentResult.error_log.length > 0 && (
              <div className="error-log-section">
                <div className="error-log-title">⚠️ ERROR LOG (Academic Deviations)</div>
                <div className="error-log-list">
                  {assessmentResult.error_log.map((err: string, i: number) => (
                    <div key={i} className="error-log-item">{err}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="result-goal-card">
              <div className="result-goal-icon">🗺️</div>
              <div>
                <div className="result-goal-title">Maqsad</div>
                <div className="result-goal-text">{assessmentResult.recommendedGoal}</div>
                <div className="result-goal-weeks">⏱ {assessmentResult.estimatedWeeks} haftalik rejim</div>
              </div>
            </div>

            <div className="result-name-section">
              <label className="form-label">Ismingiz (ixtiyoriy)</label>
              <input
                className="form-input"
                placeholder="Masalan: Ali"
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} onClick={saveAndContinue} disabled={isSaving}>
              {isSaving ? '⏳ Saqlanmoqda...' : '🗺️ Roadmapni Ko\'rish →'}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => { setMessages([]); setAssessmentResult(null); setIsStarted(false); setMessageCount(0); }}>
              🔄 Qaytadan boshlash
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────
  const progress = Math.min(messageCount * 10, 100);

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Chat takes full remaining height */}
      <div className="chat-page-wrapper">
        {/* ── Header ── */}
        <div className="chat-header">
          {/* Left: avatar + name */}
          <div className="chat-header-left">
            <div className="chat-header-avatar" style={{ background: '#121212', border: '1px solid #333' }}>
              <span style={{ fontSize: 20 }}>⚖️</span>
            </div>
            <div>
              <div className="chat-header-name">English Guardian</div>
              <div className="chat-header-status">
                <span className="phase-indicator">Phase {currentPhase}: {phaseName}</span>
              </div>
            </div>
          </div>

          {/* Right: progress */}
          <div className="chat-header-right">
            <div className="chat-progress-label">
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Data Points: {messageCount}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>(Min 15 eq.)</span>
            </div>
            <div className="chat-progress-track" style={{ height: 6 }}>
              <div className="chat-progress-fill" style={{ width: `${Math.min((messageCount / 15) * 100, 100)}%`, background: 'var(--brand-primary)' }} />
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="chat-messages">
          {/* Welcome shimmer if no messages yet */}
          {messages.length === 0 && !isLoading && (
            <div className="chat-empty-state">
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>AI Mentor javob tayyorlamoqda...</div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-row ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chat-avatar-sm">🧠</div>
              )}
              <div className={`chat-bubble ${msg.role}`}>
                <div
                  className="chat-bubble-text"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
              {msg.role === 'user' && (
                <div className="chat-avatar-sm user">U</div>
              )}
            </div>
          ))}

          {currentOptions.length > 0 && (
            <div className="chat-options-container animate-fadeUp">
              {currentOptions.map((opt, i) => (
                <button
                  key={i}
                  className="chat-option-btn"
                  onClick={() => sendMessage(opt)}
                  disabled={isLoading}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="chat-row assistant">
              <div className="chat-avatar-sm">🧠</div>
              <TypingIndicator />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── Input ── */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Javobingizni yozing..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="chat-input-hint">Enter — yuborish · ESC — bekor qilish</div>
        </div>
      </div>
    </div>
  );
}
