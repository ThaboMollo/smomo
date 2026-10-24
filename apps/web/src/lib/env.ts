// Server-side uses API_URL; browser uses NEXT_PUBLIC_API_URL. Falls back to local dev.
export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smomo.vercel.app';
export const SITE_NAME = 'SMOMO';

/**
 * The SMOMO Console (`apps/admin`) — where professionals run their business and staff
 * administer the platform. Those screens used to live here under `/app`; they moved so
 * there is one implementation of each rather than two that drift.
 *
 * Needs `NEXT_PUBLIC_` because the nav links to it from the browser. Defaults to the local
 * dev port so a fresh checkout works without configuring anything.
 */
export const CONSOLE_URL = process.env.NEXT_PUBLIC_CONSOLE_URL ?? 'http://localhost:3001';
