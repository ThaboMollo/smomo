import { supabase } from '@/lib/supabase';

/** Minimal, dependency-free base64 -> Uint8Array decoder (for Storage uploads). */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const bytes = new Uint8Array((len * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = B64.indexOf(clean[i]);
    const e2 = B64.indexOf(clean[i + 1]);
    const e3 = B64.indexOf(clean[i + 2]);
    const e4 = B64.indexOf(clean[i + 3]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    if (p < bytes.length) bytes[p++] = c1;
    if (e3 !== -1 && p < bytes.length) bytes[p++] = c2;
    if (e4 !== -1 && p < bytes.length) bytes[p++] = c3;
  }
  return bytes;
}

export type PickedImage = {
  base64: string;
  mimeType?: string | null;
  fileName?: string | null;
};

/**
 * Uploads a picked image to a Storage bucket under `{userId}/...` (matches our RLS
 * folder convention). Returns the public URL for public buckets, else the storage path.
 */
export async function uploadImage(
  bucket: 'avatars' | 'portfolio' | 'proof-private' | 'request-photos',
  userId: string,
  image: PickedImage,
): Promise<string> {
  const ext = (image.mimeType?.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const path = `${userId}/${Date.now()}.${ext}`;
  const bytes = base64ToBytes(image.base64);

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: image.mimeType ?? 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  if (bucket === 'proof-private') return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
