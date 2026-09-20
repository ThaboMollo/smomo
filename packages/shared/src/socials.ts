/** Social platforms a practitioner can link. `key` matches DB columns / DTO keys. */
export type SocialPlatform = {
  key: 'instagram' | 'facebook' | 'tiktok' | 'x_handle';
  /** DTO key used in zSaveBusinessProfile (camelCase). */
  dtoKey: 'instagram' | 'facebook' | 'tiktok' | 'xHandle';
  label: string;
  /** Prefix prepended to the stored handle to form the public URL. */
  baseUrl: string;
  placeholder: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram', dtoKey: 'instagram', label: 'Instagram', baseUrl: 'https://instagram.com/', placeholder: 'yourhandle' },
  { key: 'facebook', dtoKey: 'facebook', label: 'Facebook', baseUrl: 'https://facebook.com/', placeholder: 'yourpage' },
  { key: 'x_handle', dtoKey: 'xHandle', label: 'X', baseUrl: 'https://x.com/', placeholder: 'yourhandle' },
  { key: 'tiktok', dtoKey: 'tiktok', label: 'TikTok', baseUrl: 'https://tiktok.com/@', placeholder: 'yourhandle' },
];

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
