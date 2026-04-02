import type { Metadata } from 'next';
import PrivacyPolicy from '@/components/LegalPages/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'ApnaResume Privacy Policy — Data Use and Protection',
  description:
    'Learn how ApnaResume collects, processes, stores, and protects your data, including uploaded resumes and account information.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'ApnaResume Privacy Policy',
    description: 'How your resume and account data are used and protected.',
    url: 'https://apnaresume.com/privacy',
    siteName: 'ApnaResume',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApnaResume Privacy Policy',
    description: 'How your resume and account data are used and protected.',
    images: ['/og-image.png'],
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
