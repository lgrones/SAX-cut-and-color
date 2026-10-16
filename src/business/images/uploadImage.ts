import type { SiteImage } from '@domain/image';
import { Firebase } from '@services/firebase';
import sharp from 'sharp';

import { LONG_CACHE, originalPath } from './imageFiles';

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 2560;
const ATTENTION_SIZE = 256;

export type UploadImageResult =
  | { ok: true; image: SiteImage }
  | { ok: false; message: string };

/**
 * Stores an uploaded photo as the original all variants are made from: turned
 * upright, at most 2560px and without metadata (phone photos carry the GPS
 * position). Suggests a focus from what draws attention in it.
 */
export const uploadImage = async (
  data: Uint8Array,
): Promise<UploadImageResult> => {
  if (data.byteLength > MAX_BYTES) {
    return { ok: false, message: 'Das Bild ist größer als 25 MB' };
  }

  const original = await sharp(data)
    .rotate()
    .resize({
      width: MAX_SIDE,
      height: MAX_SIDE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => undefined);

  if (!original) {
    return { ok: false, message: 'Das Bild konnte nicht gelesen werden' };
  }

  const { width, height } = original.info;

  // sharp reports attention in pixels of the input, not of the resized image
  const { info } = await sharp(original.data)
    .resize({
      width: ATTENTION_SIZE,
      height: ATTENTION_SIZE,
      fit: 'cover',
      position: sharp.strategy.attention,
    })
    .toBuffer({ resolveWithObject: true });

  const fraction = (value: number | undefined, size: number) =>
    value === undefined ? 0.5 : Math.min(1, Math.max(0, value / size));

  const focus = {
    x: fraction(info.attentionX, width),
    y: fraction(info.attentionY, height),
  };

  const id = crypto.randomUUID();

  await Firebase.uploadFile(
    originalPath(id),
    original.data,
    'image/webp',
    LONG_CACHE,
  );

  return { ok: true, image: { id, width, height, focus } };
};
