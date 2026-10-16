import type { ImageSlot } from '@domain/image';
import { Firebase } from '@services/firebase';

// Where the files of an image live in the bucket and how they are cached.
// Fixed slots keep their URLs, so a page links them without reading the
// database, and are only cached briefly; everything else is named by id and
// never changes.

export const slotWidths = [640, 1280, 1920];
export const galleryWidths = [480, 960, 1600];

export const SHORT_CACHE = 'public, max-age=300';
export const LONG_CACHE = 'public, max-age=31536000, immutable';

export const originalPath = (id: string) => `images/originals/${id}.webp`;
export const slotPrefix = (slot: ImageSlot) => `images/${slot}/`;
export const slotPath = (slot: ImageSlot, width: number) =>
  `${slotPrefix(slot)}${width}.webp`;
export const galleryPrefix = (id: string) => `images/gallery/${id}/`;
export const galleryPath = (id: string, width: number) =>
  `${galleryPrefix(id)}${width}.webp`;

/** The stored original, as the admin edits it */
export const originalUrl = (id: string) => Firebase.fileUrl(originalPath(id));
