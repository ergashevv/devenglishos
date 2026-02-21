'use client';

import Sidebar from '@/components/Sidebar';
import SpeakingEngine from '@/components/SpeakingEngine';
import { useEffect, useState } from 'react';

export default function SpeakingPage() {
  const [prompt, setPrompt] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    async function loadPrompt() {
      try {
        const data = await fetch('/api/today-plan').then((r) => r.json());
        if (data.speaking_prompt) setPrompt(data.speaking_prompt);
      } catch {}
      setLoadingPrompt(false);
    }
    loadPrompt();
  }, []);

  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const activePrompt = useCustom && customPrompt ? customPrompt : prompt;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">🎤 Speaking Engine</h1>
          <p className="page-subtitle">
            Ovozingizni yozib oling — AI sizning nutqingizni tahlil qiladi va batafsil fikr bildiradi
          </p>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Engine */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Prompt selector */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>📌 Mavzu tanlash</div>

              {loadingPrompt ? (
                <div className="skeleton" style={{ height: 48 }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Today's AI prompt */}
                  <div
                    style={{
                      background: useCustom ? 'var(--bg-elevated)' : 'rgba(108,99,255,0.1)',
                      border: `1px solid ${useCustom ? 'var(--bg-border)' : 'rgba(108,99,255,0.4)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setUseCustom(false)}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      AI tomonidan tavsiya etilgan
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {prompt || 'Mavzu yuklanmoqda...'}
                    </div>
                  </div>

                  {/* Custom prompt toggle */}
                  <button
                    className={`btn btn-ghost btn-sm`}
                    onClick={() => setUseCustom(!useCustom)}
                    id="custom-prompt-toggle"
                  >
                    {useCustom ? '← AI mavzusiga qaytish' : '✏️ O\'z mavzumni yozaman'}
                  </button>

                  {useCustom && (
                    <div className="animate-fadeUp">
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Your speaking prompt in English..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        id="custom-prompt-input"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Speaking Engine */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>
                🎙️ Amaliyot ({sessionCount} ta sessiya)
              </div>
              <SpeakingEngine
                prompt={activePrompt}
                onComplete={() => setSessionCount((c) => c + 1)}
              />
            </div>
          </div>

          {/* Right: Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>💡 Speaking Maslahatlar</div>
              {[
                { icon: '🗣️', tip: 'Sekin va aniq gapiring. Tezlik muhim emas — ravshan ifoda muhim.' },
                { icon: '⏸️', tip: "Pause qilishdan qo'rqmang. Tabiiy pauza professional ko'rinadi." },
                { icon: '📚', tip: "Bugungi so'zlar ro'yxatidan foydalaning — bu sizni baholaydi." },
                { icon: '🔄', tip: 'Har gal turli grammatik konstruksiyalar ishlating.' },
                { icon: '📝', tip: "Avval bir daqiqa rejalashtiring, keyin gapiring — bu fluency'ni oshiradi." },
                { icon: '🎯', tip: "STAR format: Situation → Task → Action → Result. Interview uchun ideal." },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < 5 ? '1px solid var(--bg-border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.tip}
                  </span>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--bg-elevated)' }}>
              <div className="section-title" style={{ marginBottom: 12 }}>📊 Scoring Tizimi</div>
              {[
                { label: 'Fluency', desc: 'Gapirish ravonligi', color: 'var(--brand-primary)' },
                { label: 'Grammar', desc: 'Grammatik to\'g\'rilik', color: 'var(--level-b2)' },
                { label: 'Vocabulary', desc: 'So\'z boyligi', color: 'var(--brand-gold)' },
                { label: 'Clarity', desc: 'Talaffuz aniqligi', color: 'var(--status-success)' },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: s.color }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 – 100</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
