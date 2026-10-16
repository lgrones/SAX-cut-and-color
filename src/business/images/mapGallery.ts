import { SiteImage } from '@domain/image';
import { Firebase } from '@services/firebase';

import { getImages } from './getImages';
import { galleryPath, galleryWidths } from './imageFiles';
import type { ImageSource } from './imageSource';

/** The gallery in display order, ready for `<img>` with `object-fit: cover` */
export const getGallery = async (): Promise<ImageSource[]> => {
  const { gallery } = await getImages();

  return gallery.map(image => {
    const url = (width: number) =>
      Firebase.fileUrl(galleryPath(image.id, width));
    // Variants are never upscaled, so of the widths beyond the original's
    // only the first is a distinct file, at the original's width
    const larger = galleryWidths.find(x => x >= image.width);
    const widths = [
      ...galleryWidths.filter(x => x < image.width),
      ...(larger ? [larger] : []),
    ];

    return {
      src: url(widths.includes(960) ? 960 : (widths.at(-1) ?? 480)),
      srcset: widths
        .map(x => `${url(x)} ${Math.min(x, image.width)}w`)
        .join(', '),
      width: image.width,
      height: image.height,
      alt: image.alt,
      objectPosition: SiteImage.objectPosition(image.focus),
    };
  });
};
