import {
  type GalleryImage,
  type ImageSlot,
  SiteImage,
  type SiteImages,
} from '@domain/image';

import { originalUrl } from './imageFiles';

/** An image with the URL of its original, which the admin edits */
export type EditableImage<T extends SiteImage = SiteImage> = T & {
  src: string;
};

export type EditableImages = Partial<
  Record<ImageSlot, EditableImage | undefined>
> & { gallery: EditableImage<GalleryImage>[] };

export const withOriginal = <T extends SiteImage>(
  image: T,
): EditableImage<T> => ({ ...image, src: originalUrl(image.id) });

/** The images with the URL of each original, as the admin edits them */
export const withOriginals = (images: SiteImages): EditableImages => {
  const editable: EditableImages = {
    gallery: images.gallery.map(withOriginal),
  };

  for (const slot of SiteImage.slotNames) {
    const image = images[slot];
    if (image) editable[slot] = withOriginal(image);
  }

  return editable;
};
