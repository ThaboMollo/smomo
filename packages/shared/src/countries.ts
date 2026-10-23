/**
 * The countries SMOMO serves, with the facts the apps need to be correct in each:
 * dial code and number shape (for phone input), a map centre and bounding box (for
 * address search and map defaults), and the main cities (for SEO pages and the finder).
 *
 * No currency conversion lives here on purpose. Prices are still stored and shown in
 * South African rand everywhere (see formatZar); `currency` is informational only.
 */

export type CountryCode = 'ZA' | 'LS' | 'SZ' | 'BW' | 'ZW' | 'NA';

export type City = {
  /** URL slug, e.g. 'cape-town'. Kept stable: it is used in public URLs. */
  slug: string;
  name: string;
  lat: number;
  lng: number;
};

export type Country = {
  code: CountryCode;
  /** URL slug for the country hub page. */
  slug: string;
  name: string;
  /** Other names people search for or still use. */
  aka: string[];
  /** International dial code without '+'. */
  dial: string;
  /** National trunk prefix people type before the number, if the country uses one. */
  trunk: '0' | null;
  /** Valid lengths of the national (significant) number, excluding the trunk prefix. */
  nsn: number[];
  /** How a local number is written, for placeholders. */
  example: string;
  currency: string;
  center: { lat: number; lng: number };
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
  cities: City[];
};

