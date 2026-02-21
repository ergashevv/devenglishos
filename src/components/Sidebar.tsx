'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'Dashboard' },
  { href: '/assessment', icon: '🎯', label: 'Assessment' },
  { href: '/roadmap', icon: '🗺️', label: 'Roadmap' },
  { href: '/vocabulary', icon: '📖', label: 'Vocabulary' },
  { href: '/homework', icon: '✍️', label: 'Homework' },
  { href: '/speaking', icon: '🎤', label: 'Speaking' },
  { href: '/writing', icon: '📝', label: 'Writing' },
  { href: '/progress', icon: '📊', label: 'Progress' },
  { href: '/evaluation', icon: '🧪', label: 'Evaluation' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number>(0);
  const [level, setLevel] = useState<string>('A2');

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then((d) => {
        if (d.progress) {
          setStreak(d.progress.streak || 0);
          setLevel(d.progress.current_level || 'A2');
        }
      })
      .catch(() => {});
  }, []);

  const levelClass = `level-${level.toLowerCase()}`;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Image
            src="/logo.png"
            alt="DevEnglish OS Logo"
            width={40}
            height={40}
            style={{ borderRadius: 10, objectFit: 'cover' }}
          />
        </div>
        <div>
          <div className="sidebar-logo-text">DevEnglish OS</div>
          <div className="sidebar-logo-sub">AI Mentor Platform</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-section-title">Navigation</div>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Level + Streak */}
      <div className="sidebar-streak">
        <div className="streak-flame">🔥</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            day streak
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className={`level-badge ${levelClass}`}>{level}</span>
        </div>
      </div>
    </aside>
  );
}
