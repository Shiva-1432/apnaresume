import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read ApnaResume terms of service, usage policy, and account responsibilities.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
