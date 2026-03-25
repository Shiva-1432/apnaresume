import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center',
  description:
    'Create and track support tickets for account, billing, and feature-related help in ApnaResume.',
  alternates: {
    canonical: '/support',
  },
};

export default function SupportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
