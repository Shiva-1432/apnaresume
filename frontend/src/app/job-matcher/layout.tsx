import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Matcher',
  description:
    'Match your resume against a job description with AI and get role-specific improvements.',
  alternates: {
    canonical: '/job-matcher',
  },
};

export default function JobMatcherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
