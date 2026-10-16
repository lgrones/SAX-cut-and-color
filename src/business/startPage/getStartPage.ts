import { getImages } from '@business/images/getImages';
import { getSlotImage } from '@business/images/getSlotImage';
import type { ImageSource } from '@business/images/imageSource';
import { mapGallery } from '@business/images/mapGallery';
import { getOffers } from '@business/offers/getOffers';
import { getOpeningHours } from '@business/openingHours/getOpeningHours';
import { getHiddenSections } from '@business/pageSections/getHiddenSections';
import { getPrices } from '@business/prices/getPrices';
import { ImageSlot } from '@domain/image';
import type { Offer } from '@domain/offer';
import { OpeningHours } from '@domain/openingHours';
import { PageSection } from '@domain/pageSection';
import type { Price } from '@domain/price';

/**
 * The content of the start page's sections. A section the admin switched off or
 * that has nothing to show comes back empty, so the page leaves it out.
 */
export interface StartPage {
  prices: Price[];
  offers: Offer[];
  gallery: ImageSource[];
  /** Monday first, or empty */
  hours: OpeningHours[];
  /** The slot images, each left out while the admin has stored none */
  hero: ImageSource | undefined;
  portrait: ImageSource | undefined;
  map: ImageSource | undefined;
}

export const getStartPage = async (): Promise<StartPage> => {
  const [hidden, prices, offers, images, week] = await Promise.all([
    getHiddenSections(),
    getPrices(),
    getOffers(),
    getImages(),
    getOpeningHours(),
  ]);

  return {
    prices: hidden.includes(PageSection.prices) ? [] : prices,
    offers: hidden.includes(PageSection.offers) ? [] : offers,
    gallery: mapGallery(images.gallery),
    hero: images.hero && getSlotImage(ImageSlot.hero, images.hero),
    portrait:
      images.portrait && getSlotImage(ImageSlot.portrait, images.portrait),
    map: images.map && getSlotImage(ImageSlot.map, images.map),
    hours:
      hidden.includes(PageSection.hours) || !OpeningHours.anyOpen(week)
        ? []
        : week,
  };
};
