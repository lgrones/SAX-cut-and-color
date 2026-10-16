import { type ImageSlot, SiteImage } from '@domain/image';
import { Firebase } from '@services/firebase';

import { slotPath, slotWidths } from './imageFiles';
import type { ImageSource } from './imageSource';

/**
 * A fixed slot's image. Needs no database: the files are stored already cropped
 * under fixed URLs, so a prerendered page can link them and a replaced image
 * shows up within the short cache time.
 */
export const getSlotImage = (slot: ImageSlot): ImageSource => {
  const { aspect, alt } = SiteImage.slots[slot];
  const url = (width: number) => Firebase.fileUrl(slotPath(slot, width));

  return {
    src: url(1280),
    srcset: slotWidths.map(x => `${url(x)} ${x}w`).join(', '),
    width: 1280,
    height: Math.round(1280 / aspect),
    alt,
    objectPosition: '50% 50%',
  };
};
