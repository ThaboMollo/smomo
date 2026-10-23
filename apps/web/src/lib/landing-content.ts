import type { CategorySlug } from '@/lib/catalog';

/**
 * Single source for landing-page copy, destinations and editorial imagery.
 * Every destination below is an existing route in this app; nothing is invented.
 */

export const ROUTES = {
  /** Public, SEO-indexed listing per category: /hairdressers, /nail-technicians, … */
  category: (c: CategorySlug) => `/${c}`,
  /** Full directory across all crafts. Signed-out visitors are sent to /login and returned (see middleware.ts). */
  discover: '/app/discover',
  /** Request-creation flow (same auth redirect behaviour). */
  postRequest: '/app/request/new',
  howItWorks: '/how-it-works',
  forPros: '/how-it-works#pros',
  login: '/login',
  register: '/register',
  /** Provider onboarding lives at /app/studio; /register?next= returns the new account there. */
  joinAsPro: '/register?next=%2Fapp%2Fstudio',
  studio: '/app/studio',
  loginAsPro: '/login?next=%2Fapp%2Fstudio',
  download: '/download',
  city: (slug: string) => `/city/${slug}`,
} as const;

/* ── Editorial image register ─────────────────────────────────────────────
   The IDs follow 03_Voice_and_Content/visual_asset_briefs.md in the rebrand handoff.
   There is no licensed or commissioned photography in the repo yet, and the
   existing /public/samples files are third-party images (one carries a visible
   watermark), so none are used here. Each slot renders a clearly labelled
   placeholder until `src` is set. To ship a photo: drop it in /public/editorial,
   set `src` (and keep `alt` accurate). The layout reserves its aspect ratio, so
   nothing shifts. */

export type Tone = 'ink' | 'pink' | 'lilac' | 'lime' | 'sand';

export type EditorialAsset = {
  id: string;
  /** CSS aspect-ratio, e.g. '4 / 5'. */
  ratio: string;
  tone: Tone;
  /** Short art-direction brief, shown on the placeholder chip. */
  brief: string;
  /** Alt text used once a real photo is supplied. */
  alt: string;
  /** Public path of the supplied photo, e.g. '/editorial/category-hair.avif'. */
  src?: string;
  /** CSS object-position, to protect the subject when the slot is cropped. */
  focal?: string;
};

/** Identity helper: keeps the keys as a literal union while typing every value as EditorialAsset. */
const defineAssets = <K extends string>(a: Record<K, EditorialAsset>) => a;

export const ASSETS = defineAssets({
  heroDesktop: {
    id: 'V01',
    ratio: '4 / 5',
    tone: 'ink',
    brief: 'Hero editorial: two styled South African creatives, deep ink studio',
    alt: 'A woman with a braided updo and long braids, in a deep burgundy and black studio setting.',
    src: '/editorial/hero-wide.webp',
    focal: '85% 30%',
  },
  heroMobile: {
    id: 'V02',
    ratio: '4 / 5',
    tone: 'ink',
    brief: 'Mobile hero: single expressive subject, eyes visible',
    alt: 'A woman with a high braided updo and gold hair cuffs, looking at the camera against a deep red backdrop.',
    src: '/editorial/hero-portrait.webp',
    focal: '50% 20%',
  },
  hair: {
    id: 'V03',
    ratio: '4 / 5',
    tone: 'ink',
    brief: 'Hair: close portrait, braids or locs, real strands',
    alt: 'A woman with long box braids and curly ends, glancing over her shoulder.',
    src: '/editorial/look-hair-braids.webp',
    focal: '50% 30%',
  },
  nails: {
    id: 'V04',
    ratio: '4 / 5',
    tone: 'lilac',
    brief: 'Nails: sculptural manicure macro',
    alt: 'A nail technician painting detail onto a client’s nails at a pink manicure station.',
    src: '/editorial/craft-nails-work.webp',
    focal: '45% 50%',
  },
  makeup: {
    id: 'V05',
    ratio: '4 / 5',
    tone: 'pink',
    brief: 'Make-up: glowing look on real skin',
    alt: 'Close portrait of a woman with a polished, glowing make-up look and cornrows.',
    src: '/editorial/look-makeup-portrait.webp',
    focal: '50% 35%',
  },
  beauty: {
    id: 'V06',
    ratio: '4 / 5',
    tone: 'lime',
    brief: 'Beauty: hands during a facial treatment',
    alt: 'A therapist giving a client a facial in a calm, warmly lit treatment room.',
    src: '/editorial/craft-facial.webp',
    focal: '55% 40%',
  },
  tattoo: {
    id: 'V07',
    ratio: '4 / 5',
    tone: 'sand',
    brief: 'Ink: artist showing finished, healed work',
    alt: 'A tattoo artist in black gloves tattooing a floral design on a client’s forearm.',
    src: '/editorial/craft-tattoo-work.webp',
    focal: '45% 45%',
  },
  creatorPortrait: {
    id: 'V08',
    ratio: '3 / 4',
    tone: 'pink',
    brief: 'Creator portrait: a working pro at their station',
    alt: 'A beauty professional in a cream shirt leaning against her treatment table in her studio.',
    src: '/editorial/creator-portrait.webp',
    focal: '27% 35%',
  },
  creatorProcess: {
    id: 'V09',
    ratio: '3 / 4',
    tone: 'lilac',
    brief: 'Process: hands in motion, technique and care',
    alt: 'A make-up artist’s hands laying out brushes and palettes on a burgundy towel.',
    src: '/editorial/creator-process.webp',
    focal: '55% 45%',
  },
  creatorWork: {
    id: 'V10',
    ratio: '4 / 5',
    tone: 'lime',
    brief: 'Finished work, paired with its creator',
    alt: 'A stylist shows a client a braided style on her phone while they talk it through.',
    src: '/editorial/consult-phone.webp',
    focal: '55% 40%',
  },
  proRecruitment: {
    id: 'V11',
    ratio: '16 / 10',
    tone: 'pink',
    brief: 'For pros: confident artist at their station, space for copy',
    alt: 'A stylist braiding a client’s hair in a bright salon with a large mirror.',
    src: '/editorial/craft-hair-salon.webp',
    focal: '45% 50%',
  },
  texture: {
    id: 'V12',
    ratio: '1 / 1',
    tone: 'sand',
    brief: 'Texture: tools, brushes, chrome, strands',
    alt: 'Macro still of beauty tools.',
  },
});

