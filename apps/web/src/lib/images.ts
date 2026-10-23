/**
 * Upsize Unsplash avatars (seeded at 256px) for use as card photos.
 * Other hosts are returned unchanged.
 */
export function cardPhoto(url: string | null | undefined, size = 640): string | null {
  if (!url) return null;
  if (url.includes('images.unsplash.com')) {
    return url
      .replace(/([?&])w=\d+/, `$1w=${size}`)
      .replace(/([?&])h=\d+/, `$1h=${Math.round(size * 1.15)}`);
  }
  return url;
}
