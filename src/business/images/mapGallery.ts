import { type GalleryImage, SiteImage } from '@domain/image';
import { Firebase } from '@services/firebase';

import { galleryPath, galleryWidths } from './imageFiles';
import { type ImageSource, variantSources } from './imageSource';

/** The gallery in display order, ready for `<img>` with `object-fit: cover` */
export const mapGallery = (gallery: GalleryImage[]): ImageSource[] =>
  gallery.map(image => ({
    ...variantSources(galleryWidths, image.width, width =>
      Firebase.fileUrl(galleryPath(image.id, width)),
    ),
    width: image.width,
    height: image.height,
    alt: image.alt,
    objectPosition: SiteImage.objectPosition(image.focus),
  }));
