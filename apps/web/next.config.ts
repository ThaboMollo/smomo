import type { NextConfig } from 'next';

// Applied to every response. Kept CSP-free on purpose: Next's inline runtime +
// the pre-paint theme script would need per-request nonces, which is a larger
// change — these headers give the high-value protections without that risk.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  // Fail the production build on type errors instead of shipping them.
  typescript: { ignoreBuildErrors: false },
  poweredByHeader: false,
  images: {
    // Remote images (portfolios, avatars) come from Supabase Storage and Unsplash.
    remotePatterns: [
      { protocol: 'https', hostname: 'ltnjiihfgvwtzrmtkclh.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        // The service worker must always revalidate so users get updates promptly.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
