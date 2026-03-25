import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fresher Resume Builder',
  description:
    'Build your first ATS-friendly resume with role-specific guidance for freshers.',
  alternates: {
    canonical: '/fresher-mode',
  },
};

export default function FresherModeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
