import {
  type GalleryImage,
  type ImageSlot,
  SiteImage,
  type SiteImages,
} from '@domain/image';
import { Firebase } from '@services/firebase';
import { z } from 'astro/zod';
import sharp from 'sharp';

import { getImages } from './getImages';
import {
  galleryPath,
  galleryPrefix,
  galleryWidths,
  LONG_CACHE,
  originalPath,
  SHORT_CACHE,
  slotPath,
  slotPrefix,
  slotWidths,
} from './imageFiles';
import { renderVariants } from './renderVariants';

const focus = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
const ref = z.object({ id: z.uuid(), focus });

const schema = z.object({
  hero: ref.nullable(),
  portrait: ref.nullable(),
  map: ref.nullable(),
  gallery: z.array(ref.extend({ alt: z.string() })),
});

type Ref = z.infer<typeof ref>;

export type SaveImagesResult =
  | { ok: true; images: SiteImages }
  | { ok: false; message: string };

// Uploads nobody saved are kept this long, an admin may still be editing
const ABANDONED_AFTER_MS = 60 * 60 * 1000;

const sameFocus = (a: Ref['focus'], b: Ref['focus']) =>
  a.x === b.x && a.y === b.y;

/** The original's size, from the file, so a client can't make it up */
const loadOriginal = async ({ id, focus }: Ref) => {
  const source = await Firebase.downloadFile(originalPath(id));
  const { width, height } = await sharp(source).metadata();

  return { source, image: { id, width, height, focus } };
};

const saveSlot = async (
  slot: ImageSlot,
  next: Ref | null,
  stored: SiteImage | undefined,
): Promise<SiteImage | undefined> => {
  if (!next) {
    // an optional slot taken off the page
    if (stored) await deleteFiles(slotPrefix(slot));
    return undefined;
  }

  if (stored?.id === next.id && sameFocus(stored.focus, next.focus))
    return stored;

  const { source, image } = await loadOriginal(next);
  await renderVariants(
    source,
    slotWidths,
    width => slotPath(slot, width),
    SHORT_CACHE,
    SiteImage.crop(image, SiteImage.slots[slot].aspect),
  );

  return image;
};

const saveGalleryImage = async (
  next: Ref & { alt: string },
  stored: GalleryImage | undefined,
): Promise<GalleryImage> => {
  const alt = next.alt.trim();
  // the focus only positions the image on the page, the files stay
  if (stored) return { ...stored, focus: next.focus, alt };

  const { source, image } = await loadOriginal(next);
  await renderVariants(
    source,
    galleryWidths,
    width => galleryPath(image.id, width),
    LONG_CACHE,
  );

  return { ...image, alt };
};

const deleteFiles = async (prefix: string) => {
  for (const file of await Firebase.listFiles(prefix)) {
    await Firebase.deleteFile(file.path);
  }
};

const allImages = (images: SiteImages) => [
  ...SiteImage.slotNames.flatMap(slot => images[slot] ?? []),
  ...images.gallery,
];

/** Deletes the files of images no longer used, and long abandoned uploads */
const cleanUp = async (images: SiteImages, previous: SiteImages) => {
  const used = new Set(allImages(images).map(x => x.id));
  const replaced = new Set(
    allImages(previous).flatMap(x => (used.has(x.id) ? [] : [x.id])),
  );
  const cutoff = Date.now() - ABANDONED_AFTER_MS;

  for (const file of await Firebase.listFiles('images/originals/')) {
    const id = file.path.slice('images/originals/'.length, -'.webp'.length);
    if (used.has(id)) continue;
    if (replaced.has(id) || file.created.getTime() < cutoff) {
      await Firebase.deleteFile(file.path);
    }
  }

  for (const id of replaced) {
    await deleteFiles(galleryPrefix(id));
  }
};

/**
 * Applies the admin's images: renders what is new or newly cropped, stores the
 * list and removes files nothing uses anymore. Returns the images as stored.
 */
export const saveImages = async (input: unknown): Promise<SaveImagesResult> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const { gallery } = parsed.data;
  const problem = gallery.map(SiteImage.problem).find(x => x);
  if (problem) return { ok: false, message: problem };

  const previous = await getImages();

  // a required slot can be replaced, but the page always links it
  const removesRequired = SiteImage.slotNames.some(
    slot =>
      !SiteImage.slots[slot].optional && previous[slot] && !parsed.data[slot],
  );
  if (removesRequired) return { ok: false, message: 'Ungültige Eingabe' };

  const images: SiteImages = { gallery: [] };
  for (const slot of SiteImage.slotNames) {
    const saved = await saveSlot(slot, parsed.data[slot], previous[slot]);
    if (saved) images[slot] = saved;
  }

  for (const next of gallery) {
    const stored = previous.gallery.find(x => x.id === next.id);
    images.gallery.push(await saveGalleryImage(next, stored));
  }

  await Firebase.setDocument('images', 'site', images);
  await cleanUp(images, previous);

  return { ok: true, images };
};
