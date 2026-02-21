'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface VocabWord {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  uzbekMeaning: string;
  example: string;
  exampleUz: string;
  difficulty: 'easy' | 'medium' | 'hard';
  synonyms: string[];
  tip?: string;
}

interface VocabSession {
  id: number;
  date: string;
  level: string;
  topic: string;
  words: VocabWord[];
  learned_ids: string[];
}

const DIFFICULTY_CONFIG = {
  easy: { color: '#43e97b', bg: 'rgba(67,233,123,0.12)', label: 'Oson' },
  medium: { color: '#38b4ff', bg: 'rgba(56,180,255,0.12)', label: "O'rta" },
  hard: { color: '#ff6584', bg: 'rgba(255,101,132,0.12)', label: 'Qiyin' },
};

const TOPICS = [
  'Everyday life', 'Business English', 'Technology & IT', 'Travel & Tourism',
  'Health & Medicine', 'Environment', 'Education', 'Food & Cooking',
];

function FlashCard({ word, learned, onLearn }: {
  word: VocabWord;
  learned: boolean;
  onLearn: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const diff = DIFFICULTY_CONFIG[word.difficulty] || DIFFICULTY_CONFIG.medium;

  return (
    <div
      className={`flashcard-wrapper ${learned ? 'learned' : ''}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div className="flashcard-front">
          <div className="flashcard-difficulty" style={{ background: diff.bg, color: diff.color }}>
            {diff.label}
          </div>
          <div className="flashcard-word">{word.word}</div>
          <div className="flashcard-pronunciation">{word.pronunciation}</div>
          <div className="flashcard-pos">{word.partOfSpeech}</div>
          <div className="flashcard-hint">Karta ustiga bosing — ma&apos;nosini ko&apos;ring</div>
          {learned && <div className="flashcard-learned-badge">✓ O&apos;rganildi</div>}
        </div>

        {/* Back */}
        <div className="flashcard-back">
          <div className="flashcard-meaning-en">{word.meaning}</div>
          <div className="flashcard-meaning-uz">🇺🇿 {word.uzbekMeaning}</div>

          <div className="flashcard-example">
            <div className="flashcard-example-label">Misol:</div>
            <div className="flashcard-example-text">{word.example}</div>
            <div className="flashcard-example-uz">{word.exampleUz}</div>
          </div>

          {word.synonyms?.length > 0 && (
            <div className="flashcard-synonyms">
              {word.synonyms.slice(0, 3).map((s, i) => (
                <span key={i} className="synonym-chip">{s}</span>
              ))}
            </div>
          )}

          {word.tip && (
            <div className="flashcard-tip">
              💡 {word.tip}
            </div>
          )}
        </div>
      </div>

      {!learned && (
        <button
          className="btn btn-success btn-sm flashcard-learn-btn"
          onClick={(e) => { e.stopPropagation(); onLearn(); }}
        >
          ✓ O&apos;rgandim
        </button>
      )}
    </div>
  );
}

export default function VocabularyPage() {
  const [session, setSession] = useState<VocabSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [userLevel, setUserLevel] = useState('B1');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const res = await fetch('/api/vocabulary').then(r => r.json());
        if (res.session) {
          setSession(res.session);
          setLearnedIds(new Set(res.session.learned_ids || []));
        }
      } catch {}
      setLoading(false);
    }

    async function init() {
      // Get user level
      try {
        const pr = await fetch('/api/user-profile').then(r => r.json());
        if (pr.profile?.level) setUserLevel(pr.profile.level);
      } catch {}

      // Load today's session
      await loadSession();
    }
    init();
  }, []);

  async function generateSession() {
    setGenerating(true);
    try {
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', level: userLevel, topic: selectedTopic }),
      }).then(r => r.json());
      setSession(res.session);
      setLearnedIds(new Set());
    } catch {}
    setGenerating(false);
  }

  async function markLearned(wordId: string) {
    if (!session) return;
    const newLearned = new Set([...learnedIds, wordId]);
    setLearnedIds(newLearned);
    await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'markLearned',
        sessionId: session.id,
        learnedIds: [...newLearned],
      }),
    }).catch(() => {});
  }

  const words = session?.words || [];
  const filteredWords = filterDifficulty === 'all'
    ? words
    : words.filter(w => w.difficulty === filterDifficulty);
  const learnedCount = learnedIds.size;
  const totalCount = words.length;
  const progressPct = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">📖 Vocabulary</h1>
              <p className="page-subtitle">Kunlik 10 ta yangi so&apos;z — kartochkalar bilan o&apos;rganing</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="tabs" style={{ margin: 0 }}>
                <button className={`tab-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>🃏 Kartalar</button>
                <button className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📋 Ro&apos;yxat</button>
              </div>
              <div className={`level-badge level-${userLevel.toLowerCase()}`}>{userLevel}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {session && (
          <div className="vocab-progress-bar animate-fadeUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>{learnedCount}</span>/{totalCount} so&apos;z o&apos;rganildi
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                📌 {session.topic}
              </div>
            </div>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill green" style={{ width: `${progressPct}%` }} />
            </div>
            {learnedCount === totalCount && totalCount > 0 && (
              <div className="alert alert-success animate-fadeUp" style={{ marginTop: 12 }}>
                🎉 Barakallo! Bugungi barcha so&apos;zlarni o&apos;rgandingiz!
              </div>
            )}
          </div>
        )}

        {/* Generate / New Session Panel */}
        {!session && !loading && (
          <div className="vocab-generate-panel animate-fadeUp">
            <div className="vocab-gen-icon">📖</div>
            <div className="vocab-gen-title">Bugungi so&apos;zlarni yarating</div>
            <div className="vocab-gen-desc">AI sizning darajangizga mos 10 ta yangi so&apos;z tayyorlaydi</div>

            <div className="vocab-gen-form">
              <div className="form-group">
                <label className="form-label">Mavzu tanlang</label>
                <div className="topic-chips">
                  {TOPICS.map(t => (
                    <button
                      key={t}
                      className={`topic-chip ${selectedTopic === t ? 'active' : ''}`}
                      onClick={() => setSelectedTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={generateSession}
              disabled={generating}
            >
              {generating ? '⏳ AI so\'zlar tayyorlayapti...' : '✨ So\'zlarni Yaratish'}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* Filter + Refresh */}
        {session && !loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'easy', 'medium', 'hard'] as const).map(f => (
                <button
                  key={f}
                  className={`tab-btn ${filterDifficulty === f ? 'active' : ''}`}
                  onClick={() => setFilterDifficulty(f)}
                >
                  {f === 'all' ? 'Hammasi' : DIFFICULTY_CONFIG[f].label}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={generateSession} disabled={generating}>
              {generating ? '⏳' : '🔄 Yangi so\'zlar'}
            </button>
          </div>
        )}

        {/* Cards View */}
        {session && !loading && viewMode === 'cards' && (
          <div className="flashcards-grid">
            {filteredWords.map(word => (
              <FlashCard
                key={word.id}
                word={word}
                learned={learnedIds.has(word.id)}
                onLearn={() => markLearned(word.id)}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {session && !loading && viewMode === 'list' && (
          <div className="vocab-list">
            {filteredWords.map((word, i) => {
              const diff = DIFFICULTY_CONFIG[word.difficulty] || DIFFICULTY_CONFIG.medium;
              const isLearned = learnedIds.has(word.id);
              return (
                <div key={word.id} className={`vocab-list-item ${isLearned ? 'learned' : ''}`}>
                  <div className="vocab-list-num" style={{ color: 'var(--text-muted)' }}>{i + 1}</div>
                  <div className="vocab-list-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="vocab-list-word">{word.word}</span>
                      <span className="vocab-list-pron">{word.pronunciation}</span>
                      <span className="vocab-list-pos">{word.partOfSpeech}</span>
                      <span className="vocab-diff-badge" style={{ background: diff.bg, color: diff.color }}>{diff.label}</span>
                    </div>
                    <div className="vocab-list-meaning">{word.meaning}</div>
                    <div className="vocab-list-meaning-uz">🇺🇿 {word.uzbekMeaning}</div>
                    <div className="vocab-list-example">{word.example}</div>
                    {word.synonyms?.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {word.synonyms.slice(0, 3).map((s, j) => (
                          <span key={j} className="synonym-chip">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!isLearned ? (
                    <button className="btn btn-success btn-sm" onClick={() => markLearned(word.id)}>
                      ✓ O&apos;rgandim
                    </button>
                  ) : (
                    <div className="vocab-learned-check">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
