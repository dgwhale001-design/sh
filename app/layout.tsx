import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '고래영어 · 이든수학 학생 관리',
  description: '출결, 학생 명단, 학습 기록을 한곳에서 관리하는 MVP 사이트',
  openGraph: {
    title: '고래영어 · 이든수학 학생 관리',
    description: '가상 명단 20명으로 구성한 학원 운영 MVP',
    images: [{ url: '/brand-logo.png', alt: '고래영어 이든수학 로고' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
