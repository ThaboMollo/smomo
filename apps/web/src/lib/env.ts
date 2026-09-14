// Server-side uses API_URL; browser uses NEXT_PUBLIC_API_URL. Falls back to local dev.
export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smomo.vercel.app';
export const SITE_NAME = 'Smomo';
