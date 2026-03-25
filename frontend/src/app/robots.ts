import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/faq', '/support', '/login', '/signup', '/terms', '/privacy', '/job-matcher', '/fresher-mode'],
      disallow: ['/dashboard', '/admin', '/settings', '/verify-email', '/reset-password', '/forgot-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
