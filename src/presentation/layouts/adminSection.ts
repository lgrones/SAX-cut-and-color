import { PageSection } from '@domain/pageSection';

/** A page of the admin, named as in its URL */
export const AdminSection = {
  hours: PageSection.hours,
  prices: PageSection.prices,
  offers: PageSection.offers,
  images: 'images',
  contact: 'contact',
} as const;

export type AdminSection = (typeof AdminSection)[keyof typeof AdminSection];
