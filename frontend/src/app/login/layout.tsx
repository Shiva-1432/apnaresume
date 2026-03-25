import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your ApnaResume account to analyze and improve your resume.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
