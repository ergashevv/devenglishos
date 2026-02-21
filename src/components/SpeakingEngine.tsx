'use client';

import { useEffect, useRef, useState } from 'react';

interface SpeakingEngineProps {
  prompt?: string;
  onComplete?: () => void;
}

export default function SpeakingEngine({ prompt, onComplete }: SpeakingEngineProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'feedback'>('idle');
  const [timer, setTimer] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioSecondsRef = useRef(0);

  // Timer counting
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setFeedback(null);
    setTimer(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        // Transcribe
        await transcribeAudio(blob, audioSecondsRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setState('recording');
    } catch (err) {
      setError('Mikrofon ruxsati berilmadi. Brauzer microphone ruxsatini tekshiring.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      audioSecondsRef.current = timer;
      mediaRecorderRef.current.stop();
      setState('processing');
    }
  };

  const transcribeAudio = async (blob: Blob, audioSeconds: number) => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const transRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const transData = await transRes.json();

      if (!transData.transcript) throw new Error('Transcription failed');

      setTranscript(transData.transcript);

      // Get AI feedback
      const fbRes = await fetch('/api/speaking-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transData.transcript,
          prompt: prompt || '',
          audio_seconds: audioSeconds,
        }),
      });

      const fbData = await fbRes.json();
      setFeedback(fbData);

      // Log progress
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionType: 'speaking',
          speakingMinutes: Math.ceil(audioSeconds / 60),
        }),
      });

      setState('feedback');
      onComplete?.();
    } catch (err) {
      setError('Xatolik yuz berdi: ' + String(err));
      setState('idle');
    }
  };

  const reset = () => {
    setState('idle');
    setTranscript('');
    setFeedback(null);
    setError('');
    setTimer(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--status-success)';
    if (score >= 60) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Prompt */}
      {prompt && state !== 'feedback' && (
        <div
          style={{
            background: 'rgba(108,99,255,0.1)',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Speaking Prompt
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6 }}>{prompt}</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Recorder UI */}
      {state !== 'feedback' && (
        <div className="recorder-container">
          {state === 'processing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Ovozingiz tahlil qilinmoqda...
              </div>
            </div>
          ) : (
            <>
              {/* Waveform (visible when recording) */}
              {state === 'recording' && (
                <div className="waveform">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="wave-bar"
                      style={{ animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              )}

              {/* Timer */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 32,
                  fontWeight: 700,
                  color: state === 'recording' ? 'var(--status-error)' : 'var(--text-secondary)',
                }}
              >
                {formatTime(timer)}
              </div>

              {/* Record Button */}
              <button
                id="record-btn"
                className={`record-btn ${state === 'recording' ? 'recording' : ''}`}
                onClick={state === 'recording' ? stopRecording : startRecording}
                aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
              >
                {state === 'recording' ? '⏹' : '🎤'}
              </button>

              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {state === 'recording'
                  ? 'Davom etayotgan yozuv — to\'xtatish uchun bosing'
                  : 'Boshlash uchun bosing'}
              </div>
            </>
          )}
        </div>
      )}

      {/* Feedback Display */}
      {state === 'feedback' && feedback && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fadeUp">
          {/* Overall score */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${getScoreColor(feedback.overall || 0)}44`,
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Umumiy baho
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: getScoreColor(feedback.overall || 0),
                lineHeight: 1,
              }}
            >
              {Math.round(feedback.overall || 0)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>/ 100</div>
          </div>

          {/* Score breakdown */}
          {feedback.scores && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Batafsil baholar</div>
              <div className="score-grid">
                {Object.entries(feedback.scores).map(([key, val]) => (
                  <div key={key} className="score-item">
                    <div className="score-item-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                    <div className="score-item-value">{Math.round(val as number)}</div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${val}%`, background: getScoreColor(val as number) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>📝 Sizning nutqingiz</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {transcript}
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
              <div className="section-title" style={{ marginBottom: 12 }}>
                ⚠️ Xatolar ({feedback.mistakes.length})
              </div>
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

          {/* Motivation */}
          {feedback.motivation && (
            <div className="alert alert-success">
              <span>🌟</span>
              <span>{feedback.motivation}</span>
            </div>
          )}

          {/* Reset button */}
          <button id="speaking-reset-btn" className="btn btn-ghost w-full" onClick={reset}>
            🔄 Qayta mashq qilish
          </button>
        </div>
      )}
    </div>
  );
}
