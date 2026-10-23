import { Space_Grotesk } from 'next/font/google';

/**
 * Display face for the SMOMO 2.0 landing page. Loaded here (not in the root layout)
 * so the other pages don't pay for a font they don't use. DM Sans (UI/body) is already
 * provided by the root layout as --font-dmsans.
 */
export const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
});
