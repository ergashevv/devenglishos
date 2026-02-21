'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = 'var(--brand-primary)',
}: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="score-ring-label">
        {label && (
          <div
            style={{
              fontSize: size < 100 ? 18 : 24,
              fontWeight: 900,
              color,
              lineHeight: 1,
            }}
          >
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
}
