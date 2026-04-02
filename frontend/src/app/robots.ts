import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/resumes',
          '/upload',
          '/analysis',
          '/settings',
          '/history',
          '/analytics',
          '/support',
          '/job-matcher',
          '/skill-gap',
        ],
      },
    ],
    sitemap: 'https://apnaresume.com/sitemap.xml',
  };
}
