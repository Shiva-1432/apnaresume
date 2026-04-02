import type { MetadataRoute } from 'next';
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/job-matcher`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/fresher-mode`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    }
  ];
}
