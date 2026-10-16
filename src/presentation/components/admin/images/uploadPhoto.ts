import type { SiteImage } from '@domain/image';

import { type SaveResult, uploadRequest } from '../editor/saveRequest';

// Shrunk in the browser first: less mobile data, and formats the server can't
// read (HEIC from iPhones) arrive as JPEG, since the browser decodes them
const MAX_SIDE = 2560;

const shrink = async (file: File): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('toBlob'))),
        'image/jpeg',
        0.9,
      ),
    );
  } catch {
    // the server tries the original
    return file;
  }
};

/** An uploaded image with the URL of its original */
export type UploadedImage = SiteImage & { src: string };

export const uploadPhoto = async (file: File): Promise<SaveResult> => {
  const form = new FormData();
  form.append('image', await shrink(file), 'photo.jpg');

  return uploadRequest('/api/images/upload', form);
};
