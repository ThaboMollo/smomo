import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from '@/lib/upload';

function toPicked(result: ImagePicker.ImagePickerResult): PickedImage | null {
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  return {
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? null,
  };
}

/** Pick an image from the library (square crop). */
export async function pickFromLibrary(square = true): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: square ? [1, 1] : [4, 3],
    quality: 0.7,
    base64: true,
  });
  return toPicked(result);
}

/** Capture a photo with the camera (used for proof-of-work). */
export async function capturePhoto(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
    base64: true,
  });
  return toPicked(result);
}
