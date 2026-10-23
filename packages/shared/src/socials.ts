import type { Enums } from './database';

/** Social platforms a practitioner can link. */
export type SocialPlatform = {
  /** Legacy practitioner_profiles column name. Dropped in migration 08 — prefer `platform`. */
  key: 'instagram' | 'facebook' | 'tiktok' | 'x_handle';
  /** practitioner_socials.platform enum value (migration 05). */
  platform: Enums<'social_platform'>;
  /** DTO key used in zSaveBusinessProfile (camelCase). */
  dtoKey: 'instagram' | 'facebook' | 'tiktok' | 'xHandle';
  label: string;
  /** Prefix prepended to the stored handle to form the public URL. */
  baseUrl: string;
  placeholder: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram', platform: 'instagram', dtoKey: 'instagram', label: 'Instagram', baseUrl: 'https://instagram.com/', placeholder: 'yourhandle' },
  { key: 'facebook', platform: 'facebook', dtoKey: 'facebook', label: 'Facebook', baseUrl: 'https://facebook.com/', placeholder: 'yourpage' },
  { key: 'x_handle', platform: 'x', dtoKey: 'xHandle', label: 'X', baseUrl: 'https://x.com/', placeholder: 'yourhandle' },
  { key: 'tiktok', platform: 'tiktok', dtoKey: 'tiktok', label: 'TikTok', baseUrl: 'https://tiktok.com/@', placeholder: 'yourhandle' },
];

/**
 * Reads a handle out of the `socials` object that practitioner_directory
 * returns (a jsonb map of platform -> handle).
 */
export function handleFromSocials(
  socials: unknown,
  platform: SocialPlatform,
): string | null {
  if (!socials || typeof socials !== 'object') return null;
  const value = (socials as Record<string, unknown>)[platform.platform];
  return typeof value === 'string' && value.length ? value : null;
}

/** Strip any leading @ / whitespace so a stored handle appends cleanly to a base URL. */
export function normalizeHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const cleaned = handle.trim().replace(/^@+/, '').trim();
  return cleaned.length ? cleaned : null;
}

/** Build the public profile URL for a platform + handle, or null if no handle. */
export function socialUrl(platform: SocialPlatform, handle: string | null | undefined): string | null {
  const h = normalizeHandle(handle);
  return h ? `${platform.baseUrl}${h}` : null;
}
