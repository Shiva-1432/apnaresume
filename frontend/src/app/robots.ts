import type { MetadataRoute } from 'next';
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/faq', '/support', '/sign-in', '/sign-up', '/terms', '/privacy', '/job-matcher', '/fresher-mode'],
      disallow: ['/dashboard', '/admin', '/settings', '/verify-email', '/reset-password', '/forgot-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
