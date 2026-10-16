import { Firebase } from '@services/firebase';
import sharp from 'sharp';

interface Region {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Stores the image, optionally cropped, as WebP at each width, never upscaled */
export const renderVariants = async (
  source: Buffer,
  widths: number[],
  path: (width: number) => string,
  cacheControl: string,
  region?: Region,
) => {
  for (const width of widths) {
    const image = sharp(source);
    if (region) image.extract(region);

    const data = await image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    await Firebase.uploadFile(path(width), data, 'image/webp', cacheControl);
  }
};