/** "Looks worth saving": staggered editorial grid of brand photography (not any one provider's portfolio). */
export const LOOK_TILES: {
  id: string;
  craft: CategorySlug;
  label: string;
  ratio: string;
  tone: Tone;
  src: string;
  alt: string;
  focal?: string;
}[] = [
  { id: 'L01', craft: 'hairdressers', label: 'Hair', ratio: '4 / 5', tone: 'ink', src: '/editorial/look-hair-updo.webp', alt: 'A braided updo styled against a deep red backdrop.', focal: '50% 30%' },
  { id: 'L02', craft: 'tattoo-artists', label: 'Tattoos', ratio: '1 / 1', tone: 'sand', src: '/editorial/look-tattoo-floral.webp', alt: 'A delicate fine-line floral tattoo wrapping a forearm.', focal: '50% 45%' },
  { id: 'L03', craft: 'makeup-artists', label: 'Make-up', ratio: '3 / 4', tone: 'pink', src: '/editorial/look-lips.webp', alt: 'Close-up of glossy lips with a warm rose finish.', focal: '50% 55%' },
  { id: 'L04', craft: 'hairdressers', label: 'Hair', ratio: '4 / 3', tone: 'lilac', src: '/editorial/craft-hair-mirror.webp', alt: 'A client admiring her new long braids in a salon mirror.', focal: '55% 40%' },
  { id: 'L05', craft: 'nail-technicians', label: 'Nails', ratio: '4 / 5', tone: 'lime', src: '/editorial/look-nails-chrome.webp', alt: 'Chrome and pearl almond nails resting on a wooden table.', focal: '50% 75%' },
  { id: 'L06', craft: 'makeup-artists', label: 'Make-up', ratio: '1 / 1', tone: 'ink', src: '/editorial/craft-makeup-work.webp', alt: 'A make-up artist blending eyeshadow on a client under vanity lights.', focal: '50% 40%' },
];

/** Five crafts, in display order, with the handoff's category microcopy. */
export const CRAFTS: {
  slug: CategorySlug;
  name: string;
  line: string;
  asset: keyof typeof ASSETS;
}[] = [
  { slug: 'hairdressers', name: 'Hair', line: 'Braids, cuts, colour, locs and more.', asset: 'hair' },
  { slug: 'nail-technicians', name: 'Nails', line: 'Sets, art and details worth a closer look.', asset: 'nails' },
  { slug: 'makeup-artists', name: 'Make-up', line: 'Everyday glam, special occasions and artistry.', asset: 'makeup' },
  { slug: 'beauticians', name: 'Beauty', line: 'Treatments that work for your needs.', asset: 'beauty' },
  { slug: 'tattoo-artists', name: 'Tattoos', line: 'Find an artist whose style speaks to you.', asset: 'tattoo' },
];

export const REQUEST_STEPS = [
  { n: '01', title: 'Tell us the look', body: 'Describe the service you’re looking for.' },
  { n: '02', title: 'Explore your offers', body: 'Review responses from interested professionals.' },
  { n: '03', title: 'Choose your person', body: 'Compare the details and decide who fits your needs.' },
] as const;

/**
 * Trust claims. Each one was checked against the code (apps/api, apps/web) on 2026-10-11.
 * Do not add a claim here without re-auditing it. In particular, the SA ID check is a
 * format (Luhn) check, so it is described as exactly that, never as identity verification.
 */
export const TRUST_ITEMS = [
  {
    title: 'Portfolios you can browse',
    body: 'Pros add photos of their work to their profile, so you can see their style before you get in touch.',
    icon: 'photos',
  },
  {
    title: 'Services and starting prices',
    body: 'Profiles list the services a pro offers with indicative prices. A quote for your look arrives as an offer on your request.',
    icon: 'list',
  },
  {
    title: 'Talk before you commit',
    body: 'Chat with a pro about the details, the place and the time, before anything is agreed.',
    icon: 'chat',
  },
  {
    title: 'Pay your pro directly',
    body: 'Payments go straight to your pro, by PayShap in South Africa, with deposits supported. SMOMO records the payment in the app; it doesn’t hold your money. Elsewhere, you agree the method in chat.',
    icon: 'pay',
  },
  {
    title: 'Account checks, described plainly',
    body: 'Pros add an ID number (SA ID, passport or national ID) before they can accept bookings. We check that the number is valid in format. It is not a background check.',
    icon: 'shield',
  },
  {
    title: 'A way to raise a problem',
    body: 'You can report a person or a booking from inside the app, and payment disputes are reviewed by the SMOMO team.',
    icon: 'flag',
  },
] as const;

export const PRO_BENEFITS = [
  'Showcase your work',
  'Present your services',
  'Receive relevant enquiries',
  'Connect with prospective clients',
] as const;
