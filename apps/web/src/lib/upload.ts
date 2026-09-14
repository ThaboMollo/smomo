import { createClient } from '@/lib/supabase/client';

export type StorageBucket = 'portfolio' | 'avatars' | 'request-photos' | 'proof-private';

/** Upload an image to a Storage bucket and return its public URL. */
export async function uploadImage(bucket: StorageBucket, file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
