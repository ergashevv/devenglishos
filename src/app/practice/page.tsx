'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';

export default function PracticePage() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [listeningDone, setListeningDone] = useState(false);
  const [listeningMin, setListeningMin] = useState(10);
  const [vocabInput, setVocabInput] = useState<Record<string, string>>({});
  const [sentencesSubmitted, setSentencesSubmitted] = useState(false);
  const [logMessage, setLogMessage] = useState('');

  useEffect(() => {
    fetch('/api/today-plan')
      .then((r) => r.json())
      .then((data) => {
        setPlan(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logListening = async () => {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionType: 'listening', listeningMinutes: listeningMin }),
    });
    const data = await res.json();
    setListeningDone(true);
    setLogMessage(`✅ ${listeningMin} daqiqa kiritildi! Streak: ${data.streak}`);
  };

  const logVocab = async () => {
    const words = Object.keys(vocabInput);
    if (words.length === 0) return;
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionType: 'vocabulary', vocab: words }),
    });
    setSentencesSubmitted(true);
    setLogMessage("✅ So'zlar saqlandi!");
  };

  const vocab = plan?.vocab || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">📚 Practice Engine</h1>
          <p className="page-subtitle">
            Listening, Vocabulary va Writing mashqlari — har kuni yangi
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {logMessage && (
              <div className="alert alert-success animate-fadeUp">{logMessage}</div>
            )}

            {/* Listening Task */}
            <div className="card animate-fadeUp stagger-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div
                  className="mission-type-icon"
                  style={{ background: 'rgba(56,180,255,0.15)', fontSize: 24 }}
                >
                  🎧
                </div>
                <div>
                  <div className="section-title">Listening Practice</div>
                  <div className="section-subtitle">
                    Podcast yoki YouTube ko'ring, keyin daqiqalarni kiriting
                  </div>
                </div>
              </div>

              {/* Mission task */}
              {plan?.missions?.find((m: any) => m.type === 'listening')?.task && (
                <div
                  style={{
                    background: 'rgba(56,180,255,0.06)',
                    border: '1px solid rgba(56,180,255,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    marginBottom: 16,
                    lineHeight: 1.7,
                  }}
                >
                  📌 {plan.missions.find((m: any) => m.type === 'listening').task}
                </div>
              )}

              {/* Resources */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: '🎙️ English Speaking Practice', url: 'https://www.youtube.com/c/EnglishSpeakingCourse' },
                  { label: '📻 BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish' },
                  { label: '🎧 TED Talks', url: 'https://www.ted.com' },
                ].map((r) => (
                  <a
                    key={r.label}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    {r.label} ↗
                  </a>
                ))}
              </div>

              {!listeningDone ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>Eshitildi:</label>
                    <input
                      id="listening-minutes-input"
                      type="number"
                      className="form-input"
                      style={{ width: 80 }}
                      min={1}
                      max={120}
                      value={listeningMin}
                      onChange={(e) => setListeningMin(parseInt(e.target.value) || 1)}
                    />
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>daqiqa</span>
                  </div>
                  <button
                    id="log-listening-btn"
                    className="btn btn-primary btn-sm"
                    onClick={logListening}
                  >
                    ✅ Kiritish
                  </button>
                </div>
              ) : (
                <div className="badge badge-success">✅ Bajarildi — {listeningMin} daqiqa</div>
              )}
            </div>

            {/* Vocabulary Task */}
            {vocab.length > 0 && (
              <div className="card animate-fadeUp stagger-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div className="mission-type-icon" style={{ background: 'rgba(255,215,0,0.15)', fontSize: 24 }}>
                    📖
                  </div>
                  <div>
                    <div className="section-title">Vocabulary Building</div>
                    <div className="section-subtitle">
                      Har bir so'zni gapda ishlating — bu sizning lug'atni mustahkamlaydi
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {vocab.map((v: any, i: number) => (
                    <div key={i} className="vocab-card">
                      <div className="vocab-word">{v.word}</div>
                      <div className="vocab-meaning">{v.meaning}</div>
                      <div className="vocab-example">{v.example}</div>
                    </div>
                  ))}
                </div>

                {!sentencesSubmitted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="section-subtitle" style={{ marginBottom: 4 }}>
                      ✍️ Har bir so'zni o'z gapingizda ishlating:
                    </div>
                    {vocab.map((v: any, i: number) => (
                      <div key={i} className="form-group">
                        <label className="form-label" style={{ color: '#a39dff' }}>{v.word}</label>
                        <input
                          id={`vocab-input-${i}`}
                          className="form-input"
                          placeholder={`Use "${v.word}" in a sentence...`}
                          value={vocabInput[v.word] || ''}
                          onChange={(e) =>
                            setVocabInput((prev) => ({ ...prev, [v.word]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                    <button
                      id="submit-vocab-btn"
                      className="btn btn-success"
                      onClick={logVocab}
                      disabled={Object.keys(vocabInput).length < vocab.length}
                    >
                      ✅ Jumlalarni saqlash
                    </button>
                  </div>
                )}
                {sentencesSubmitted && (
                  <div className="badge badge-success">✅ So'zlar saqlandi!</div>
                )}
              </div>
            )}

            {/* Writing redirect */}
            <div
              className="card animate-fadeUp stagger-3"
              style={{
                background: 'linear-gradient(135deg, rgba(67,233,123,0.08) 0%, rgba(56,180,255,0.06) 100%)',
                border: '1px solid rgba(67,233,123,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="mission-type-icon" style={{ background: 'rgba(67,233,123,0.15)', fontSize: 24 }}>
                  ✍️
                </div>
                <div style={{ flex: 1 }}>
                  <div className="section-title">Writing Homework</div>
                  {plan?.homework?.prompt && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
                      {plan.homework.prompt}
                    </div>
                  )}
                </div>
                <a href="/writing" className="btn btn-success btn-sm">
                  Yozishga o'tish →
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
