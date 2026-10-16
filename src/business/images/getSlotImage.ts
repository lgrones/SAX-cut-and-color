import { type ImageSlot, SiteImage } from '@domain/image';
import { Firebase } from '@services/firebase';

import { slotPath, slotWidths } from './imageFiles';
import { type ImageSource, variantSources } from './imageSource';

/**
 * A fixed slot's image, from files stored already cropped, so it fills its
 * place as it is
 */
export const getSlotImage = (
  slot: ImageSlot,
  image: SiteImage,
): ImageSource => {
  const { aspect, alt } = SiteImage.slots[slot];
  const { width, height } = SiteImage.crop(image, aspect);

  return {
    ...variantSources(slotWidths, width, x =>
      Firebase.fileUrl(slotPath(slot, image, x)),
    ),
    width,
    height,
    alt,
    objectPosition: '50% 50%',
  };
};
