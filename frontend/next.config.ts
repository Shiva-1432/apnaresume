import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./src/lib/env";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const appUrl = env.NEXT_PUBLIC_APP_URL;
const apiUrl = env.NEXT_PUBLIC_API_BASE_URL;
const apiEndpoint = new URL(apiUrl);

const allowedOrigins = [appUrl, apiUrl]
  .map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      return value;
    }
  })
  .filter((value, index, array) => array.indexOf(value) === index);

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://clerk.com https://*.clerk.accounts.dev",
  `connect-src 'self' https://api.clerk.com ${allowedOrigins.join(' ')}`,
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev"
].join('; ');

// Performance budget: LCP < 2.5s, CLS < 0.1, TBT < 300ms
// Run `npm run lighthouse` before each release to verify
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: apiEndpoint.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiEndpoint.hostname,
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  // Bundle analyzer note: client chunks over 100KB (parsed size) were static/chunks/216-65f6803227862a2a.js (450KB), static/chunks/8279.e225d64f619c1496.js (311KB), static/chunks/main-2ae31e585d3caef4.js (272KB), static/chunks/4bd1b696-4acd3e7f46803f6e.js (200KB), static/chunks/framework-23997a6af2d97e0f.js (190KB), static/chunks/5286-25daa1fae9810057.js (122KB), and static/chunks/1270-182e2e3c3fdb1a0c.js (119KB).
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: true
});