export const COUNTRIES: Record<CountryCode, Country> = {
  ZA: {
    code: 'ZA',
    slug: 'south-africa',
    name: 'South Africa',
    aka: [],
    dial: '27',
    trunk: '0',
    nsn: [9],
    example: '082 123 4567',
    currency: 'ZAR',
    center: { lat: -28.5, lng: 24.7 },
    bbox: [16.3, -34.9, 32.9, -22.1],
    cities: [
      { slug: 'cape-town', name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
      { slug: 'johannesburg', name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
      { slug: 'durban', name: 'Durban', lat: -29.8587, lng: 31.0218 },
      { slug: 'pretoria', name: 'Pretoria', lat: -25.7479, lng: 28.2293 },
      { slug: 'gqeberha', name: 'Gqeberha', lat: -33.9608, lng: 25.6022 },
      { slug: 'bloemfontein', name: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
      { slug: 'east-london', name: 'East London', lat: -33.0153, lng: 27.9116 },
      { slug: 'polokwane', name: 'Polokwane', lat: -23.9045, lng: 29.4689 },
      { slug: 'nelspruit', name: 'Nelspruit', lat: -25.4753, lng: 30.9694 },
      { slug: 'kimberley', name: 'Kimberley', lat: -28.7282, lng: 24.7499 },
    ],
  },
  LS: {
    code: 'LS',
    slug: 'lesotho',
    name: 'Lesotho',
    aka: [],
    dial: '266',
    trunk: null,
    nsn: [8],
    example: '5812 3456',
    currency: 'LSL',
    center: { lat: -29.61, lng: 28.23 },
    bbox: [27.0, -30.7, 29.5, -28.5],
    cities: [
      { slug: 'maseru', name: 'Maseru', lat: -29.3167, lng: 27.4833 },
      { slug: 'maputsoe', name: 'Maputsoe', lat: -28.8833, lng: 27.9 },
      { slug: 'hlotse', name: 'Hlotse', lat: -28.8833, lng: 28.05 },
      { slug: 'teyateyaneng', name: 'Teyateyaneng', lat: -29.15, lng: 27.75 },
      { slug: 'mafeteng', name: 'Mafeteng', lat: -29.8167, lng: 27.2333 },
      { slug: 'quthing', name: 'Quthing', lat: -30.4, lng: 27.7 },
    ],
  },
  SZ: {
    code: 'SZ',
    slug: 'eswatini',
    name: 'Eswatini',
    aka: ['Swaziland'],
    dial: '268',
    trunk: null,
    nsn: [8],
    example: '7612 3456',
    currency: 'SZL',
    center: { lat: -26.52, lng: 31.47 },
    bbox: [30.7, -27.4, 32.2, -25.7],
    cities: [
      { slug: 'mbabane', name: 'Mbabane', lat: -26.3167, lng: 31.1333 },
      { slug: 'manzini', name: 'Manzini', lat: -26.4833, lng: 31.3667 },
      { slug: 'lobamba', name: 'Lobamba', lat: -26.4667, lng: 31.2 },
      { slug: 'siteki', name: 'Siteki', lat: -26.45, lng: 31.95 },
      { slug: 'piggs-peak', name: 'Piggs Peak', lat: -25.9667, lng: 31.25 },
      { slug: 'nhlangano', name: 'Nhlangano', lat: -27.1167, lng: 31.2 },
    ],
  },
  BW: {
    code: 'BW',
    slug: 'botswana',
    name: 'Botswana',
    aka: [],
    dial: '267',
    trunk: null,
    nsn: [7, 8],
    example: '71 234 567',
    currency: 'BWP',
    center: { lat: -22.33, lng: 24.68 },
    bbox: [19.9, -26.9, 29.4, -17.7],
    cities: [
      { slug: 'gaborone', name: 'Gaborone', lat: -24.6282, lng: 25.9231 },
      { slug: 'francistown', name: 'Francistown', lat: -21.17, lng: 27.5084 },
      { slug: 'maun', name: 'Maun', lat: -19.9833, lng: 23.4167 },
      { slug: 'molepolole', name: 'Molepolole', lat: -24.4067, lng: 25.495 },
      { slug: 'kasane', name: 'Kasane', lat: -17.8, lng: 25.15 },
      { slug: 'serowe', name: 'Serowe', lat: -22.3833, lng: 26.7167 },
    ],
  },
  ZW: {
    code: 'ZW',
    slug: 'zimbabwe',
    name: 'Zimbabwe',
    aka: [],
    dial: '263',
    trunk: '0',
    nsn: [9],
    example: '077 123 4567',
    currency: 'ZWG',
    center: { lat: -19.02, lng: 29.15 },
    bbox: [25.2, -22.5, 33.1, -15.6],
    cities: [
      { slug: 'harare', name: 'Harare', lat: -17.8252, lng: 31.0335 },
      { slug: 'bulawayo', name: 'Bulawayo', lat: -20.15, lng: 28.5833 },
      { slug: 'mutare', name: 'Mutare', lat: -18.9707, lng: 32.6709 },
      { slug: 'gweru', name: 'Gweru', lat: -19.45, lng: 29.8167 },
      { slug: 'victoria-falls', name: 'Victoria Falls', lat: -17.9243, lng: 25.8572 },
      { slug: 'masvingo', name: 'Masvingo', lat: -20.0637, lng: 30.8277 },
    ],
  },
  NA: {
    code: 'NA',
    slug: 'namibia',
    name: 'Namibia',
    aka: [],
    dial: '264',
    trunk: '0',
    nsn: [8, 9],
    example: '081 123 4567',
    currency: 'NAD',
    center: { lat: -22.96, lng: 18.49 },
    bbox: [11.7, -29.0, 25.3, -16.9],
    cities: [
      { slug: 'windhoek', name: 'Windhoek', lat: -22.5609, lng: 17.0658 },
      { slug: 'walvis-bay', name: 'Walvis Bay', lat: -22.9576, lng: 14.5053 },
      { slug: 'swakopmund', name: 'Swakopmund', lat: -22.6792, lng: 14.5266 },
      { slug: 'oshakati', name: 'Oshakati', lat: -17.7886, lng: 15.687 },
      { slug: 'rundu', name: 'Rundu', lat: -17.9333, lng: 19.7667 },
      { slug: 'katima-mulilo', name: 'Katima Mulilo', lat: -17.5, lng: 24.2667 },
    ],
  },
};

/** Display order: the home market first, then its neighbours. */
export const COUNTRY_LIST: Country[] = (['ZA', 'LS', 'SZ', 'BW', 'ZW', 'NA'] as CountryCode[]).map((c) => COUNTRIES[c]);
export const COUNTRY_CODES = COUNTRY_LIST.map((c) => c.code);

export function isCountryCode(v: string | null | undefined): v is CountryCode {
  return !!v && v.toUpperCase() in COUNTRIES;
}

export function countryBySlug(slug: string): Country | null {
  return COUNTRY_LIST.find((c) => c.slug === slug) ?? null;
}

/** Every city we publish a page for, with its country. */
export const ALL_CITIES: (City & { country: CountryCode })[] = COUNTRY_LIST.flatMap((c) =>
  c.cities.map((city) => ({ ...city, country: c.code })),
);

export function cityBySlug(slug: string): (City & { country: CountryCode }) | null {
  return ALL_CITIES.find((c) => c.slug === slug) ?? null;
}

/**
 * Best-effort country from free text such as "12 Main Rd, Maseru, Lesotho".
 * Matches whole country names and known alternative names (Swaziland), nothing fuzzier,
 * so it returns null rather than guessing.
 */
export function detectCountry(text: string | null | undefined): CountryCode | null {
  if (!text) return null;
  const hay = text.toLowerCase();
  for (const c of COUNTRY_LIST) {
    for (const name of [c.name, ...c.aka]) {
      if (new RegExp(`(^|[^a-z])${name.toLowerCase()}([^a-z]|$)`).test(hay)) return c.code;
    }
  }
  return null;
}

/** Country for an E.164 number, by dial code (longest match wins). */
export function countryFromE164(e164: string | null | undefined): CountryCode | null {
  if (!e164?.startsWith('+')) return null;
  const digits = e164.slice(1);
  const hit = [...COUNTRY_LIST].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
  return hit?.code ?? null;
}
