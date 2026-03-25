import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your ApnaResume account to get ATS score insights and resume optimization recommendations.',
  alternates: {
    canonical: '/signup',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
