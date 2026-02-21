import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevEnglish OS — AI English Mentor',
  description:
    'Autonomous AI English mentor for software developers. Daily plans, speaking practice, evaluations, and adaptive learning.',
  keywords: ['English learning', 'AI mentor', 'speaking practice', 'software developer', 'CEFR'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: '/logo.png',
  },
  openGraph: {
    title: 'DevEnglish OS — AI English Mentor',
    description: 'Autonomous AI English mentor for developers',
    images: ['/logo.png'],
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
