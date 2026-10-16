import {
  type Focus,
  type GalleryImage,
  SiteImage,
  type SiteImages,
} from '@domain/image';
import type { FirestoreDocument } from '@services/firebase';

const number = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const mapFocus = (value: unknown): Focus => {
  const focus = (value ?? {}) as Record<string, unknown>;
  return { x: number(focus.x, 0.5), y: number(focus.y, 0.5) };
};

const mapImage = (value: unknown): SiteImage | undefined => {
  const image = (value ?? {}) as Record<string, unknown>;
  if (typeof image.id !== 'string') return undefined;

  return {
    id: image.id,
    width: number(image.width, 0),
    height: number(image.height, 0),
    focus: mapFocus(image.focus),
  };
};

const mapGalleryImage = (value: unknown): GalleryImage[] => {
  const image = mapImage(value);
  const alt = (value as Record<string, unknown>).alt;

  return image ? [{ ...image, alt: typeof alt === 'string' ? alt : '' }] : [];
};

export const mapImages = (
  document: FirestoreDocument | undefined,
): SiteImages => {
  const data = document?.data ?? {};
  const images: SiteImages = {
    gallery: Array.isArray(data.gallery)
      ? data.gallery.flatMap(mapGalleryImage)
      : [],
  };

  for (const slot of SiteImage.slotNames) {
    const image = mapImage(data[slot]);
    if (image) images[slot] = image;
  }

  return images;
};
