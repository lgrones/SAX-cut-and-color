import { type ImageSlot, SiteImage } from '@domain/image';
import { Firebase } from '@services/firebase';

// Where the files of an image live in the bucket and how they are cached. Files
// are named by the image's id, and a slot's also by its crop, so a file never
// changes and is cached for good; the page finds them through the database.

export const slotWidths = [640, 960, 1280, 1920];
export const galleryWidths = [480, 960, 1600];

export const LONG_CACHE = 'public, max-age=31536000, immutable';

/**
 * The widths that get a file of their own. Variants are never upscaled, so of
 * the widths beyond the source's only the first is rendered, at the source's
 * width. A file's real width is `Math.min(width, sourceWidth)`.
 */
export const variantWidths = (widths: number[], sourceWidth: number) => {
  const larger = widths.find(x => x >= sourceWidth);
  return [...widths.filter(x => x < sourceWidth), ...(larger ? [larger] : [])];
};

export const originalPath = (id: string) => `images/originals/${id}.webp`;
export const slotPrefix = (slot: ImageSlot) => `images/${slot}/`;
/** The folder of a slot's image as cropped now: a new crop gets new URLs */
export const slotFolder = (slot: ImageSlot, image: SiteImage) => {
  const { left, top } = SiteImage.crop(image, SiteImage.slots[slot].aspect);
  return `${slotPrefix(slot)}${image.id}/${left}-${top}/`;
};
export const slotPath = (slot: ImageSlot, image: SiteImage, width: number) =>
  `${slotFolder(slot, image)}${width}.webp`;
export const galleryPrefix = (id: string) => `images/gallery/${id}/`;
export const galleryPath = (id: string, width: number) =>
  `${galleryPrefix(id)}${width}.webp`;

/** The stored original, as the admin edits it */
export const originalUrl = (id: string) => Firebase.fileUrl(originalPath(id));
