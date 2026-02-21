import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevEnglish OS — AI English Mentor',
  description:
    'Autonomous AI English mentor for software developers. Daily plans, speaking practice, evaluations, and adaptive learning.',
  keywords: ['English learning', 'AI mentor', 'speaking practice', 'software developer'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
