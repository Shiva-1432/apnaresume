import type { Metadata } from 'next';
import TermsOfService from '@/components/LegalPages/TermsOfService';

export const metadata: Metadata = {
  title: 'ApnaResume Terms of Service — Platform Usage and Responsibilities',
  description:
    'Read the ApnaResume terms covering acceptable use, user responsibilities, subscription terms, and service limitations.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'ApnaResume Terms of Service',
    description: 'Platform usage terms, responsibilities, and limitations.',
    url: 'https://apnaresume.com/terms',
    siteName: 'ApnaResume',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApnaResume Terms of Service',
    description: 'Platform usage terms, responsibilities, and limitations.',
    images: ['/og-image.png'],
  },
};

export default function TermsPage() {
  return <TermsOfService />;
}
